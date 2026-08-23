import { query, queryOne, countRows, newId, type InValue } from "@/lib/turso/client";
import { hashPassword } from "@/lib/auth/password";
import type { Client } from "@/types";

function mapUser(row: Record<string, unknown>) {
  return {
    ...(row as Record<string, unknown>),
    is_active: !!row.is_active,
  };
}

function mapClient(row: Record<string, unknown>): Client {
  return {
    ...(row as unknown as Client),
    is_active: !!row.is_active,
  };
}

export class IntermediariesService {
  static async list(filters: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search, page = 1, pageSize = 20 } = filters;

    const conditions: string[] = ["r.name = 'Intermediary'"];
    const args: InValue[] = [];

    if (search) {
      conditions.push(
        "(lower(u.first_name) LIKE ? OR lower(u.last_name) LIKE ? OR lower(u.email) LIKE ?)",
      );
      const pattern = `%${search.toLowerCase()}%`;
      args.push(pattern, pattern, pattern);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const total = await countRows(
      `SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id ${where}`,
      args,
    );

    const rows = await query<Record<string, unknown>>(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return { data: rows.map(mapUser), total, page, pageSize };
  }

  static async getById(id: string) {
    const user = await queryOne<Record<string, unknown>>(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       LIMIT 1`,
      [id],
    );

    if (!user) throw new Error("Intermediary not found.");
    return mapUser(user);
  }

  static async create(input: { first_name: string; last_name: string; email: string; password: string }) {
    const role = await queryOne<{ id: string }>(
      `SELECT id FROM roles WHERE name = 'Intermediary' LIMIT 1`,
    );

    if (!role) throw new Error("The Intermediary role does not exist.");

    const id = newId();

    await query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.first_name, input.last_name, input.email, hashPassword(input.password), role.id],
    );

    return IntermediariesService.getById(id);
  }

  static async update(id: string, input: Record<string, unknown>) {
    const allowedColumns = ["first_name", "last_name", "phone", "avatar"];

    const set: string[] = [];
    const args: InValue[] = [];

    for (const column of allowedColumns) {
      if (column in input && input[column] !== undefined) {
        set.push(`${column} = ?`);
        args.push(input[column] as InValue);
      }
    }

    if (set.length === 0) return IntermediariesService.getById(id);

    set.push("updated_at = ?");
    args.push(new Date().toISOString());

    await query(`UPDATE users SET ${set.join(", ")} WHERE id = ?`, [...args, id]);

    return IntermediariesService.getById(id);
  }

  static async toggleActive(id: string, isActive: boolean) {
    await query(
      `UPDATE users SET is_active = ?, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [
        isActive ? 1 : 0,
        isActive ? null : new Date().toISOString(),
        new Date().toISOString(),
        id,
      ],
    );
  }

  static async getAssignedClients(intermediaryId: string): Promise<Client[]> {
    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM clients WHERE intermediary_id = ?`,
      [intermediaryId],
    );

    return rows.map(mapClient);
  }
}
