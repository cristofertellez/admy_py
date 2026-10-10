"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export type TaskViewMode = "list" | "kanban" | "calendar" | "timeline" | "gantt";

const VIEW_OPTIONS: { id: TaskViewMode; label: string }[] = [
  { id: "list", label: "List" },
  { id: "kanban", label: "Kanban" },
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "gantt", label: "Gantt" },
];

/** Historia 7.13/7.15/7.16 — view mode lives in the URL (shareable). */
export function TasksViewSwitcher({ view }: { view: TaskViewMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function switchView(next: TaskViewMode) {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("view", next);
    qs.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${qs.toString()}`);
    });
  }

  return (
    <div role="tablist" aria-label="Task views" className="flex gap-1 rounded-lg border border-hairline p-1">
      {VIEW_OPTIONS.map((option) => (
        <button
          key={option.id}
          role="tab"
          aria-selected={view === option.id}
          onClick={() => switchView(option.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-body-sm transition-colors",
            view === option.id
              ? "bg-primary text-white"
              : "text-muted hover:text-body-strong",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
