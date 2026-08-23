import { newId, query, queryOne, type InValue } from "@/lib/turso/client";

export class TagsService {
  static async list() {
    return query("SELECT * FROM tags ORDER BY name ASC");
  }

  static async create(name: string, color?: string) {
    const id = newId();
    await query("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)", [
      id,
      name,
      color || "#3B82F6",
    ]);
    return queryOne("SELECT * FROM tags WHERE id = ?", [id]);
  }

  static async update(id: string, name: string, color?: string) {
    const entries: [string, InValue][] = [["name", name]];
    if (color !== undefined) entries.push(["color", color]);

    const assignments = entries.map(([key]) => `${key} = ?`).join(", ");
    await query(`UPDATE tags SET ${assignments} WHERE id = ?`, [...entries.map(([, value]) => value), id]);

    return queryOne("SELECT * FROM tags WHERE id = ?", [id]);
  }

  static async remove(id: string) {
    await query("DELETE FROM tags WHERE id = ?", [id]);
    return true;
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
