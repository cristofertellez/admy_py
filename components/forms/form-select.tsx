"use client";

import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: FieldError;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({
  label,
  error,
  hint,
  id,
  options,
  placeholder,
  className,
  ...props
}: FormSelectProps) {
  const fieldId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-body-sm font-medium text-body-strong">
        {label}
      </label>
      <select
        id={fieldId}
        aria-invalid={!!error}
        className={cn(
          "flex h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error focus:ring-error",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-caption text-muted-soft">{hint}</p>
      )}
      {error && (
        <p className="text-caption text-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
