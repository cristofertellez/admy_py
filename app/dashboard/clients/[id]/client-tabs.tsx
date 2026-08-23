"use client";

import { ActivityTimeline } from "@/app/dashboard/activity/activity-timeline";
import { assignClientIntermediary, removeClientIntermediary } from "@/actions/clients";
import { Badge } from "@/components/shared/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useActionState } from "react";
import type {
  AssignedIntermediary,
  ClientHistoryCategory,
  ClientHistoryResult,
  ClientProjectSummary,
} from "@/features/clients";
import { DocumentsTab, type DocumentRow } from "./documents-tab";
import { CommentsTab, type ClientCommentRow } from "./comments-tab";
import { HistoryFilters } from "./history-filters";

const FINALIZED_STATUSES = new Set(["Completed", "Cancelled", "Archived"]);

const TAB_IDS = ["overview", "projects", "documents", "comments", "timeline"] as const;

type TabId = (typeof TAB_IDS)[number];

function getStatusVariant(status: string): "success" | "error" | "warning" | "default" {
  if (FINALIZED_STATUSES.has(status)) return status === "Completed" ? "success" : "error";
  if (status === "Suspended") return "error";
  return "warning";
}

interface Props {
  clientId: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  intermediary: AssignedIntermediary | null;
  projects: ClientProjectSummary[];
  history: ClientHistoryResult;
  historyFilters: { search?: string; category?: ClientHistoryCategory | null };
  canManageIntermediary: boolean;
  availableIntermediaries: AssignedIntermediary[];
  documents: DocumentRow[];
  canUploadFiles: boolean;
  canDeleteFiles: boolean;
  canDownloadFiles: boolean;
  comments: ClientCommentRow[];
  currentUserId: string | null;
  canCreateComments: boolean;
  canModerateComments: boolean;
}

export function ClientTabs({
  clientId,
  company_name,
  contact_name,
  email,
  phone,
  address,
  country,
  city,
  website,
  notes,
  isActive,
  createdAt,
  intermediary,
  projects,
  history,
  historyFilters,
  canManageIntermediary,
  availableIntermediaries,
  documents,
  canUploadFiles,
  canDeleteFiles,
  canDownloadFiles,
  comments,
  currentUserId,
  canCreateComments,
  canModerateComments,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
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

  function handleRemove() {
    setRemoveError(null);
    setIsRemoving(true);
    startTransition(async () => {
      const result = await removeClientIntermediary(clientId);
      setIsRemoving(false);
      if (result?.error) {
        setRemoveError(result.error);
        return;
      }
      setConfirmingRemove(false);
    });
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "projects" as const, label: `Projects (${projects.length})` },
    { id: "documents" as const, label: `Documents (${documents.length})` },
    { id: "comments" as const, label: `Comments (${comments.length})` },
    { id: "timeline" as const, label: "Timeline" },
  ];

  const activeProjects = projects.filter((p) => !FINALIZED_STATUSES.has(p.status));
  const completedProjects = projects.filter((p) => p.status === "Completed");

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Client sections" className="flex border-b border-hairline overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => handleTabClick(t.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-body-sm font-medium transition-colors border-b-2 -mb-px ${
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
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Company" value={company_name} />
              <DetailRow label="Contact" value={contact_name} />
              <div className="flex justify-between items-center">
                <span className="text-body-sm text-muted">Status</span>
                <Badge variant={isActive ? "success" : "error"}>{isActive ? "Active" : "Archived"}</Badge>
              </div>
              <DetailRow label="Created" value={new Date(createdAt).toLocaleDateString()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow label="Email" value={email} />
              <DetailRow label="Phone" value={phone} />
              <DetailRow
                label="Address"
                value={[address, city, country].filter(Boolean).join(", ") || null}
              />
              <DetailRow label="Website" value={website} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Intermediary</CardTitle>
            </CardHeader>
            <CardContent>
              {intermediary ? (
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-body-sm font-semibold text-body-strong"
                  >
                    {intermediary.first_name[0]}
                    {intermediary.last_name[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-body-strong truncate">
                      {intermediary.first_name} {intermediary.last_name}
                    </p>
                    <p className="text-caption text-muted truncate">{intermediary.email}</p>
                  </div>
                  {!intermediary.is_active && (
                    <Badge variant="error" className="ml-auto">
                      Inactive
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-body-sm text-muted-soft">No intermediary assigned.</p>
              )}

              {canManageIntermediary && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(true)}>
                    {intermediary ? "Change" : "Assign"}
                  </Button>
                  {intermediary && (
                    <Button size="sm" variant="ghost" onClick={() => setConfirmingRemove(true)}>
                      Remove
                    </Button>
                  )}
                  {removeError && (
                    <p role="alert" className="w-full text-body-sm text-error">
                      {removeError}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body-sm text-muted">{notes || "No notes."}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "projects" && (
        <div className="space-y-6">
          <ProjectGroup title={`Active Projects (${activeProjects.length})`} projects={activeProjects} emptyLabel="No active projects." />
          <ProjectGroup title={`Finalized Projects (${completedProjects.length})`} projects={completedProjects} emptyLabel="No completed projects yet." />
        </div>
      )}

      {tab === "documents" && (
        <DocumentsTab
          entityId={clientId}
          documents={documents}
          canUpload={canUploadFiles}
          canDelete={canDeleteFiles}
          canDownload={canDownloadFiles}
        />
      )}

      {tab === "comments" && (
        <CommentsTab
          clientId={clientId}
          comments={comments}
          currentUserId={currentUserId}
          canComment={canCreateComments}
          canModerate={canModerateComments}
        />
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

      {showAssignModal && (
        <AssignIntermediaryModal
          clientId={clientId}
          currentIntermediaryId={intermediary?.id ?? null}
          available={availableIntermediaries}
          onClose={() => setShowAssignModal(false)}
        />
      )}
      {confirmingRemove && intermediary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Remove intermediary">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Remove Intermediary</CardTitle>
              <button onClick={() => setConfirmingRemove(false)} aria-label="Close" className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body-sm text-body">
                Remove {intermediary.first_name} {intermediary.last_name} from {company_name}?
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setConfirmingRemove(false)} className="flex-1" disabled={isRemoving}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={handleRemove} className="flex-1" disabled={isRemoving}>
                  {isRemoving ? "Removing..." : "Remove"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AssignIntermediaryModal({
  clientId,
  currentIntermediaryId,
  available,
  onClose,
}: {
  clientId: string;
  currentIntermediaryId: string | null;
  available: AssignedIntermediary[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(assignClientIntermediary, null);

  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Assign intermediary">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6">
            <p className="text-body-sm text-success">{state.success}</p>
            <Button onClick={onClose} variant="secondary" className="w-full">Done</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = [
    ...available.map((i) => ({
      value: i.id,
      label: `${i.first_name} ${i.last_name}${currentIntermediaryId === i.id ? " (current)" : ""}`,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Assign intermediary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Assign Intermediary</CardTitle>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-body-sm text-muted-soft">No active intermediaries available.</p>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="client_id" value={clientId} />
              <FormSelect
                label="Intermediary"
                name="intermediary_id"
                options={options}
                defaultValue={currentIntermediaryId ?? options[0]?.value}
                required
              />
              {state?.error && (
                <p role="alert" className="text-body-sm text-error">{state.error}</p>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectGroup({
  title,
  projects,
  emptyLabel,
}: {
  title: string;
  projects: ClientProjectSummary[];
  emptyLabel: string;
}) {
  return (
    <section aria-label={title}>
      <h3 className="text-caption-uppercase text-muted">{title}</h3>
      {projects.length === 0 ? (
        <p className="mt-3 rounded-xl border border-hairline bg-surface-card px-4 py-8 text-center text-body-sm text-muted-soft">
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-hairline-soft rounded-xl border border-hairline bg-surface-card">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <span className="text-body-sm font-medium text-body-strong">{project.name}</span>
                <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                <span className="ml-auto text-caption text-muted">{project.completion_percentage}%</span>
                <span className="text-caption text-muted w-full sm:w-auto">
                  {project.estimated_end_date
                    ? `Due ${new Date(project.estimated_end_date).toLocaleDateString()}`
                    : "No due date"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-body-sm text-muted shrink-0">{label}</span>
      <span className="text-body-sm text-body-strong text-right break-words">{value || "—"}</span>
    </div>
  );
}
