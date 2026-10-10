import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning";
  className?: string;
  title?: string;
  dot?: boolean;
}

export function Badge({ children, variant = "default", className, title, dot }: BadgeProps) {
  const variants = {
    default: "bg-surface-card-elevated text-body-strong border-hairline/80",
    success: "bg-success/10 text-success border-success/20",
    error: "bg-error/10 text-error border-error/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  const showDot = dot ?? (variant !== "default");

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-caption-uppercase font-semibold tracking-wide transition-colors",
        variants[variant],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            variant === "success" && "bg-success shadow-[0_0_6px_var(--color-success)]",
            variant === "error" && "bg-error shadow-[0_0_6px_var(--color-error)]",
            variant === "warning" && "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]",
            variant === "default" && "bg-muted",
          )}
        />
      )}
      {children}
    </span>
  );
}
