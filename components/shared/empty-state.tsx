import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-hairline/90 bg-surface-card/40 p-8 text-center transition-colors",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-hairline/80 bg-surface-card text-muted shadow-xs mb-3.5">
        {icon || (
          <svg
            className="h-6 w-6 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h4 className="text-title-sm font-semibold text-ink">{title}</h4>

      {description && (
        <p className="mt-1 max-w-sm text-caption text-muted leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-button font-medium text-on-primary shadow-xs transition-transform hover:bg-primary-active active:scale-95"
        >
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionHref && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-button font-medium text-on-primary shadow-xs transition-transform hover:bg-primary-active active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
