import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-primary text-on-primary hover:bg-primary-active",
      secondary:
        "bg-surface-card-elevated text-body-strong hover:bg-surface-strong",
      outline:
        "border border-hairline-strong text-body-strong hover:bg-surface-card",
      ghost:
        "text-body hover:text-body-strong hover:bg-surface-card",
    };

    const sizes = {
      sm: "h-8 px-3 text-caption",
      md: "h-10 px-5 text-button",
      lg: "h-12 px-6 text-button",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
