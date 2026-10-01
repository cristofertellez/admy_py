import { newId, query, queryOne } from "@/lib/turso/client";
import type { Template, TemplateEntityType, TemplateInput } from "./templates.types";

interface TemplateRowRaw {
  id: string;
  name: string;
  description: string | null;
  entity_type: TemplateEntityType;
  payload: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: number;
}

function parsePayload(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function toTemplate(row: TemplateRowRaw): Template {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    entity_type: row.entity_type,
    payload: parsePayload(row.payload),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_active: row.is_active === 1,
  };
}

export class TemplatesService {
  static async list(entityType?: TemplateEntityType) {
    const rows = await query<TemplateRowRaw>(
      `SELECT * FROM templates
       WHERE deleted_at IS NULL AND is_active = 1
       ${entityType ? "AND entity_type = ?" : ""}
       ORDER BY name ASC`,
      entityType ? [entityType] : [],
    );
    return rows.map(toTemplate);
  }

  static async getById(id: string) {
    const row = await queryOne<TemplateRowRaw>(
      "SELECT * FROM templates WHERE id = ? AND deleted_at IS NULL LIMIT 1",
      [id],
    );
    return row ? toTemplate(row) : null;
  }

  static async create(input: TemplateInput, createdBy: string) {
    const id = newId();
    await query(
      `INSERT INTO templates (id, name, description, entity_type, payload, created_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description || null,
        input.entity_type,
        JSON.stringify(input.payload),
        createdBy,
        new Date().toISOString(),
      ],
    );
    return this.getById(id);
  }

  static async update(id: string, input: TemplateInput) {
    await query(
      `UPDATE templates
       SET name = ?, description = ?, entity_type = ?, payload = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [
        input.name,
        input.description || null,
        input.entity_type,
        JSON.stringify(input.payload),
        new Date().toISOString(),
        id,
      ],
    );
    return this.getById(id);
  }

  static async remove(id: string) {
    await query(
      `UPDATE templates SET deleted_at = ?, is_active = 0, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
      [new Date().toISOString(), new Date().toISOString(), id],
    );
  }
}