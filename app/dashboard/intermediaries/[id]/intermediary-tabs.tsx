"use client";

import { ActivityTimeline } from "@/app/dashboard/activity/activity-timeline";
import { HistoryFilters } from "@/app/dashboard/clients/[id]/history-filters";
import { Badge } from "@/components/shared/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ClientAssignmentCandidate } from "@/features/clients";
import type {
  IntermediaryHistoryResult,
  IntermediaryReportProject,
} from "@/features/intermediaries";
import { AssignedClientsCard } from "./assigned-clients-card";

const TAB_IDS = ["overview", "projects", "timeline"] as const;

type TabId = (typeof TAB_IDS)[number];

const FINALIZED_STATUSES = ["Completed", "Cancelled", "Archived"];

function getStatusVariant(status: string): "success" | "error" | "warning" | "default" {
  if (FINALIZED_STATUSES.includes(status)) return status === "Completed" ? "success" : "error";
  if (status === "Suspended") return "error";
  return "warning";
}

interface Props {
  intermediaryId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  isActive: boolean;
  clients: Array<{ id: string; company_name: string; is_active: boolean }>;
  candidates: ClientAssignmentCandidate[];
  canManage: boolean;
  projects: IntermediaryReportProject[];
  history: IntermediaryHistoryResult;
  historyFilters: { search?: string; category?: string | null };
}

export function IntermediaryTabs({
  intermediaryId,
  firstName,
  lastName,
  email,
  phone,
  createdAt,
  isActive,
  clients,
  candidates,
  canManage,
  projects,
  history,
  historyFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // The active tab lives in the URL so timeline filters and pages survive reloads.
  const tabParam = searchParams.get("tab");
  const tab: TabId = TAB_IDS.includes(tabParam as TabId) ? (tabParam as TabId) : "overview";

  function navigate(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function handleTabClick(nextTab: TabId) {
    navigate({
      tab: nextTab === "overview" ? undefined : nextTab,
      ...(nextTab === "timeline" ? {} : { q: undefined, category: undefined, page: undefined }),
    });
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "projects" as const, label: `Projects (${projects.length})` },
    { id: "timeline" as const, label: "Timeline" },
  ];

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Intermediary sections" className="flex overflow-x-auto border-b border-hairline">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => handleTabClick(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-body-strong"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Name" value={`${firstName} ${lastName}`} />
              <DetailRow label="Email" value={email} />
              <DetailRow label="Phone" value={phone} />
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-muted">Status</span>
                <Badge variant={isActive ? "success" : "error"}>{isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <DetailRow label="Member since" value={new Date(createdAt).toLocaleDateString()} />
            </CardContent>
          </Card>

          <AssignedClientsCard
            intermediaryId={intermediaryId}
            intermediaryName={`${firstName} ${lastName}`}
            clients={clients}
            candidates={candidates}
            canManage={canManage}
          />
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-6">
          <ProjectGroup
            title={`Active Projects (${projects.filter((p) => !FINALIZED_STATUSES.includes(p.status)).length})`}
            projects={projects.filter((p) => !FINALIZED_STATUSES.includes(p.status))}
            emptyLabel="No active projects."
          />
          <ProjectGroup
            title={`Finalized Projects (${projects.filter((p) => FINALIZED_STATUSES.includes(p.status)).length})`}
            projects={projects.filter((p) => FINALIZED_STATUSES.includes(p.status))}
            emptyLabel="No finalized projects yet."
          />
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4">
          <HistoryFilters
            initialSearch={historyFilters.search ?? ""}
            category={historyFilters.category ?? ""}
            onNavigate={navigate}
          />
          <ActivityTimeline
            logs={history.data}
            total={history.total}
            pageIndex={history.page - 1}
            pageSize={history.pageSize}
            onPageChange={(nextPageIndex) =>
              navigate({ page: nextPageIndex === 0 ? undefined : String(nextPageIndex + 1) })
            }
          />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-body-sm text-muted">{label}</span>
      <span className="break-words text-right text-body-sm text-body-strong">{value || "—"}</span>
    </div>
  );
}

interface ProjectGroupProps {
  title: string;
  projects: IntermediaryReportProject[];
  emptyLabel: string;
}

function ProjectGroup({ title, projects, emptyLabel }: ProjectGroupProps) {
  return (
    <section aria-label={title}>
      <h3 className="text-caption-uppercase text-muted">{title}</h3>
      {projects.length === 0 ? (
        <p className="mt-3 rounded-xl border border-hairline bg-surface-card px-4 py-8 text-center text-body-sm text-muted-soft">
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-3 grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function isOverdue(project: IntermediaryReportProject): boolean {
  if (FINALIZED_STATUSES.includes(project.status) || !project.estimated_end_date) return false;
  return new Date(project.estimated_end_date) < new Date(new Date().toDateString());
}

function ProjectCard({ project }: { project: IntermediaryReportProject }) {
  const completion = Math.max(0, Math.min(100, Math.round(project.completion_percentage ?? 0)));
  const overdue = isOverdue(project);

  return (
    <article className="h-full space-y-3 rounded-xl border border-hairline bg-surface-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="block truncate text-body-sm font-medium text-body-strong hover:text-primary"
          >
            {project.name}
          </Link>
          <p className="truncate text-caption text-muted">{project.client_name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {overdue && <Badge variant="error">Overdue</Badge>}
          <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
        </div>
      </header>

      <ProgressBar value={completion} label={`Progress for ${project.name}`} />

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted">
        <span>
          Due{" "}
          <time dateTime={project.estimated_end_date ?? undefined} className={overdue ? "text-error" : undefined}>
            {project.estimated_end_date
              ? new Date(project.estimated_end_date).toLocaleDateString()
              : "—"}
          </time>
        </span>
        {project.estimated_start_date && (
          <span>Start {new Date(project.estimated_start_date).toLocaleDateString()}</span>
        )}
        <span className="ml-auto">
          {Math.round(project.worked_hours ?? 0)}
          {project.estimated_hours ? ` / ${Math.round(project.estimated_hours)}h` : "h"}
        </span>
      </footer>
    </article>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-card-elevated"
      >
        <div className="h-full rounded-pill bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-caption text-muted">{value}%</span>
    </div>
  );
}
