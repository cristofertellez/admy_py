"use server";

import { query } from "@/lib/turso/client";
import { getUser } from "@/lib/auth";
import { clientScope, projectScope } from "@/lib/auth-scope";
import { CommentsService } from "@/features/comments";

export interface SearchResult {
  id: string;
  type: "project" | "task" | "client" | "milestone" | "comment";
  title: string;
  subtitle: string;
  url: string;
  status?: string;
  priority?: string;
}

export async function globalSearch(
  _prevState: unknown,
  formData: FormData
): Promise<{ results?: SearchResult[]; error?: string }> {
  try {
    const searchTerm = (formData.get("query") as string)?.trim();
    if (!searchTerm || searchTerm.length < 2) {
      return { results: [] };
    }

    const user = await getUser();
    if (!user) return { error: "Not authenticated." };

    const [projectClause, taskClause, milestoneClause, clientClause] = await Promise.all([
      projectScope("p.id"),
      projectScope("t.project_id"),
      projectScope("m.project_id"),
      clientScope("id"),
    ]);

    const pattern = `%${searchTerm.toLowerCase()}%`;
    const results: SearchResult[] = [];

    const [projectsRes, tasksRes, clientsRes, milestonesRes] = await Promise.allSettled([
      query<Record<string, unknown>>(
        `SELECT p.id, p.name, p.status, c.company_name
         FROM projects p
         LEFT JOIN clients c ON c.id = p.client_id
         WHERE (lower(p.name) LIKE ? OR lower(p.description) LIKE ?)
           AND p.is_active = 1
           AND ${projectClause.sql}
         LIMIT 5`,
        [pattern, pattern, ...projectClause.args],
      ),
      query<Record<string, unknown>>(
        `SELECT t.id, t.title, t.status, t.priority, p.name AS project_name
         FROM tasks t
         LEFT JOIN projects p ON p.id = t.project_id
         WHERE (lower(t.title) LIKE ? OR lower(t.description) LIKE ?)
           AND t.is_active = 1
           AND ${taskClause.sql}
         LIMIT 5`,
        [pattern, pattern, ...taskClause.args],
      ),
      query<Record<string, unknown>>(
        `SELECT id, company_name, email, phone, status
         FROM clients
         WHERE (lower(company_name) LIKE ? OR lower(email) LIKE ? OR lower(contact_name) LIKE ? OR lower(phone) LIKE ?)
           AND is_active = 1
           AND deleted_at IS NULL
           AND ${clientClause.sql}
         LIMIT 5`,
        [pattern, pattern, pattern, pattern, ...clientClause.args],
      ),
      query<Record<string, unknown>>(
        `SELECT m.id, m.title, m.status, p.name AS project_name, m.project_id
         FROM milestones m
         LEFT JOIN projects p ON p.id = m.project_id
         WHERE (lower(m.title) LIKE ? OR lower(m.description) LIKE ?)
           AND m.is_active = 1
           AND ${milestoneClause.sql}
         LIMIT 5`,
        [pattern, pattern, ...milestoneClause.args],
      ),
    ]);

    if (projectsRes.status === "fulfilled") {
      for (const p of projectsRes.value) {
        results.push({
          id: p.id as string,
          type: "project",
          title: p.name as string,
          subtitle: p.company_name ? `Client: ${p.company_name}` : "Project",
          url: `/dashboard/projects/${p.id}`,
          status: p.status as string,
        });
      }
    }

    if (tasksRes.status === "fulfilled") {
      for (const t of tasksRes.value) {
        results.push({
          id: t.id as string,
          type: "task",
          title: t.title as string,
          subtitle: t.project_name ? `Project: ${t.project_name}` : "Task",
          url: `/dashboard/tasks/${t.id}`,
          status: t.status as string,
          priority: t.priority as string,
        });
      }
    }

    if (clientsRes.status === "fulfilled") {
      for (const c of clientsRes.value) {
        results.push({
          id: c.id as string,
          type: "client",
          title: c.company_name as string,
          subtitle: (c.email as string) || (c.phone as string) || "Client",
          url: `/dashboard/clients/${c.id}`,
          status: c.status as string,
        });
      }
    }

    if (milestonesRes.status === "fulfilled") {
      for (const m of milestonesRes.value) {
        results.push({
          id: m.id as string,
          type: "milestone",
          title: m.title as string,
          subtitle: m.project_name ? `Project: ${m.project_name}` : "Milestone",
          url: `/dashboard/projects/${m.project_id}`,
          status: m.status as string,
        });
      }
    }

    const commentRows = await CommentsService.search(searchTerm, 5);

    const commentUrlByType: Record<string, (row: Record<string, unknown>) => string> = {
      project: (row) => `/dashboard/projects/${row.entity_id}`,
      milestone: (row) => `/dashboard/projects/${row.project_id ?? ""}`,
      task: (row) => `/dashboard/tasks/${row.entity_id}`,
      client: (row) => `/dashboard/clients/${row.entity_id}`,
    };

    for (const c of commentRows) {
      const entityType = c.entity_type as string;
      results.push({
        id: c.comment_id as string,
        type: "comment",
        title: String(c.message).slice(0, 120),
        subtitle: `${c.author_first_name ?? ""} ${c.author_last_name ?? ""} in ${c.entity_name ?? entityType}`.trim(),
        url: commentUrlByType[entityType]?.(c) ?? "/dashboard/search",
      });
    }

    return { results };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Search failed." };
  }
}
