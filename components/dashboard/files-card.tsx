import Link from "next/link";
import type { RecentFileItem } from "@/features/dashboard";
import { formatDate } from "@/lib/utils";
import { ListCard } from "./list-card";

// Historia 11.5 — Files Card widget: latest documents shared on the visible
// projects (11.9), reused by the developer and client dashboards.

interface FilesCardProps {
  files: RecentFileItem[];
  title?: string;
  emptyMessage?: string;
}

export function FilesCard({
  files,
  title = "Latest Files",
  emptyMessage = "No files uploaded yet.",
}: FilesCardProps) {
  return (
    <ListCard title={title} emptyMessage={emptyMessage} itemCount={files.length}>
      {files.map((file) => (
        <li key={file.id} className="py-3 first:pt-0 last:pb-0">
          <Link
            href={`/dashboard/projects/${file.project_id}?tab=documents`}
            className="group flex items-center justify-between gap-3"
          >
            <span className="min-w-0">
              <span className="block truncate text-body-sm font-medium text-body-strong group-hover:text-ink">
                {file.filename}
              </span>
              <span className="block truncate text-caption text-muted">{file.project_name}</span>
            </span>
            <time dateTime={file.created_at} className="shrink-0 text-caption text-muted">
              {formatDate(file.created_at)}
            </time>
          </Link>
        </li>
      ))}
    </ListCard>
  );
}
