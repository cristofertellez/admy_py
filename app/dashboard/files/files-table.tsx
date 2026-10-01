"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { FormField, FormSelect } from "@/components/forms";
import {
  uploadFile,
  getFileUrl,
  deleteFile,
  moveFile,
  restoreFileVersion,
  shareFile,
  unshareFile,
} from "@/actions/files";
import { FilesService, FILE_ACCESS_LEVELS } from "@/features/files";
import { useActionState, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import JSZip from "jszip";

interface FileRow {
  id: string;
  filename: string;
  extension: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  entity_type: string;
  entity_id: string;
  category: string;
  version: number;
  version_of: string | null;
  created_at: string;
  bucket: string;
  storage_path: string;
  users: { first_name: string; last_name: string } | null;
  deleted_at: string | null;
  is_active: number;
}

interface FileStats {
  total: number;
  bytesUsed: number;
  recent: FileRow[];
}

const entityTypeOpts = [
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "client", label: "Client" },
  { value: "milestone", label: "Milestone" },
];

function formatSize(sizeBytes: number | null): string {
  if (!sizeBytes) return "—";
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(0)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return (
    mimeType === "application/pdf" || mimeType.startsWith("image/")
  );
}

interface FilesTableProps {
  files: FileRow[];
  stats: FileStats;
  categories: string[];
  canUpload: boolean;
  canDelete: boolean;
}

export function FilesTable({ files, stats, categories, canUpload, canDelete }: FilesTableProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<FileRow | null>(null);
  const [activeFile, setActiveFile] = useState<FileRow | null>(null);
  const [panel, setPanel] = useState<"versions" | "move" | "share" | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  const selectedRows = files.filter((f) => selectedIds.includes(f.id));

  const columns: ColumnDef<FileRow>[] = [
    {
      id: "select",
      enableSorting: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Select all files"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="rounded accent-primary"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.original.filename}`}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded accent-primary"
        />
      ),
    },
    {
      accessorKey: "filename",
      header: "File",
      cell: ({ row }) => (
        <div>
          <p className="text-body-sm text-body-strong">{row.original.filename}</p>
          <p className="text-caption text-muted">
            {row.original.entity_type} / {formatSize(row.original.size_bytes)}
            {row.original.version > 1 ? ` · v${row.original.version}` : ""}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
    },
    {
      accessorKey: "extension",
      header: "Type",
      cell: ({ getValue }) => <Badge variant="default">{(getValue() as string) || "—"}</Badge>,
    },
    {
      accessorKey: "users",
      header: "Uploaded by",
      cell: ({ getValue }) => {
        const u = getValue() as FileRow["users"];
        return u ? `${u.first_name} ${u.last_name}` : "—";
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <FileActions
          file={row.original}
          canDelete={canDelete}
          onPreview={(f) => setPreview(f)}
          onOpenPanel={(f, p) => {
            setActiveFile(f);
            setPanel(p);
          }}
        />
      ),
    },
  ];

  async function handleZipDownload() {
    if (selectedRows.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const file of selectedRows) {
        const res = await getFileUrl(file.id);
        const url = (res as { success?: string }).success;
        if (!url) continue;
        const blob = await fetch(url).then((r) => r.blob());
        zip.file(file.filename, blob);
      }
      const buffer = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(buffer);
      link.download = "files.zip";
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setIsZipping(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-display-md text-ink">{stats.total}</p>
            <p className="text-caption text-muted">Total Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-display-md text-ink">{formatSize(stats.bytesUsed)}</p>
            <p className="text-caption text-muted">Storage Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-display-md text-ink">{files.length}</p>
            <p className="text-caption text-muted">Visible Files</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {selectedRows.length > 0 && (
          <Button variant="secondary" onClick={handleZipDownload} disabled={isZipping}>
            {isZipping ? "Zipping..." : `Download ${selectedRows.length} as ZIP`}
          </Button>
        )}
        {canUpload && <Button onClick={() => setShowUpload(true)}>Upload File</Button>}
      </div>

      <DataTable
        columns={columns}
        data={files}
        searchColumn="filename"
        enableRowSelection
        getRowId={(row) => row.id}
        onRowSelectionChange={(sel) => setSelectedIds(Object.keys(sel))}
        pageSize={50}
      />

      {showUpload && (
        <FileUploadModal
          categories={categories}
          onClose={() => setShowUpload(false)}
          onSuccess={() => setShowUpload(false)}
        />
      )}

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}

      {activeFile && panel === "versions" && (
        <VersionsPanel file={activeFile} canUpload={canUpload} onClose={() => setPanel(null)} />
      )}
      {activeFile && panel === "move" && (
        <MovePanel file={activeFile} onClose={() => setPanel(null)} />
      )}
      {activeFile && panel === "share" && (
        <SharePanel file={activeFile} onClose={() => setPanel(null)} />
      )}
    </div>
  );
}

function FileActions({
  file,
  canDelete,
  onPreview,
  onOpenPanel,
}: {
  file: FileRow;
  canDelete: boolean;
  onPreview: (f: FileRow) => void;
  onOpenPanel: (f: FileRow, panel: "versions" | "move" | "share") => void;
}) {
  const [, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await getFileUrl(file.id);
      if ((result as { success?: string }).success) {
        window.open((result as { success: string }).success, "_blank");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${file.filename}"?`)) return;
    startTransition(async () => {
      await deleteFile(file.id);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {isPreviewable(file.mime_type) && (
        <button onClick={() => onPreview(file)} className="text-body-sm text-primary hover:underline">
          Preview
        </button>
      )}
      <button onClick={handleDownload} className="text-body-sm text-primary hover:underline">
        Download
      </button>
      <button onClick={() => onOpenPanel(file, "versions")} className="text-body-sm text-primary hover:underline">
        Versions
      </button>
      <button onClick={() => onOpenPanel(file, "move")} className="text-body-sm text-primary hover:underline">
        Move
      </button>
      <button onClick={() => onOpenPanel(file, "share")} className="text-body-sm text-primary hover:underline">
        Share
      </button>
      {canDelete && (
        <button onClick={handleDelete} className="text-body-sm text-error hover:underline">
          Delete
        </button>
      )}
    </div>
  );
}

function FileUploadModal({
  categories,
  onClose,
  onSuccess,
}: {
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(uploadFile, null);

  return (
    <ModalShell title="Upload File" onClose={onClose}>
      {state?.success ? (
        <SuccessBody message={state.success} onDone={onSuccess} />
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <FormSelect label="Entity Type" name="entity_type" options={entityTypeOpts} required />
          <FormField label="Entity ID" name="entity_id" required />
          <FormSelect
            label="Category"
            name="category"
            options={categories.map((c) => ({ value: c, label: c }))}
            defaultValue="Otros"
          />
          <FormField label="File" name="file" type="file" required />
          {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

function PreviewModal({ file, onClose }: { file: FileRow; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useQuery({
    queryKey: ["file-preview", file.id],
    queryFn: async () => {
      const res = await getFileUrl(file.id);
      if ((res as { success?: string }).success) setUrl((res as { success: string }).success);
      else setError((res as { error?: string }).error || "Could not preview.");
      return null;
    },
  });

  return (
    <ModalShell title={file.filename} onClose={onClose} wide>
      {error && <p className="text-body-sm text-error">{error}</p>}
      {!error && !url && <p className="text-body-sm text-muted">Loading preview...</p>}
      {url && file.mime_type === "application/pdf" && (
        <iframe src={url} title={file.filename} className="h-[60vh] w-full rounded-md border border-hairline" />
      )}
      {url && file.mime_type?.startsWith("image/") && (
        <img src={url} alt={file.filename} className="max-h-[60vh] w-full rounded-md object-contain" />
      )}
    </ModalShell>
  );
}

function VersionsPanel({ file, canUpload, onClose }: { file: FileRow; canUpload: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(uploadFile, null);

  const { data } = useQuery({
    queryKey: ["file-versions", file.id],
    queryFn: () => FilesService.listVersions(file.id),
  });

  const versions = (data as unknown as FileRow[]) ?? [];

  return (
    <ModalShell title={`Versions — ${file.filename}`} onClose={onClose} wide>
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="flex items-center gap-3 rounded-lg border border-hairline p-3">
            <span className="text-body-sm font-medium">v{v.version}</span>
            <span className="text-caption text-muted">{new Date(v.created_at).toLocaleDateString()}</span>
            <span className="text-caption text-muted">{formatSize(v.size_bytes)}</span>
            {v.is_active === 1 && <Badge variant="success">Active</Badge>}
            <span className="ml-auto flex gap-2">
              <button
                onClick={async () => {
                  const res = await getFileUrl(v.id);
                  if ((res as { success?: string }).success) window.open((res as { success: string }).success, "_blank");
                }}
                className="text-body-sm text-primary hover:underline"
              >
                Download
              </button>
              {v.is_active !== 1 && canUpload && (
                <button
                  onClick={async () => {
                    await restoreFileVersion(v.id);
                    queryClient.invalidateQueries({ queryKey: ["file-versions", file.id] });
                  }}
                  className="text-body-sm text-primary hover:underline"
                >
                  Restore
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {canUpload && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-lg border border-hairline p-3">
          <p className="text-body-sm font-medium">Upload new version</p>
          <input type="hidden" name="entity_type" value={file.entity_type} />
          <input type="hidden" name="entity_id" value={file.entity_id} />
          <input type="hidden" name="category" value={file.category} />
          <input type="hidden" name="version_of" value={file.id} />
          <FormField label="File" name="file" type="file" required />
          {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Uploading..." : "Upload Version"}
          </Button>
        </form>
      )}
    </ModalShell>
  );
}

function MovePanel({ file, onClose }: { file: FileRow; onClose: () => void }) {
  const [entityType, setEntityType] = useState(file.entity_type);
  const [entityId, setEntityId] = useState(file.entity_id);
  const [state, setState] = useState<{ success?: string; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMove() {
    startTransition(async () => {
      const res = await moveFile(file.id, entityType, entityId);
      setState(res);
    });
  }

  return (
    <ModalShell title={`Move — ${file.filename}`} onClose={onClose}>
      {state?.success ? <SuccessBody message={state.success} onDone={onClose} /> : (
        <div className="flex flex-col gap-4">
          <FormSelect label="Entity Type" name="entity_type" options={entityTypeOpts} value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          <FormField label="Entity ID" name="entity_id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
          {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleMove} disabled={isPending} className="flex-1">
              {isPending ? "Moving..." : "Move"}
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function SharePanel({ file, onClose }: { file: FileRow; onClose: () => void }) {
  const [entityType, setEntityType] = useState("client");
  const [entityId, setEntityId] = useState("");
  const [accessLevel, setAccessLevel] = useState("download");

  const { data, refetch } = useQuery({
    queryKey: ["file-shares", file.id],
    queryFn: () => FilesService.listShares(file.id),
  });

  const shares = (data ?? []) as { id: string; entity_type: string; entity_id: string; access_level: string }[];

  return (
    <ModalShell title={`Share — ${file.filename}`} onClose={onClose} wide>
      <div className="space-y-4">
        <form
          className="flex flex-col gap-3 rounded-lg border border-hairline p-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await shareFile(file.id, entityType, entityId, accessLevel);
            setEntityId("");
            refetch();
          }}
        >
          <FormSelect label="Entity Type" name="entity_type" options={entityTypeOpts} value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          <FormField label="Entity ID" name="entity_id" value={entityId} onChange={(e) => setEntityId(e.target.value)} required />
          <FormSelect
            label="Access Level"
            name="access_level"
            options={FILE_ACCESS_LEVELS.map((l) => ({ value: l, label: l }))}
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value)}
          />
          <Button type="submit">Share</Button>
        </form>

        {shares.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No shares yet.</p>
        ) : (
          <ul className="space-y-2">
            {shares.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg border border-hairline p-3">
                <span className="text-body-sm">{s.entity_type} / {s.entity_id}</span>
                <Badge>{s.access_level}</Badge>
                <button
                  onClick={async () => {
                    await unshareFile(file.id, s.id);
                    refetch();
                  }}
                  className="ml-auto text-body-sm text-error hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function SuccessBody({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-success">{message}</p>
      <Button onClick={onDone} variant="secondary" className="w-full">Done</Button>
    </div>
  );
}