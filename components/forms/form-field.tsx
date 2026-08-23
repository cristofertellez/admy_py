"use client";

import { Input } from "./input";
import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  hint?: string;
}

export function FormField({ label, error, hint, id, ...props }: FormFieldProps) {
  const fieldId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-body-sm font-medium text-body-strong">
        {label}
      </label>
      <Input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={error ? "border-error focus:ring-error" : ""}
        {...props}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-caption text-muted-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-caption text-error" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}
