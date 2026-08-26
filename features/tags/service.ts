import { getTursoClient, newId, query, queryOne } from "@/lib/turso/client";
import { DEFAULT_TAG_COLOR } from "@/constants";
import type { Tag } from "@/types";

export class TagsService {
  static async list(): Promise<Tag[]> {
    return query<Tag>("SELECT id, name, color, created_at FROM tags ORDER BY name ASC");
  }

  static async getById(id: string): Promise<Tag> {
    const tag = await queryOne<Tag>("SELECT id, name, color, created_at FROM tags WHERE id = ? LIMIT 1", [id]);
    if (!tag) throw new Error("Tag not found.");
    return tag;
  }

  // Tag names are unique regardless of casing (UNIQUE constraint on tags.name
  // is byte-exact, so the friendly check is case-insensitive).
  private static async assertNameAvailable(name: string, excludeId?: string) {
    const duplicate = await queryOne<{ id: string }>(
      "SELECT id FROM tags WHERE lower(name) = lower(?) AND (? IS NULL OR id <> ?) LIMIT 1",
      [name, excludeId ?? null, excludeId ?? null],
    );
    if (duplicate) throw new Error("A tag with this name already exists.");
  }

  static async create(name: string, color?: string): Promise<Tag> {
    await TagsService.assertNameAvailable(name);

    const id = newId();
    await query("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)", [
      id,
      name,
      color || DEFAULT_TAG_COLOR,
    ]);

    return TagsService.getById(id);
  }

  static async update(id: string, name: string, color?: string): Promise<Tag> {
    const current = await TagsService.getById(id);
    await TagsService.assertNameAvailable(name, id);

    const nextColor = color || current.color;
    await query("UPDATE tags SET name = ?, color = ? WHERE id = ?", [name, nextColor, id]);

    return TagsService.getById(id);
  }

  // Removing a tag cascades to project_tags/task_tags (ON DELETE CASCADE), so
  // assignments never dangle after a deletion.
  static async remove(id: string): Promise<boolean> {
    await TagsService.getById(id);
    await query("DELETE FROM tags WHERE id = ?", [id]);
    return true;
  }

  static async listByIds(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(", ");
    return query<Tag>(
      `SELECT id, name, color FROM tags WHERE id IN (${placeholders}) ORDER BY name ASC`,
      ids,
    );
  }

  static async listByProject(projectId: string): Promise<Tag[]> {
    return query<Tag>(
      `SELECT t.id, t.name, t.color
       FROM project_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.project_id = ?
       ORDER BY t.name ASC`,
      [projectId],
    );
  }

  static async listByTask(taskId: string): Promise<Tag[]> {
    return query<Tag>(
      `SELECT t.id, t.name, t.color
       FROM task_tags tt
       JOIN tags t ON t.id = tt.tag_id
       WHERE tt.task_id = ?
       ORDER BY t.name ASC`,
      [taskId],
    );
  }

  // Batched lookup used by ProjectsService.list to attach the tags of a whole
  // page of projects without N+1 queries.
  static async listByProjectIds(
    projectIds: string[],
  ): Promise<Map<string, Pick<Tag, "id" | "name" | "color">[]>> {
    const tagsByProject = new Map<string, Pick<Tag, "id" | "name" | "color">[]>();
    if (projectIds.length === 0) return tagsByProject;

    const placeholders = projectIds.map(() => "?").join(", ");
    const rows = await query<{ project_id: string; id: string; name: string; color: string }>(
      `SELECT pt.project_id, t.id, t.name, t.color
       FROM project_tags pt
       JOIN tags t ON t.id = pt.tag_id
       WHERE pt.project_id IN (${placeholders})
       ORDER BY t.name ASC`,
      projectIds,
    );

    for (const row of rows) {
      const tags = tagsByProject.get(row.project_id) ?? [];
      tags.push({ id: row.id, name: row.name, color: row.color });
      tagsByProject.set(row.project_id, tags);
    }

    return tagsByProject;
  }

  // Replaces the full tag set of a project in a single transaction (Historia
  // 6.10). Unknown ids abort the whole sync so partial assignments never persist.
  static async setProjectTags(projectId: string, tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const validTags = await TagsService.listByIds(uniqueIds);
    if (validTags.length !== uniqueIds.length) {
      throw new Error("One or more selected tags no longer exist.");
    }

    const statements = [
      { sql: "DELETE FROM project_tags WHERE project_id = ?", args: [projectId] },
      ...uniqueIds.map((tagId) => ({
        sql: "INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)",
        args: [projectId, tagId],
      })),
    ];
    await getTursoClient().batch(statements, "write");

    return validTags;
  }

  // Task-side mirror of setProjectTags (Historia 7.17): replaces the full tag
  // set in a single transaction so partial assignments never persist.
  static async setTaskTags(taskId: string, tagIds: string[]): Promise<Tag[]> {
    const uniqueIds = [...new Set(tagIds)];
    const validTags = await TagsService.listByIds(uniqueIds);
    if (validTags.length !== uniqueIds.length) {
      throw new Error("One or more selected tags no longer exist.");
    }

    const statements = [
      { sql: "DELETE FROM task_tags WHERE task_id = ?", args: [taskId] },
      ...uniqueIds.map((tagId) => ({
        sql: "INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)",
        args: [taskId, tagId],
      })),
    ];
    await getTursoClient().batch(statements, "write");

    return validTags;
  }

  static async assignToProject(projectId: string, tagId: string) {
    await query("INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)", [projectId, tagId]);
    return true;
  }

  static async removeFromProject(projectId: string, tagId: string) {
    await query("DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?", [projectId, tagId]);
    return true;
  }

  static async assignToTask(taskId: string, tagId: string) {
    await query("INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)", [taskId, tagId]);
    return true;
  }

  static async removeFromTask(taskId: string, tagId: string) {
    await query("DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?", [taskId, tagId]);
    return true;
  }
}
