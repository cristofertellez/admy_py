"use client";

import { assignProjectMembers, removeProjectMember } from "@/actions/projects";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { useActionState, useState, useTransition } from "react";
import type { ProjectMember, ProjectMemberCandidate } from "@/features/projects";

// Historia 6.7 — Asignación de Responsables / Gestión de miembros. Multi-select
// assignment of active Developers and Intermediaries plus per-member removal;
// every mutation is authorized again on the server (projects.update).

interface Props {
  projectId: string;
  members: ProjectMember[];
  available: ProjectMemberCandidate[];
}

export function TeamSection({ projectId, members, available }: Props) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(userId: string) {
    setRemoveError(null);
    setIsRemoving(true);
    startTransition(async () => {
      const result = await removeProjectMember(projectId, userId);
      setIsRemoving(false);
      if (result?.error) {
        setRemoveError(result.error);
        return;
      }
      setRemovingUserId(null);
    });
  }

  const developers = members.filter((member) => member.role === "Developer");
  const intermediaries = members.filter((member) => member.role !== "Developer");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.length === 0 ? (
          <p className="text-body-sm text-muted-soft">No members assigned yet.</p>
        ) : (
          <>
            <MemberGroup title="Developers" members={developers} emptyLabel="No developers assigned." />
            <MemberGroup title="Intermediaries" members={intermediaries} emptyLabel="No intermediaries assigned." />
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => setShowAssignModal(true)}>
            Assign Members
          </Button>
          {removeError && (
            <p role="alert" className="text-body-sm text-error">
              {removeError}
            </p>
          )}
        </div>
      </CardContent>

      {showAssignModal && (
        <AssignMembersModal
          projectId={projectId}
          available={available}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {removingUserId && (
        <RemoveMemberConfirm
          memberName={
            [...developers, ...intermediaries].find((m) => m.user_id === removingUserId)?.first_name +
            " " +
            ([...developers, ...intermediaries].find((m) => m.user_id === removingUserId)?.last_name ?? "")
          }
          isRemoving={isRemoving}
          onCancel={() => setRemovingUserId(null)}
          onConfirm={() => handleRemove(removingUserId)}
        />
      )}
    </Card>
  );
}

function MemberGroup({
  title,
  members,
  emptyLabel,
}: {
  title: string;
  members: ProjectMember[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h4 className="text-caption-uppercase text-muted">{title}</h4>
      {members.length === 0 ? (
        <p className="mt-1 text-body-sm text-muted-soft">{emptyLabel}</p>
      ) : (
        <ul className="mt-1 divide-y divide-hairline-soft">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-caption font-semibold text-body-strong"
              >
                {member.first_name[0]}
                {member.last_name[0]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-body-sm font-medium text-body-strong">
                  {member.first_name} {member.last_name}
                </p>
                <p className="truncate text-caption text-muted">{member.email}</p>
              </div>
              {!member.is_active && (
                <Badge variant="error" className="ml-auto shrink-0">
                  Inactive
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignMembersModal({
  projectId,
  available,
  onClose,
}: {
  projectId: string;
  available: ProjectMemberCandidate[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(assignProjectMembers, null);

  if (state?.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Assign members">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 pt-6">
            <p className="text-body-sm text-success">{state.success}</p>
            <Button onClick={onClose} variant="secondary" className="w-full">Done</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const developers = available.filter((candidate) => candidate.role === "Developer");
  const intermediaries = available.filter((candidate) => candidate.role !== "Developer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Assign members">
      <Card className="max-h-[85vh] w-full max-w-md overflow-y-auto">
        <CardHeader>
          <CardTitle>Assign Members</CardTitle>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <p className="text-body-sm text-muted-soft">No Developers or Intermediaries available to assign.</p>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="project_id" value={projectId} />
              <CheckboxGroup title="Developers" candidates={developers} />
              <CheckboxGroup title="Intermediaries" candidates={intermediaries} />
              {state?.error && (
                <p role="alert" className="text-body-sm text-error">{state.error}</p>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : "Assign"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckboxGroup({
  title,
  candidates,
}: {
  title: string;
  candidates: ProjectMemberCandidate[];
}) {
  if (candidates.length === 0) return null;

  return (
    <fieldset>
      <legend className="mb-2 text-caption-uppercase text-muted">{title}</legend>
      <div className="space-y-2">
        {candidates.map((candidate) => (
          <label
            key={candidate.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline px-3 py-2 transition-colors hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              name="user_ids"
              value={candidate.id}
              className="h-4 w-4 accent-[var(--primary,#3B82F6)]"
            />
            <span className="min-w-0">
              <span className="block truncate text-body-sm font-medium text-body-strong">
                {candidate.first_name} {candidate.last_name}
              </span>
              <span className="block truncate text-caption text-muted">{candidate.email}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RemoveMemberConfirm({
  memberName,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  memberName: string;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Remove member">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Remove Member</CardTitle>
          <button onClick={onCancel} aria-label="Close" className="text-muted hover:text-body-strong text-lg leading-none">&times;</button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body-sm text-body">Remove {memberName.trim()} from the project team?</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1" disabled={isRemoving}>
              Cancel
            </Button>
            <Button type="button" onClick={onConfirm} className="flex-1" disabled={isRemoving}>
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
