import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";
import { hashPassword } from "@/lib/auth/password";
import type { UserFilters, UserWithRole } from "./users.types";

const USER_SELECT = `
  SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar,
         u.role_id, r.name AS role_name, u.last_login, u.created_at, u.is_active
  FROM users u
  JOIN roles r ON r.id = u.role_id`;

const SORTABLE_COLUMNS = new Set([
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "avatar",
  "role_id",
  "last_login",
  "created_at",
  "updated_at",
  "is_active",
]);

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role_id: string;
  role_name: string;
  last_login: string | null;
  created_at: string;
  is_active: number;
}

function toUserWithRole(row: UserRow): UserWithRole {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    role_id: row.role_id,
    role_name: row.role_name,
    last_login: row.last_login,
    is_active: !!row.is_active,
    created_at: row.created_at,
  };
}

export class UsersService {
  static async list(filters: UserFilters = {}) {
    const { search, role, status, page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" } = filters;

    const conditions: string[] = [];
    const args: InValue[] = [];

    if (search) {
      conditions.push("(LOWER(u.first_name) LIKE ? OR LOWER(u.last_name) LIKE ? OR LOWER(u.email) LIKE ?)");
      const term = `%${search.toLowerCase()}%`;
      args.push(term, term, term);
    }
    if (role) {
      const roleRow = await queryOne<{ id: string }>("SELECT id FROM roles WHERE name = ? LIMIT 1", [role]);
      if (roleRow) {
        conditions.push("u.role_id = ?");
        args.push(roleRow.id);
      }
    }
    if (status === "active") conditions.push("u.is_active = 1");
    if (status === "inactive") conditions.push("u.is_active = 0");

    const whereSql = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    const orderColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : "created_at";
    const direction = sortOrder === "asc" ? "ASC" : "DESC";
    const offset = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      query<UserRow>(
        `${USER_SELECT}${whereSql} ORDER BY u.${orderColumn} ${direction} LIMIT ? OFFSET ?`,
        [...args, pageSize, offset],
      ),
      countRows(`SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id = u.role_id${whereSql}`, args),
    ]);

    return {
      data: rows.map(toUserWithRole),
      total,
      page,
      pageSize,
    };
  }

  static async create(input: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role_id: string;
  }) {
    const existingUser = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [input.email],
    );

    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    const role = await queryOne<{ id: string }>(
      "SELECT id FROM roles WHERE id = ? LIMIT 1",
      [input.role_id],
    );

    if (!role) {
      throw new Error("The selected role does not exist.");
    }

    const id = newId();

    try {
      await query(
        `INSERT INTO users (id, first_name, last_name, email, password_hash, role_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, input.first_name, input.last_name, input.email, hashPassword(input.password), input.role_id],
      );
    } catch (err) {
      if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
        throw new Error("A user with this email already exists.");
      }
      throw err;
    }

    const created = await queryOne<UserRow>(`${USER_SELECT} WHERE u.id = ? LIMIT 1`, [id]);
    if (!created) {
      throw new Error("Failed to create user.");
    }
    return toUserWithRole(created);
  }

  static async update(id: string, input: { first_name: string; last_name: string; role_id: string }) {
    await query(
      `UPDATE users
       SET first_name = ?, last_name = ?, role_id = ?, updated_at = ?
       WHERE id = ?`,
      [input.first_name, input.last_name, input.role_id, new Date().toISOString(), id],
    );

    const row = await queryOne<UserRow>(`${USER_SELECT} WHERE u.id = ? LIMIT 1`, [id]);
    if (!row) {
      throw new Error("User not found.");
    }
    return toUserWithRole(row);
  }

  static async toggleActive(id: string, isActive: boolean) {
    await query(
      `UPDATE users
       SET is_active = ?, deleted_at = ?, updated_at = ?
       WHERE id = ?`,
      [isActive ? 1 : 0, isActive ? null : new Date().toISOString(), new Date().toISOString(), id],
    );
  }

  static async getRoles() {
    const rows = await query<{
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
      is_active: number;
    }>("SELECT * FROM roles WHERE deleted_at IS NULL ORDER BY name");

    return rows.map((role) => ({
      ...role,
      is_active: !!role.is_active,
    }));
  }

  static async softDeleteRole(id: string) {
    await query(
      `UPDATE roles
       SET is_active = 0, deleted_at = ?, updated_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), id],
    );
  }

  static async getPermissions() {
    return query<{
      id: string;
      name: string;
      description: string | null;
      module: string;
      created_at: string;
    }>("SELECT * FROM permissions ORDER BY module, name");
  }

  static async getPermissionsByRole(roleId: string) {
    const rows = await query<{ permission_id: string }>(
      "SELECT permission_id FROM role_permissions WHERE role_id = ?",
      [roleId],
    );
    return rows.map((r) => r.permission_id);
  }

  static async updateRolePermissions(roleId: string, permissionIds: string[]) {
    await query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

    if (permissionIds.length > 0) {
      const values = permissionIds.map(() => "(?, ?, ?)").join(", ");
      const args: InValue[] = [];
      for (const permissionId of permissionIds) {
        args.push(newId(), roleId, permissionId);
      }
      await query(`INSERT INTO role_permissions (id, role_id, permission_id) VALUES ${values}`, args);
    }
  }
}
