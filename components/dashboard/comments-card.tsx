import Link from "next/link";
import { Badge } from "@/components/shared/badge";
import { getCommentContextHref, type RecentCommentItem } from "@/features/dashboard";
import { ListCard } from "./list-card";

// Historia 11.5 — Comments Card widget: latest conversation entries across
// clients, projects, tasks and milestones, shared by every role dashboard.

interface CommentsCardProps {
  comments: RecentCommentItem[];
  title?: string;
  emptyMessage?: string;
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentsCard({
  comments,
  title = "Latest Comments",
  emptyMessage = "No recent comments.",
}: CommentsCardProps) {
  return (
    <ListCard title={title} emptyMessage={emptyMessage} itemCount={comments.length}>
      {comments.map((comment) => {
        const author =
          [comment.author_first_name, comment.author_last_name].filter(Boolean).join(" ").trim() ||
          "Unknown user";
        const href = getCommentContextHref(comment);

        return (
          <li key={`${comment.context_type}-${comment.id}`} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-body-sm font-medium text-body-strong">{author}</span>
              <Badge>{comment.context_title}</Badge>
              <time
                dateTime={comment.created_at}
                title={new Date(comment.created_at).toLocaleString()}
                className="ml-auto text-caption text-muted"
              >
                {formatCommentDate(comment.created_at)}
              </time>
            </div>
            <p className="mt-1 line-clamp-2 text-body-sm text-muted">{comment.message}</p>
            {href && (
              <Link href={href} className="text-caption text-muted hover:text-body-strong">
                View {comment.context_type} →
              </Link>
            )}
          </li>
        );
      })}
    </ListCard>
  );
}
