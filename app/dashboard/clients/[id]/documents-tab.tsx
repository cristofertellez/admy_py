"use client";

import { deleteFile, getFileUrl, uploadFile } from "@/actions/files";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/shared/card";
import { useActionState, useRef, useState, useTransition } from "react";

export interface DocumentRow {
  id: string;
  filename: string;
  extension: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

interface Props {
  entityId: string;
  documents: DocumentRow[];
  canUpload: boolean;
  canDelete: boolean;
  canDownload: boolean;
  entityType?: string;
}

const PREVIEWABLE_MIME_PREFIXES = ["image/", "application/pdf", "text/"];

function formatSize(sizeBytes: number | null): string {
  if (!sizeBytes) return "—";
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(0)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(mimeType: string | null): boolean {
  return !!mimeType && PREVIEWABLE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

export function DocumentsTab({ entityId, documents, canUpload, canDelete, canDownload, entityType = "client" }: Props) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="flex justify-end">
          <Button onClick={() => setShowUploadModal(true)}>Upload Document</Button>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="rounded-xl border border-hairline bg-surface-card px-4 py-8 text-center text-body-sm text-muted-soft">
          No documents yet.
        </p>
      ) : (
        <ul className="divide-y divide-hairline-soft rounded-xl border border-hairline bg-surface-card">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-body-strong">{doc.filename}</p>
                <p className="text-caption text-muted">
                  {formatSize(doc.size_bytes)} ·{" "}
                  {doc.users ? `${doc.users.first_name} ${doc.users.last_name}` : "Unknown"} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge>{doc.extension || "file"}</Badge>
              <DocumentActions
                document={doc}
                canDelete={canDelete}
                canDownload={canDownload}
              />
            </li>
          ))}
        </ul>
      )}

      {showUploadModal && (
        <UploadDocumentModal
          entityId={entityId}
          entityType={entityType}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}

function DocumentActions({
  document,
  canDelete,
  canDownload,
}: {
  document: DocumentRow;
  canDelete: boolean;
  canDownload: boolean;
}) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function openFileUrl(fileId: string) {
    setError(null);
    setIsBusy(true);
    startTransition(async () => {
      const result = await getFileUrl(fileId);
      setIsBusy(false);
      if ("success" in result && result.success) {
        window.open(result.success, "_blank", "noopener");
      } else if ("error" in result && result.error) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${document.filename}"? This cannot be undone.`)) return;

    setError(null);
    setIsBusy(true);
    startTransition(async () => {
      const result = await deleteFile(document.id);
      setIsBusy(false);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <p role="alert" className="text-caption text-error">
          {error}
        </p>
      )}
      {canDownload && isPreviewable(document.mime_type) && (
        <button
          disabled={isBusy}
          onClick={() => openFileUrl(document.id)}
          className="text-body-sm text-primary hover:underline disabled:opacity-50"
        >
          Preview
        </button>
      )}
      {canDownload && (
        <button
          disabled={isBusy}
          onClick={() => openFileUrl(document.id)}
          className="text-body-sm text-primary hover:underline disabled:opacity-50"
        >
          Download
        </button>
      )}
      {canDelete && (
        <button
          disabled={isBusy}
          onClick={handleDelete}
          className="text-body-sm text-error hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}

function UploadDocumentModal({ entityId, entityType = "client", onClose, onSuccess }: { entityId: string; entityType?: string; onClose: () => void; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(uploadFile, null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function setFile(file: File | null | undefined) {
    setSelectedFile(file ?? null);
  }

  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Upload document">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6">
            <p className="text-body-sm text-success">{state.success}</p>
            <Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Upload document">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-title-md text-ink">Upload Document</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </div>
        <CardContent className="pt-4">
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="entity_type" value={entityType} />
            <input type="hidden" name="entity_id" value={entityId} />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                setFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Drag and drop a file here or click to browse"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                isDragging ? "border-primary bg-primary/5" : "border-hairline-strong bg-surface-card"
              }`}
            >
              <p className="text-body-sm text-body-strong">
                {selectedFile ? selectedFile.name : "Drag & drop a file here"}
              </p>
              <p className="mt-1 text-caption text-muted">
                {selectedFile
                  ? formatSize(selectedFile.size)
                  : "or click to browse · PDF, Office, images or ZIP up to 10MB"}
              </p>
              <input
                ref={inputRef}
                type="file"
                name="file"
                required
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </div>

            {state?.error && (
              <p role="alert" className="text-body-sm text-error">{state.error}</p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isPending || !selectedFile} className="flex-1">
                {isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
