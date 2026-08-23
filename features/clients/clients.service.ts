import { query, queryOne, countRows, newId, type InValue } from "@/lib/turso/client";
import type { Client } from "@/types";
import type { ClientFilters, ClientWithRelations } from "./clients.types";

const SORTABLE_COLUMNS = new Set(["created_at", "updated_at", "company_name", "status"]);

function toBoolean(row: Record<string, unknown>): Client {
  return {
    ...(row as unknown as Client),
    is_active: !!row.is_active,
  };
}

function buildSetClause(input: Record<string, unknown>): { set: string[]; args: InValue[] } {
  const allowedColumns = [
    "company_name",
    "contact_name",
    "email",
    "phone",
    "address",
    "country",
    "city",
    "website",
    "notes",
    "logo",
    "status",
    "intermediary_id",
    "created_by",
    "updated_by",
    "deleted_at",
    "is_active",
  ];

  const set: string[] = [];
  const args: InValue[] = [];

  for (const column of allowedColumns) {
    if (column in input && input[column] !== undefined) {
      set.push(`${column} = ?`);
      args.push((column === "is_active" ? (input[column] ? 1 : 0) : input[column]) as InValue);
    }
  }

  return { set, args };
}

export class ClientsService {
  static async list(filters: ClientFilters = {}) {
    const { search, status, page = 1, pageSize = 20, sortBy = "created_at", sortOrder = "desc" } = filters;

    const conditions: string[] = [];
    const args: InValue[] = [];

    if (search) {
      conditions.push(
        "(lower(company_name) LIKE ? OR lower(contact_name) LIKE ? OR lower(email) LIKE ?)",
      );
      const pattern = `%${search.toLowerCase()}%`;
      args.push(pattern, pattern, pattern);
    }
    if (status) {
      conditions.push("status = ?");
      args.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : "created_at";
    const direction = sortOrder === "asc" ? "ASC" : "DESC";

    const total = await countRows(`SELECT COUNT(*) AS total FROM clients ${where}`, args);

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM clients ${where} ORDER BY ${sortColumn} ${direction} LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return {
      data: rows.map(toBoolean) as unknown as ClientWithRelations[],
      total,
      page,
      pageSize,
    };
  }

  static async getById(id: string) {
    const client = await queryOne<Record<string, unknown>>(
      `SELECT * FROM clients WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!client) throw new Error("Client not found.");
    return toBoolean(client);
  }

  static async create(input: Omit<Client, "id" | "created_at" | "updated_at">) {
    const id = newId();

    await query(
      `INSERT INTO clients (
        id, company_name, contact_name, email, phone, address, country, city,
        website, notes, logo, status, intermediary_id, created_by, updated_by,
        deleted_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.company_name,
        input.contact_name ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.address ?? null,
        input.country ?? null,
        input.city ?? null,
        input.website ?? null,
        input.notes ?? null,
        input.logo ?? null,
        input.status,
        input.intermediary_id ?? null,
        input.created_by ?? null,
        input.updated_by ?? null,
        input.deleted_at ?? null,
        input.is_active ? 1 : 0,
      ],
    );

    return ClientsService.getById(id);
  }

  static async update(id: string, input: Partial<Client>) {
    const { set, args } = buildSetClause({ ...input, updated_at: new Date().toISOString() });

    if (set.length === 0) return ClientsService.getById(id);

    await query(
      `UPDATE clients SET ${set.join(", ")} WHERE id = ?`,
      [...args, id],
    );

    return ClientsService.getById(id);
  }

  static async archive(id: string) {
    await query(
      `UPDATE clients SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), id],
    );
  }

  static async restore(id: string) {
    await query(
      `UPDATE clients SET is_active = 1, deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  }
}
