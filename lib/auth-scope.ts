import { getUser, type SessionProfile } from "@/lib/auth";
import { queryOne, type InValue } from "@/lib/turso/client";

export interface ScopeClause {
  sql: string;
  args: InValue[];
}

const DEVELOPER_ROLE = "Developer";

async function requireUser(): Promise<SessionProfile> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized.");
  return user;
}

export async function requireScopedUser(): Promise<SessionProfile> {
  return requireUser();
}

function visibilityPredicate(role: string): string {
  if (role === "Intermediary") return "c.intermediary_id = ?";
  if (role === "Client") return "c.email = ?";
  return "1 = 0";
}

function visibilityArgs(user: SessionProfile, projectId: string): InValue[] {
  if (user.role === "Intermediary") return [projectId, user.id];
  if (user.role === "Client") return [projectId, user.email];
  return [projectId];
}

function projectVisibilityClause(column: string, user: SessionProfile): ScopeClause {
  if (user.role === DEVELOPER_ROLE) return { sql: "", args: [] };

  if (user.role === "Intermediary") {
    return {
      sql: `${column} IN (SELECT p.id FROM projects p JOIN clients c ON c.id = p.client_id WHERE c.intermediary_id = ? AND c.deleted_at IS NULL AND c.is_active = 1)`,
      args: [user.id],
    };
  }

  if (user.role === "Client") {
    return {
      sql: `${column} IN (SELECT p.id FROM projects p JOIN clients c ON c.id = p.client_id WHERE c.email = ? AND c.deleted_at IS NULL AND c.is_active = 1)`,
      args: [user.email],
    };
  }

  return { sql: `${column} IN (SELECT p.id FROM projects p JOIN clients c ON c.id = p.client_id WHERE 1 = 0)`, args: [] };
}

export async function projectScope(column: string): Promise<ScopeClause> {
  const user = await requireUser();
  return projectVisibilityClause(column, user);
}

export async function assertProjectVisible(projectId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (actor.role === DEVELOPER_ROLE) return;

  const visible = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.id = ? AND p.deleted_at IS NULL AND ${visibilityPredicate(actor.role)}`,
    visibilityArgs(actor, projectId),
  );

  if (!visible) throw new Error("You do not have access to this project.");
}

export async function assertTaskVisible(taskId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (actor.role === DEVELOPER_ROLE) return;

  const task = await queryOne<{ project_id: string }>(
    "SELECT project_id FROM tasks WHERE id = ? AND deleted_at IS NULL",
    [taskId],
  );
  if (!task) throw new Error("Task not found.");

  await assertProjectVisible(task.project_id, actor);
}
