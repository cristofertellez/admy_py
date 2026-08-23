import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning";
  className?: string;
  title?: string;
}

export function Badge({ children, variant = "default", className, title }: BadgeProps) {
  const variants = {
    default: "bg-surface-card-elevated text-body-strong",
    success: "bg-success/10 text-success",
    error: "bg-error/10 text-error",
    warning: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption-uppercase font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
