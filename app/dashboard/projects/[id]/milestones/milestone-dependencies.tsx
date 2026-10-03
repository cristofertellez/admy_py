"use client";

import { useState, useTransition } from "react";
import { addMilestoneDependency, removeMilestoneDependency } from "@/actions/milestones";
import { Badge } from "@/components/shared/badge";

export interface MilestoneDependencyRow {
  id: string;
  dependency_type: string;
  milestone: { id: string; title: string; status: string; estimated_date: string | null };
}

interface AvailableMilestone {
  id: string;
  title: string;
  status: string;
  estimated_date: string | null;
}

interface MilestoneDependenciesProps {
  milestone: { id: string; title: string };
  predecessors: MilestoneDependencyRow[];
  successors: MilestoneDependencyRow[];
  availableMilestones: AvailableMilestone[];
  canManage: boolean;
}

const DEPENDENCY_TYPES = [
  { value: "Finish to Start", label: "After (Finish to Start)" },
  { value: "Start to Start", label: "Together (Start to Start)" },
  { value: "Related", label: "Related" },
];

/**
 * Historia 8.8 — predecessor/successor/related milestone management.
 * Cycles are rejected server-side and surfaced as friendly errors.
 */
export function MilestoneDependencies({
  milestone,
  predecessors,
  successors,
  availableMilestones,
  canManage,
}: MilestoneDependenciesProps) {
  const [, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAdd(formData: FormData) {
    formData.set("milestone_id", milestone.id);
    startTransition(async () => {
      const result = await addMilestoneDependency(null, formData);
      if (result?.error) {
        setError(result.error);
        setFeedback(null);
      } else {
        setError(null);
        setFeedback(result.success ?? "Dependency added.");
      }
    });
  }

  function handleRemove(dependencyId: string) {
    const formData = new FormData();
    formData.set("dependency_id", dependencyId);
    startTransition(async () => {
      const result = await removeMilestoneDependency(null, formData);
      if (result?.error) {
        setError(result.error);
        setFeedback(null);
      } else {
        setError(null);
        setFeedback(result.success ?? "Dependency removed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Predecessors">
          <h3 className="mb-2 text-body-sm font-semibold text-body-strong">
            Depends on ({predecessors.length})
          </h3>
          {predecessors.length === 0 ? (
            <p className="text-body-sm text-muted-soft">No predecessors.</p>
          ) : (
            <ul className="space-y-2">
              {predecessors.map((dep) => (
                <li key={dep.id} className="flex items-center justify-between gap-2 rounded-md border border-hairline p-2">
                  <div className="min-w-0">
                    <p className="truncate text-body-sm text-body-strong">{dep.milestone.title}</p>
                    <p className="text-caption text-muted">
                      {dep.dependency_type} · {dep.milestone.status}
                      {dep.milestone.estimated_date ? ` · ${dep.milestone.estimated_date}` : ""}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleRemove(dep.id)}
                      className="shrink-0 text-caption text-muted hover:text-error"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Successors">
          <h3 className="mb-2 text-body-sm font-semibold text-body-strong">
            Blocks ({successors.length})
          </h3>
          {successors.length === 0 ? (
            <p className="text-body-sm text-muted-soft">No milestones depend on this one.</p>
          ) : (
            <ul className="space-y-2">
              {successors.map((dep) => (
                <li key={dep.id} className="rounded-md border border-hairline p-2">
                  <p className="truncate text-body-sm text-body-strong">{dep.milestone.title}</p>
                  <p className="text-caption text-muted">
                    {dep.dependency_type} · {dep.milestone.status}
                    {dep.milestone.estimated_date ? ` · ${dep.milestone.estimated_date}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {canManage && (
        <form
          action={handleAdd}
          className="flex flex-wrap items-end gap-2 rounded-md border border-hairline p-3"
        >
          <div className="min-w-48 flex-1">
            <label htmlFor={`dep-milestone-${milestone.id}`} className="mb-1 block text-caption text-muted">
              Depends on
            </label>
            <select
              id={`dep-milestone-${milestone.id}`}
              name="depends_on_milestone_id"
              required
              className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 text-body-sm text-body-strong"
            >
              <option value="">Select a milestone…</option>
              {availableMilestones.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                  {option.estimated_date ? ` (${option.estimated_date})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-44">
            <label htmlFor={`dep-type-${milestone.id}`} className="mb-1 block text-caption text-muted">
              Type
            </label>
            <select
              id={`dep-type-${milestone.id}`}
              name="dependency_type"
              className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 text-body-sm text-body-strong"
            >
              {DEPENDENCY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={availableMilestones.length === 0}
            className="h-10 rounded-md bg-primary px-4 text-body-sm font-medium text-white disabled:opacity-50"
          >
            Add dependency
          </button>
          {availableMilestones.length === 0 && (
            <Badge variant="default">All project milestones already linked</Badge>
          )}
        </form>
      )}

      {feedback && (
        <p className="text-body-sm text-success" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <p className="text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
