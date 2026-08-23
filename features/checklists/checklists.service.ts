import { assertTaskVisible, projectScope } from "@/lib/auth-scope";
import { newId, query, queryOne } from "@/lib/turso/client";
import type { ChecklistItem } from "./checklists.types";

interface ChecklistItemRow extends Omit<ChecklistItem, "is_completed" | "is_active"> {
  is_completed: number;
  is_active: number;
}

function mapItem(row: ChecklistItemRow): ChecklistItem {
  return {
    ...row,
    is_completed: Number(row.is_completed) === 1,
    is_active: Number(row.is_active) === 1,
  };
}

export class ChecklistsService {
  static async listByTask(taskId: string): Promise<ChecklistItem[]> {
    const scope = await projectScope("t.project_id");
    const rows = await query<ChecklistItemRow>(
      `SELECT ci.*
       FROM checklist_items ci
       JOIN tasks t ON t.id = ci.task_id
       WHERE ci.task_id = ? AND ci.is_active = 1 AND ci.deleted_at IS NULL${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY ci.sort_order ASC`,
      [taskId, ...scope.args],
    );

    return rows.map(mapItem);
  }

  static async create(data: {
    task_id: string;
    title: string;
    created_by?: string;
  }): Promise<ChecklistItem> {
    await assertTaskVisible(data.task_id);

    const maxItem = await queryOne<{ max_sort: number | null }>(
      "SELECT MAX(sort_order) AS max_sort FROM checklist_items WHERE task_id = ? AND is_active = 1 AND deleted_at IS NULL",
      [data.task_id],
    );

    const sortOrder = (maxItem?.max_sort ?? -1) + 1;
    const id = newId();

    await query(
      `INSERT INTO checklist_items (id, task_id, title, is_completed, sort_order, created_by)
       VALUES (?, ?, ?, 0, ?, ?)`,
      [id, data.task_id, data.title, sortOrder, data.created_by ?? null],
    );

    const row = await queryOne<ChecklistItemRow>("SELECT * FROM checklist_items WHERE id = ?", [id]);
    return mapItem(row!);
  }

  static async toggle(id: string): Promise<ChecklistItem> {
    const existing = await queryOne<ChecklistItemRow>("SELECT * FROM checklist_items WHERE id = ?", [
      id,
    ]);
    if (!existing) throw new Error("Checklist item not found");

    await assertTaskVisible(existing.task_id);

    const isNowCompleted = !(Number(existing.is_completed) === 1);
    const now = new Date().toISOString();

    await query(
      `UPDATE checklist_items
       SET is_completed = ?, completed_at = ?, completed_by = ?, updated_at = ?
       WHERE id = ?`,
      [
        isNowCompleted ? 1 : 0,
        isNowCompleted ? now : null,
        isNowCompleted ? existing.completed_by : null,
        now,
        id,
      ],
    );

    const row = await queryOne<ChecklistItemRow>("SELECT * FROM checklist_items WHERE id = ?", [id]);
    return mapItem(row!);
  }

  static async update(
    id: string,
    data: { title?: string; sort_order?: number }
  ): Promise<ChecklistItem> {
    const existing = await queryOne<ChecklistItemRow>("SELECT * FROM checklist_items WHERE id = ?", [
      id,
    ]);
    if (!existing) throw new Error("Checklist item not found");

    await assertTaskVisible(existing.task_id);

    const entries = Object.entries(data).filter(([, value]) => value !== undefined);
    if (entries.length > 0) {
      const assignments = [...entries.map(([key]) => `${key} = ?`), "updated_at = ?"];
      await query(`UPDATE checklist_items SET ${assignments.join(", ")} WHERE id = ?`, [
        ...entries.map(([, value]) => value),
        new Date().toISOString(),
        id,
      ]);
    }

    const row = await queryOne<ChecklistItemRow>("SELECT * FROM checklist_items WHERE id = ?", [id]);
    return mapItem(row!);
  }

  static async delete(id: string): Promise<void> {
    const existing = await queryOne<{ task_id: string }>(
      "SELECT task_id FROM checklist_items WHERE id = ?",
      [id],
    );
    if (!existing) return;

    await assertTaskVisible(existing.task_id);

    const now = new Date().toISOString();
    await query("UPDATE checklist_items SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);
  }

  static async reorder(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await query("UPDATE checklist_items SET sort_order = ?, updated_at = ? WHERE id = ?", [
        i,
        new Date().toISOString(),
        orderedIds[i],
      ]);
    }
  }
}
