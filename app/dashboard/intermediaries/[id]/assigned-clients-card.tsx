"use client";

import { assignClientsToIntermediary, removeClientFromIntermediary } from "@/actions/intermediaries";
import { Badge } from "@/components/shared/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { ClientAssignmentCandidate } from "@/features/clients";

interface AssignedClientRow {
  id: string;
  company_name: string;
  is_active: boolean;
}

interface Props {
  intermediaryId: string;
  intermediaryName: string;
  clients: AssignedClientRow[];
  candidates: ClientAssignmentCandidate[];
  canManage: boolean;
}

export function AssignedClientsCard({
  intermediaryId,
  intermediaryName,
  clients,
  candidates,
  canManage,
}: Props) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [removingClient, setRemovingClient] = useState<AssignedClientRow | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function handleRemoveConfirmed() {
    if (!removingClient) return;
    setFeedback(null);
    setIsRemoving(true);

    void removeClientFromIntermediary(intermediaryId, removingClient.id).then((result) => {
      setIsRemoving(false);
      if (result?.error) {
        setFeedback({ tone: "error", message: result.error });
        return;
      }
      setFeedback({ tone: "success", message: `${removingClient.company_name} removed.` });
      setRemovingClient(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Clients ({clients.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clients.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No clients assigned.</p>
        ) : (
          <div className="divide-y divide-hairline-soft">
            {clients.map((client) => (
              <div key={client.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="text-body-sm text-body-strong hover:text-primary"
                >
                  {client.company_name}
                </Link>
                <Badge variant={client.is_active ? "success" : "error"}>
                  {client.is_active ? "Active" : "Inactive"}
                </Badge>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setRemovingClient(client)}
                    className="ml-auto text-body-sm text-muted hover:text-error"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(true)}>
            Assign Clients
          </Button>
        )}

        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={`text-body-sm ${feedback.tone === "success" ? "text-success" : "text-error"}`}
          >
            {feedback.message}
          </p>
        )}
      </CardContent>

      {showAssignModal && (
        <AssignClientsModal
          intermediaryId={intermediaryId}
          intermediaryName={intermediaryName}
          candidates={candidates}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {removingClient && (
        <ConfirmRemoveModal
          client={removingClient}
          isRemoving={isRemoving}
          onCancel={() => setRemovingClient(null)}
          onConfirm={handleRemoveConfirmed}
        />
      )}
    </Card>
  );
}

function AssignClientsModal({
  intermediaryId,
  intermediaryName,
  candidates,
  onClose,
}: {
  intermediaryId: string;
  intermediaryName: string;
  candidates: ClientAssignmentCandidate[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(assignClientsToIntermediary, null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((candidate) =>
      [candidate.company_name, candidate.contact_name, candidate.email]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(term)),
    );
  }, [candidates, search]);

  if (state?.success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Assign clients"
      >
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6">
            <p className="text-body-sm text-success">{state.success}</p>
            <Button onClick={onClose} variant="secondary" className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Assign clients"
    >
      <Card className="flex max-h-[85vh] w-full max-w-lg flex-col">
        <CardHeader>
          <CardTitle>Assign Clients to {intermediaryName}</CardTitle>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-lg leading-none text-muted hover:text-body-strong"
          >
            &times;
          </button>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {candidates.length === 0 ? (
            <p className="text-body-sm text-muted-soft">No active clients available.</p>
          ) : (
            <form action={formAction} className="flex min-h-0 flex-1 flex-col gap-4">
              <input type="hidden" name="intermediary_id" value={intermediaryId} />

              <div>
                <label
                  htmlFor="assign-clients-search"
                  className="mb-1.5 block text-body-sm font-medium text-body-strong"
                >
                  Search
                </label>
                <input
                  id="assign-clients-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by company, contact, or email"
                  className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong placeholder:text-muted-soft focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <fieldset className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-hairline p-2">
                <legend className="sr-only">Clients</legend>
                {filtered.length === 0 ? (
                  <p className="px-2 py-6 text-center text-body-sm text-muted-soft">
                    No clients match your search.
                  </p>
                ) : (
                  filtered.map((candidate) => {
                    const isCurrent = candidate.intermediary_id === intermediaryId;
                    return (
                      <label
                        key={candidate.id}
                        htmlFor={`candidate-${candidate.id}`}
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-card-elevated"
                      >
                        <input
                          id={`candidate-${candidate.id}`}
                          type="checkbox"
                          name="client_ids"
                          value={candidate.id}
                          defaultChecked={isCurrent}
                          disabled={isCurrent || isPending}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-sm font-medium text-body-strong">
                            {candidate.company_name}
                          </span>
                          <span className="block truncate text-caption text-muted">
                            {[candidate.contact_name, candidate.email].filter(Boolean).join(" · ") || "—"}
                          </span>
                        </span>
                        {isCurrent ? (
                          <Badge variant="success">Current</Badge>
                        ) : candidate.intermediary_id && candidate.intermediary_first_name ? (
                          <Badge
                            variant="warning"
                            title={`Currently assigned to ${candidate.intermediary_first_name} ${candidate.intermediary_last_name ?? ""}`.trim()}
                          >
                            Reassign
                          </Badge>
                        ) : null}
                      </label>
                    );
                  })
                )}
              </fieldset>

              {state?.error && (
                <p role="alert" className="text-body-sm text-error">
                  {state.error}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmRemoveModal({
  client,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  client: AssignedClientRow;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Remove client"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Remove Client</CardTitle>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="text-lg leading-none text-muted hover:text-body-strong"
          >
            &times;
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body-sm text-body">Unassign {client.company_name} from this intermediary?</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1" disabled={isRemoving}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={onConfirm} className="flex-1" disabled={isRemoving}>
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
