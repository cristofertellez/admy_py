import { getUser, type SessionProfile } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { queryOne, type InValue } from "@/lib/turso/client";
import { ActivityService } from "@/services/activity.service";

export interface ScopeClause {
  sql: string;
  args: InValue[];
}

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export function isAccessDeniedError(error: unknown): error is AccessDeniedError {
  return error instanceof AccessDeniedError;
}

const SCOPED_ENTITY_TYPES = new Set(["project", "task", "milestone", "client", "comment"]);

// Épica 17 (17.1/17.2) — API-key requests carry no NextAuth session; the
// public API wraps its handlers with the key owner's profile so every
// data-layer scope resolves to the same visibility rules as the UI.
// The AsyncLocalStorage instance lives in lib/api/actor-context.ts (server
// only) and is injected through globalThis so this module — which is also
// part of client bundles through shared services — never imports
// node:async_hooks.
const ACTOR_CONTEXT_KEY = "__admipyActorContext";

interface ActorContext {
  getStore(): SessionProfile | undefined;
}

function getActorContext(): ActorContext | null {
  const candidate = (globalThis as Record<string, unknown>)[ACTOR_CONTEXT_KEY];
  return candidate && typeof (candidate as ActorContext).getStore === "function"
    ? (candidate as ActorContext)
    : null;
}

async function requireUser(): Promise<SessionProfile> {
  const override = getActorContext()?.getStore();
  if (override) return override;

  const user = await getUser();
  if (!user) throw new Error("Unauthorized.");
  return user;
}

export async function requireScopedUser(): Promise<SessionProfile> {
  return requireUser();
}

function isFullAccessUser(user: SessionProfile): boolean {
  // Historia 6.18: Developer, Administrator y Super Administrator ven todos
  // los datos; Client e Intermediary pasan por los filtros de cartera.
  return hasFullAccess(user.role);
}

async function denyAccess(
  actor: SessionProfile,
  message: string,
  entity: string,
  entityId?: string,
): Promise<never> {
  await ActivityService.log({
    user_id: actor.id,
    action: "access_denied",
    entity,
    entity_id: entityId,
    new_value: { role: actor.role },
  });

  throw new AccessDeniedError(message);
}

function projectMembershipFilter(user: SessionProfile): { predicate: string; args: InValue[] } {
  if (user.role === "Intermediary") return { predicate: "cl.intermediary_id = ?", args: [user.id] };
  if (user.role === "Client") return { predicate: "cl.email = ?", args: [user.email] };
  return { predicate: "1 = 0", args: [] };
}

function visibleProjectsFragment(user: SessionProfile): ScopeClause {
  const { predicate, args } = projectMembershipFilter(user);

  return {
    sql: `(SELECT pj.id FROM projects pj JOIN clients cl ON cl.id = pj.client_id
           WHERE pj.deleted_at IS NULL AND cl.deleted_at IS NULL AND cl.is_active = 1 AND ${predicate})`,
    args,
  };
}

function visibleClientsFragment(user: SessionProfile): ScopeClause {
  if (user.role === "Intermediary") {
    return {
      sql: "(SELECT cl.id FROM clients cl WHERE cl.intermediary_id = ? AND cl.deleted_at IS NULL AND cl.is_active = 1)",
      args: [user.id],
    };
  }

  if (user.role === "Client") {
    return {
      sql: "(SELECT cl.id FROM clients cl WHERE cl.email = ? AND cl.deleted_at IS NULL AND cl.is_active = 1)",
      args: [user.email],
    };
  }

  return { sql: "(SELECT cl.id FROM clients cl WHERE 1 = 0)", args: [] };
}

function projectVisibilityClause(column: string, user: SessionProfile): ScopeClause {
  if (isFullAccessUser(user)) return { sql: "", args: [] };

  const fragment = visibleProjectsFragment(user);
  return { sql: `${column} IN ${fragment.sql}`, args: fragment.args };
}

function clientVisibilityClause(column: string, user: SessionProfile): ScopeClause {
  if (isFullAccessUser(user)) return { sql: "", args: [] };

  const fragment = visibleClientsFragment(user);
  return { sql: `${column} IN ${fragment.sql}`, args: fragment.args };
}

export async function projectScope(column: string): Promise<ScopeClause> {
  const user = await requireUser();
  return projectVisibilityClause(column, user);
}

async function milestoneVisibilityClause(column: string, user: SessionProfile): Promise<ScopeClause> {
  if (isFullAccessUser(user)) return { sql: "", args: [] };

  const { sql, args } = visibleProjectsFragment(user);
  return {
    sql: `${column} IN (SELECT m.id FROM milestones m WHERE m.deleted_at IS NULL AND m.project_id IN ${sql})`,
    args,
  };
}

export async function milestoneScope(column: string): Promise<ScopeClause> {
  const user = await requireUser();
  return milestoneVisibilityClause(column, user);
}

export async function clientScope(column: string): Promise<ScopeClause> {
  const user = await requireUser();
  return clientVisibilityClause(column, user);
}

export async function attachmentScope(
  entityTypeColumn: string,
  entityIdColumn: string,
): Promise<ScopeClause> {
  const user = await requireUser();
  if (isFullAccessUser(user)) return { sql: "", args: [] };

  const projects = visibleProjectsFragment(user);
  const clients = visibleClientsFragment(user);
  const tasksInProjects = `(SELECT t.id FROM tasks t WHERE t.deleted_at IS NULL AND t.project_id IN ${projects.sql})`;
  const milestonesInProjects = `(SELECT m.id FROM milestones m WHERE m.deleted_at IS NULL AND m.project_id IN ${projects.sql})`;

  // Fragments are emitted in the exact order their SQL placeholders appear so
  // the flattened args array stays aligned with the final WHERE clause.
  const clientFragment = { sql: clients.sql, args: clients.args };
  const projectFragment = { sql: projects.sql, args: projects.args };

  const commentFragments = [
    `SELECT pc.id FROM project_comments pc WHERE pc.deleted_at IS NULL AND pc.project_id IN ${projects.sql}`,
    `SELECT tc.id FROM task_comments tc JOIN tasks t ON t.id = tc.task_id WHERE tc.deleted_at IS NULL AND t.project_id IN ${projects.sql}`,
    `SELECT mc.id FROM milestone_comments mc JOIN milestones m ON m.id = mc.milestone_id WHERE mc.deleted_at IS NULL AND m.project_id IN ${projects.sql}`,
    `SELECT cc.id FROM client_comments cc WHERE cc.deleted_at IS NULL AND cc.client_id IN ${clients.sql}`,
  ];

  const conditions: string[] = [
    `${entityTypeColumn} = 'client' AND ${entityIdColumn} IN ${clientFragment.sql}`,
    `${entityTypeColumn} = 'project' AND ${entityIdColumn} IN ${projectFragment.sql}`,
    `${entityTypeColumn} = 'task' AND ${entityIdColumn} IN ${tasksInProjects}`,
    `${entityTypeColumn} = 'milestone' AND ${entityIdColumn} IN ${milestonesInProjects}`,
    `${entityTypeColumn} = 'comment' AND ${entityIdColumn} IN (${commentFragments.join(" UNION ALL ")})`,
  ];

  const args: InValue[] = [
    ...clientFragment.args,
    ...projectFragment.args,
    ...projectFragment.args,
    ...projectFragment.args,
    ...projectFragment.args,
    ...projectFragment.args,
    ...projectFragment.args,
    ...clientFragment.args,
  ];

  return { sql: `(${conditions.join("\n    OR ")})`, args };
}

export async function assertProjectVisible(projectId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isFullAccessUser(actor)) return;

  const membership = projectMembershipFilter(actor);
  const visible = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     WHERE p.id = ? AND p.deleted_at IS NULL AND c.deleted_at IS NULL AND c.is_active = 1
       AND ${membership.predicate}`,
    [projectId, ...membership.args],
  );

  if (!visible) {
    await denyAccess(actor, "You do not have access to this project.", "Project", projectId);
  }
}

export async function assertTaskVisible(taskId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isFullAccessUser(actor)) return;

  const task = await queryOne<{ project_id: string }>(
    "SELECT project_id FROM tasks WHERE id = ? AND deleted_at IS NULL",
    [taskId],
  );
  if (!task) throw new Error("Task not found.");

  await assertProjectVisible(task.project_id, actor);
}

export async function assertClientVisible(clientId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isFullAccessUser(actor)) return;

  const filter =
    actor.role === "Intermediary"
      ? { predicate: "c.intermediary_id = ?", args: [actor.id] as InValue[] }
      : actor.role === "Client"
        ? { predicate: "c.email = ?", args: [actor.email] as InValue[] }
        : { predicate: "1 = 0", args: [] as InValue[] };

  const visible = await queryOne<{ ok: number }>(
    `SELECT 1 AS ok
     FROM clients c
     WHERE c.id = ? AND c.deleted_at IS NULL AND c.is_active = 1 AND ${filter.predicate}`,
    [clientId, ...filter.args],
  );

  if (!visible) {
    await denyAccess(actor, "You do not have access to this client.", "Client", clientId);
  }
}

export async function assertMilestoneVisible(
  milestoneId: string,
  user?: SessionProfile,
): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isFullAccessUser(actor)) return;

  const milestone = await queryOne<{ project_id: string }>(
    "SELECT project_id FROM milestones WHERE id = ? AND deleted_at IS NULL",
    [milestoneId],
  );
  if (!milestone) throw new Error("Milestone not found.");

  await assertProjectVisible(milestone.project_id, actor);
}

export async function assertEntityVisible(
  entityType: string,
  entityId: string,
  user?: SessionProfile,
): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isFullAccessUser(actor)) return;

  const normalizedType = entityType?.toLowerCase();

  switch (normalizedType) {
    case "project":
      return assertProjectVisible(entityId, actor);
    case "task":
      return assertTaskVisible(entityId, actor);
    case "milestone":
      return assertMilestoneVisible(entityId, actor);
    case "client":
      return assertClientVisible(entityId, actor);
    case "comment":
      return assertCommentVisible(entityId, actor);
    default:
      await denyAccess(actor, "You do not have access to this resource.", entityType, entityId);
  }
}

// A comment's visibility follows its parent entity. Since comments live across
// four tables (project/task/milestone/client) the parent is resolved by lookup.
export async function assertCommentVisible(commentId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isFullAccessUser(actor)) return;

  const parent = await queryOne<{ entity_type: string; entity_id: string }>(
    `SELECT 'project' AS entity_type, project_id AS entity_id FROM project_comments WHERE id = ?
     UNION ALL SELECT 'task', task_id FROM task_comments WHERE id = ?
     UNION ALL SELECT 'milestone', milestone_id FROM milestone_comments WHERE id = ?
     UNION ALL SELECT 'client', client_id FROM client_comments WHERE id = ?
     LIMIT 1`,
    [commentId, commentId, commentId, commentId],
  );

  if (!parent) {
    await denyAccess(actor, "You do not have access to this comment.", "Comment", commentId);
  }

  await assertEntityVisible(parent!.entity_type, parent!.entity_id, actor);
}

export function isScopedEntityType(entityType: string): boolean {
  return SCOPED_ENTITY_TYPES.has(entityType?.toLowerCase());
}
