import { query, queryOne } from "@/lib/turso/client";
import { assertProjectVisible } from "@/lib/auth-scope";

export class MilestonesService {
  static async listByProject(projectId: string) {
    await assertProjectVisible(projectId);

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM milestones WHERE project_id = ? AND deleted_at IS NULL ORDER BY sort_order`,
      [projectId],
    );

    return rows.map((row) => ({
      ...row,
      is_active: !!row.is_active,
    }));
  }

  static async getById(id: string) {
    const milestone = await queryOne<Record<string, unknown>>(
      `SELECT * FROM milestones WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!milestone) throw new Error("Milestone not found.");
    await assertProjectVisible(milestone.project_id as string);

    return { ...milestone, is_active: !!milestone.is_active };
  }
}
