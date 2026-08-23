import { query, queryOne } from "@/lib/turso/client";

export class MilestonesService {
  static async listByProject(projectId: string) {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order`,
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
    return { ...milestone, is_active: !!milestone.is_active };
  }
}
