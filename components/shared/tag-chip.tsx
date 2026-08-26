import { cn } from "@/lib/utils";
import { DEFAULT_TAG_COLOR } from "@/constants";

interface TagChipProps {
  label: string;
  color?: string | null;
  className?: string;
}

// Colored pill used wherever tags are displayed (Historia 6.10): projects
// table, project detail header and the tags admin page.
export function TagChip({ label, color = DEFAULT_TAG_COLOR, className }: TagChipProps) {
  const resolvedColor = color || DEFAULT_TAG_COLOR;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-caption-uppercase font-semibold",
        className,
      )}
      style={{
        backgroundColor: `${resolvedColor}20`,
        borderColor: resolvedColor,
        color: resolvedColor,
      }}
    >
      {label}
    </span>
  );
}
