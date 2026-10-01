"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FilesService } from "@/features/files";
import { deleteFile, getFileUrl, uploadFile } from "@/actions/files";
import { Button } from "@/components/ui/button";
import { useActionState, useRef, useState, useTransition } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatSize(sizeBytes: number | null): string {
  if (!sizeBytes) return "—";
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(0)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CommentAttachments({
  commentId,
  canUpload,
  canDownload,
  canDelete,
}: {
  commentId: string;
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
}) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data } = useQuery({
    queryKey: ["attachments", "comment", commentId],
    queryFn: () => FilesService.list({ entityType: "comment", entityId: commentId, pageSize: 50 }),
  });

  const attachments = data?.data ?? [];
  const hasAttachments = attachments.length > 0;

  return (
    <div className="mt-2">
      {hasAttachments && (
        <ul className="space-y-1">
          {attachments.map((file) => (
            <li key={file.id} className="flex items-center gap-2 text-caption">
              <span className="truncate text-muted">{file.filename}</span>
              <span className="text-muted-soft">{formatSize(file.size_bytes)}</span>
              <CommentFileActions fileId={file.id} filename={file.filename} canDownload={canDownload} canDelete={canDelete} />
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="mt-1 text-caption-uppercase text-muted transition-colors hover:text-primary"
          >
            Attach file
          </button>
          {showUpload && (
            <CommentUploadModal
              commentId={commentId}
              onClose={() => setShowUpload(false)}
              onSuccess={() => {
                setShowUpload(false);
                queryClient.invalidateQueries({ queryKey: ["attachments", "comment", commentId] });
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function CommentFileActions({
  fileId,
  filename,
  canDownload,
  canDelete,
}: {
  fileId: string;
  filename: string;
  canDownload: boolean;
  canDelete: boolean;
}) {
  const [, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await getFileUrl(fileId);
      if ("success" in result && result.success) {
        window.open(result.success, "_blank", "noopener");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${filename}"?`)) return;
    startTransition(async () => {
      await deleteFile(fileId);
    });
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      {canDownload && (
        <button type="button" onClick={handleDownload} className="text-primary hover:underline">
          Download
        </button>
      )}
      {canDelete && (
        <button type="button" onClick={handleDelete} className="text-error hover:underline">
          Delete
        </button>
      )}
    </span>
  );
}

function CommentUploadModal({
  commentId,
  onClose,
  onSuccess,
}: {
  commentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(uploadFile, null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (state?.success) {
    return (
      <div className="mt-3 rounded-xl border border-hairline bg-surface-card p-4">
        <p className="text-body-sm text-success">{state.success}</p>
        <Button onClick={onSuccess} variant="secondary" className="mt-2 w-full sm:w-auto">
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-hairline bg-surface-card p-4">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="entity_type" value="comment" />
        <input type="hidden" name="entity_id" value={commentId} />
        <input
          ref={inputRef}
          type="file"
          name="file"
          required
          accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.svg,.webp,.zip"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            if (file && file.size > MAX_FILE_SIZE) {
              setSelectedFile(null);
              e.target.value = "";
              return;
            }
            setSelectedFile(file);
          }}
          className="text-body-sm text-body"
        />
        {selectedFile && (
          <p className="text-caption text-muted">
            {selectedFile.name} · {formatSize(selectedFile.size)}
          </p>
        )}
        {state?.error && (
          <p role="alert" className="text-body-sm text-error">{state.error}</p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !selectedFile} className="flex-1">
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </form>
    </div>
  );
}