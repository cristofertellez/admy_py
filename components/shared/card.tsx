import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Card({ children, className, id }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-xl border border-hairline/80 bg-surface-card p-6 shadow-xs transition-all duration-200 hover:border-hairline-strong/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, id }: CardProps) {
  return (
    <div id={id} className={cn("mb-4 flex items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, id }: CardProps) {
  return (
    <h3 id={id} className={cn("text-title-md font-medium tracking-tight text-ink", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn(className)}>{children}</div>;
}
