import { getUser, type SessionProfile } from "@/lib/auth";
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

const DEVELOPER_ROLE = "Developer";

const SCOPED_ENTITY_TYPES = new Set(["project", "task", "milestone", "client"]);

async function requireUser(): Promise<SessionProfile> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized.");
  return user;
}

export async function requireScopedUser(): Promise<SessionProfile> {
  return requireUser();
}

function isDeveloper(user: SessionProfile): boolean {
  return user.role === DEVELOPER_ROLE;
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
  if (isDeveloper(user)) return { sql: "", args: [] };

  const fragment = visibleProjectsFragment(user);
  return { sql: `${column} IN ${fragment.sql}`, args: fragment.args };
}

function clientVisibilityClause(column: string, user: SessionProfile): ScopeClause {
  if (isDeveloper(user)) return { sql: "", args: [] };

  const fragment = visibleClientsFragment(user);
  return { sql: `${column} IN ${fragment.sql}`, args: fragment.args };
}

export async function projectScope(column: string): Promise<ScopeClause> {
  const user = await requireUser();
  return projectVisibilityClause(column, user);
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
  if (isDeveloper(user)) return { sql: "", args: [] };

  const projects = visibleProjectsFragment(user);
  const clients = visibleClientsFragment(user);
  const tasksInProjects = `(SELECT t.id FROM tasks t WHERE t.deleted_at IS NULL AND t.project_id IN ${projects.sql})`;
  const milestonesInProjects = `(SELECT m.id FROM milestones m WHERE m.deleted_at IS NULL AND m.project_id IN ${projects.sql})`;

  const args: InValue[] = [...clients.args, ...projects.args, ...projects.args, ...projects.args];

  const sql = `(
    (${entityTypeColumn} = 'client' AND ${entityIdColumn} IN ${clients.sql})
    OR (${entityTypeColumn} = 'project' AND ${entityIdColumn} IN ${projects.sql})
    OR (${entityTypeColumn} = 'task' AND ${entityIdColumn} IN ${tasksInProjects})
    OR (${entityTypeColumn} = 'milestone' AND ${entityIdColumn} IN ${milestonesInProjects})
  )`;

  return { sql, args };
}

export async function assertProjectVisible(projectId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isDeveloper(actor)) return;

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
  if (isDeveloper(actor)) return;

  const task = await queryOne<{ project_id: string }>(
    "SELECT project_id FROM tasks WHERE id = ? AND deleted_at IS NULL",
    [taskId],
  );
  if (!task) throw new Error("Task not found.");

  await assertProjectVisible(task.project_id, actor);
}

export async function assertClientVisible(clientId: string, user?: SessionProfile): Promise<void> {
  const actor = user ?? (await requireUser());
  if (isDeveloper(actor)) return;

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
  if (isDeveloper(actor)) return;

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
  if (isDeveloper(actor)) return;

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
    default:
      await denyAccess(actor, "You do not have access to this resource.", entityType, entityId);
  }
}

export function isScopedEntityType(entityType: string): boolean {
  return SCOPED_ENTITY_TYPES.has(entityType?.toLowerCase());
}
