"use client";

import { Textarea } from "./textarea";
import type { TextareaHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: FieldError;
  hint?: string;
}

export function FormTextarea({ label, error, hint, id, ...props }: FormTextareaProps) {
  const fieldId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-body-sm font-medium text-body-strong">
        {label}
      </label>
      <Textarea
        id={fieldId}
        aria-invalid={!!error}
        className={error ? "border-error focus:ring-error" : ""}
        {...props}
      />
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
