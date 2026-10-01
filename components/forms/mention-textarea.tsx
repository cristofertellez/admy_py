"use client";

import { searchMentionCandidates } from "@/actions/mentions";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { TextareaHTMLAttributes } from "react";

interface MentionCandidate {
  handle: string;
  label: string;
}

interface MentionTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

// Historia 9.6 — textarea con autocompletado de @menciones.
// Emite el autocompletado inline sin reemplazar el textarea nativo, de modo que
// sigue integrada con los server actions basados en FormData (atributo name).
export function MentionTextarea({ label, hint, id, onChange, className, ...props }: MentionTextareaProps) {
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fieldId = id || props.name;

  function closeAutocomplete() {
    setCandidates([]);
    setActiveIndex(0);
    setMentionStart(null);
  }

  async function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange?.(event);

    const value = event.target.value;
    const cursor = event.target.selectionStart ?? value.length;

    const textBeforeCursor = value.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1) {
      closeAutocomplete();
      return;
    }

    const query = textBeforeCursor.slice(atIndex + 1);
    if (query.includes(" ") || query.includes("\n")) {
      closeAutocomplete();
      return;
    }

    setMentionStart(atIndex);

    const results = await searchMentionCandidates(query);
    setCandidates(results);
    setActiveIndex(0);
  }

  function applyCandidate(candidate: MentionCandidate) {
    const el = ref.current;
    if (!el || mentionStart === null) return;

    const value = el.value;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const nextValue = `${before}@${candidate.handle} ${after}`;

    el.value = nextValue;
    // Update through React by firing a change event so controlled consumers sync.
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(el, nextValue);
    el.dispatchEvent(new Event("input", { bubbles: true }));

    const newCursor = mentionStart + candidate.handle.length + 2;
    el.selectionStart = newCursor;
    el.selectionEnd = newCursor;
    el.focus();

    closeAutocomplete();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (candidates.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % candidates.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      applyCandidate(candidates[activeIndex]);
    } else if (event.key === "Escape") {
      closeAutocomplete();
    }
  }

  useEffect(() => {
    return () => closeAutocomplete();
  }, []);

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-body-sm font-medium text-body-strong">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {hint && <p className="text-caption text-muted-soft">{hint}</p>}

      {candidates.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-hairline bg-surface-card shadow-lg"
        >
          {candidates.map((candidate, index) => (
            <li key={candidate.handle}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyCandidate(candidate);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-body-sm",
                  index === activeIndex ? "bg-surface-hover text-body-strong" : "text-body",
                )}
              >
                <span className="font-medium">{candidate.label}</span>
                <span className="text-caption text-muted">@{candidate.handle}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}