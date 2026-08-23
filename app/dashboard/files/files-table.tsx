"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { FormField, FormSelect } from "@/components/forms";
import { uploadFile, deleteFile, getFileUrl } from "@/actions/files";
import { useActionState, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";

interface FileRow {
  id: string;
  filename: string;
  extension: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  entity_type: string;
  entity_id: string;
  created_at: string;
  storage_path: string;
  bucket: string;
  users: { first_name: string; last_name: string } | null;
}

const entityTypeOpts = [
  { value: "project", label: "Project" },
  { value: "task", label: "Task" },
  { value: "client", label: "Client" },
  { value: "milestone", label: "Milestone" },
];

const columns: ColumnDef<FileRow>[] = [
  {
    accessorKey: "filename",
    header: "File",
    cell: ({ getValue, row }) => (
      <div>
        <p className="text-body-sm text-body-strong">{getValue() as string}</p>
        <p className="text-caption text-muted">
          {row.original.entity_type} / {(row.original.size_bytes ? (row.original.size_bytes / 1024).toFixed(0) + " KB" : "—")}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "extension",
    header: "Type",
    cell: ({ getValue }) => <Badge>{(getValue() as string) || "—"}</Badge>,
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
    cell: ({ row }) => (
      <FileActions fileId={row.original.id} filename={row.original.filename} />
    ),
  },
];

function FileActions({ fileId, filename }: { fileId: string; filename: string }) {
  const [, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await getFileUrl(fileId);
      if ((result as { success?: string })?.success) {
        window.open((result as { success: string }).success, "_blank");
      } else {
        alert((result as { error?: string })?.error || "Could not download file.");
      }
    });
  }

  function handleDelete() {
    if (confirm(`Delete "${filename}"?`)) {
      startTransition(async () => {
        const result = await deleteFile(fileId);
        if ((result as { error?: string })?.error) {
          alert((result as { error?: string }).error);
        }
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleDownload} className="text-body-sm text-primary hover:underline">Download</button>
      <button onClick={handleDelete} className="text-body-sm text-error hover:underline">Delete</button>
    </div>
  );
}

export function FilesTable({ files }: { files: FileRow[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>Upload File</Button>
      </div>

      <DataTable columns={columns} data={files} searchColumn="filename" />

      {showForm && (
        <FileUploadModal onClose={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
      )}
    </div>
  );
}

function FileUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(uploadFile, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">✕</button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-body-sm text-success">{state.success}</p>
              <Button onClick={onSuccess} variant="secondary" className="w-full">Done</Button>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <FormSelect label="Entity Type" name="entity_type" options={entityTypeOpts} required />
              <FormField label="Entity ID" name="entity_id" required />
              <FormField label="File" name="file" type="file" required />
              {state?.error && <p className="text-body-sm text-error">{state.error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Uploading..." : "Upload"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
