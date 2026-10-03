import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";
import { assertEntityVisible, attachmentScope, isScopedEntityType } from "@/lib/auth-scope";
import { deleteFromR2, getSignedDownloadUrl, isBucket, uploadToR2 } from "@/lib/storage/r2";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export const FILE_CATEGORIES = [
  "Documentación",
  "Diseño",
  "Contratos",
  "Recursos",
  "Entregables",
  "Otros",
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];

export const FILE_ACCESS_LEVELS = ["read", "download", "hidden"] as const;
export type FileAccessLevel = (typeof FILE_ACCESS_LEVELS)[number];

interface AttachmentDbRow {
  id: string;
  bucket: string;
  storage_path: string;
  filename: string;
  extension: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string;
  entity_type: string;
  entity_id: string;
  category: string;
  version: number;
  version_of: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_active: number;
  uploader_first_name: string | null;
  uploader_last_name: string | null;
}

function withUploader({ uploader_first_name, uploader_last_name, ...row }: AttachmentDbRow) {
  return {
    ...row,
    users:
      uploader_first_name !== null && uploader_last_name !== null
        ? { first_name: uploader_first_name, last_name: uploader_last_name }
        : null,
  };
}

export interface FileShareRow {
  id: string;
  attachment_id: string;
  entity_type: string;
  entity_id: string;
  access_level: FileAccessLevel;
  created_at: string;
}

export class FilesService {
  // ============================================================
  // Upload (Historia 10.2) — lógica centralizada usada por la Server Action
  // y por el Route Handler (subida con progreso/cancelación vía XHR).
  // ============================================================

  static async uploadAttachment(input: {
    file: File;
    userId: string;
    entityType: string;
    entityId: string;
    category?: string;
    versionOf?: string | null;
  }): Promise<{ id: string; filename: string; entity_type: string; entity_id: string; version: number }> {
    const { file, userId, entityType, entityId } = input;
    const category = input.category || "Otros";
    const versionOf = input.versionOf ?? null;

    if (!isScopedEntityType(entityType)) {
      throw new Error("Invalid entity type.");
    }
    if (!FILE_CATEGORIES.includes(category as never)) {
      throw new Error("Invalid category.");
    }

    await assertEntityVisible(entityType, entityId);

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size must be under 10MB.");
    }

    const mimeType = file.type;
    const extension = ALLOWED_FILE_TYPES[mimeType];
    if (!extension) {
      throw new Error("File type not allowed.");
    }

    const bucket = "attachments";
    if (!isBucket(bucket)) {
      throw new Error("Invalid storage bucket.");
    }

    // Versioning (10.4): a new revision inherits the original's entity and
    // increments the version number.
    let version = 1;
    if (versionOf) {
      const original = await queryOne<{ version: number; entity_type: string; entity_id: string }>(
        "SELECT version, entity_type, entity_id FROM attachments WHERE id = ? AND deleted_at IS NULL",
        [versionOf],
      );
      if (!original) throw new Error("Original file not found.");
      version = Number(original.version) + 1;
      await assertEntityVisible(original.entity_type, original.entity_id);
    }

    const sanitizedName = file.name.replace(/\s+/g, "_").replace(/[/\\]+/g, "");
    const storagePath = `${crypto.randomUUID()}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    await uploadToR2(bucket, storagePath, new Uint8Array(arrayBuffer), mimeType);

    const id = newId();
    await query(
      `INSERT INTO attachments (id, bucket, storage_path, filename, extension, mime_type, size_bytes, uploaded_by, entity_type, entity_id, category, version, version_of)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, bucket, storagePath, file.name, extension, mimeType, file.size, userId, entityType, entityId, category, version, versionOf],
    );

    return { id, filename: file.name, entity_type: entityType, entity_id: entityId, version };
  }

  static async list(filters: {
    entityType?: string;
    entityId?: string;
    search?: string;
    category?: string;
    showDeleted?: boolean;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { search, entityType, entityId, category, showDeleted = false, page = 1, pageSize = 20 } = filters;

    const conditions = [showDeleted ? "a.deleted_at IS NOT NULL" : "a.deleted_at IS NULL"];
    const args: InValue[] = [];

    if (search) {
      conditions.push("a.filename LIKE ?");
      args.push(`%${search}%`);
    }
    if (entityType) {
      conditions.push("a.entity_type = ?");
      args.push(entityType);
    }
    if (entityId) {
      conditions.push("a.entity_id = ?");
      args.push(entityId);
    }
    if (category) {
      conditions.push("a.category = ?");
      args.push(category);
    }

    const scope = await attachmentScope("a.entity_type", "a.entity_id");
    if (scope.sql) {
      conditions.push(scope.sql);
      args.push(...scope.args);
    }

    const whereSql = conditions.join(" AND ");

    const total = await countRows(
      `SELECT COUNT(*) AS total FROM attachments a WHERE ${whereSql}`,
      args,
    );

    const rows = await query<AttachmentDbRow>(
      `SELECT a.*, u.first_name AS uploader_first_name, u.last_name AS uploader_last_name
       FROM attachments a
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    return { data: rows.map(withUploader), total, page, pageSize };
  }

  static async getById(id: string) {
    const row = await queryOne<AttachmentDbRow>(
      `SELECT a.*, u.first_name AS uploader_first_name, u.last_name AS uploader_last_name
       FROM attachments a
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.id = ?
       LIMIT 1`,
      [id],
    );

    if (!row) return null;
    await assertEntityVisible(row.entity_type, row.entity_id);
    return withUploader(row);
  }

  static async getSignedUrl(bucket: string, storagePath: string) {
    if (!isBucket(bucket)) {
      throw new Error("Invalid storage bucket.");
    }
    return getSignedDownloadUrl(bucket, storagePath, 300);
  }

  // ============================================================
  // Categories / move (Historias 10.3 / 10.7)
  // ============================================================

  static async updateMetadata(
    id: string,
    input: { category?: string; entity_type?: string; entity_id?: string },
  ): Promise<AttachmentDbRow> {
    const file = await queryOne<{ entity_type: string; entity_id: string }>(
      "SELECT entity_type, entity_id FROM attachments WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (!file) throw new Error("File not found.");

    await assertEntityVisible(file.entity_type, file.entity_id);

    const category = input.category ?? "Otros";
    const entityType = input.entity_type ?? file.entity_type;
    const entityId = input.entity_id ?? file.entity_id;

    if (input.entity_type || input.entity_id) {
      await assertEntityVisible(entityType, entityId);
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE attachments SET category = ?, entity_type = ?, entity_id = ?, updated_at = ? WHERE id = ?`,
      [category, entityType, entityId, now, id],
    );

    const row = await queryOne<AttachmentDbRow>("SELECT * FROM attachments WHERE id = ?", [id]);
    return row!;
  }

  // ============================================================
  // Versioning (Historia 10.4)
  // ============================================================

  static async listVersions(fileId: string) {
    const file = await queryOne<{ version_of: string | null; entity_type: string; entity_id: string }>(
      "SELECT version_of, entity_type, entity_id FROM attachments WHERE id = ?",
      [fileId],
    );
    if (!file) throw new Error("File not found.");

    await assertEntityVisible(file.entity_type, file.entity_id);

    const rootId = file.version_of ?? fileId;
    const rows = await query<AttachmentDbRow>(
      `SELECT * FROM attachments
       WHERE (id = ? OR version_of = ?) AND deleted_at IS NULL
       ORDER BY version ASC`,
      [rootId, rootId],
    );

    return rows;
  }

  static async restoreVersion(fileId: string) {
    const file = await queryOne<{ version_of: string | null; entity_type: string; entity_id: string }>(
      "SELECT version_of, entity_type, entity_id FROM attachments WHERE id = ?",
      [fileId],
    );
    if (!file) throw new Error("File not found.");

    await assertEntityVisible(file.entity_type, file.entity_id);

    const rootId = file.version_of ?? fileId;
    const now = new Date().toISOString();
    await query(
      `UPDATE attachments SET is_active = 0, updated_at = ? WHERE id = ? OR version_of = ?`,
      [now, rootId, rootId],
    );
    await query(
      `UPDATE attachments SET is_active = 1, updated_at = ? WHERE id = ?`,
      [now, fileId],
    );
  }

  // ============================================================
  // Delete / restore (Historia 10.8)
  // ============================================================

  static async delete(id: string): Promise<{
    filename: string;
    entity_type: string;
    entity_id: string;
  } | null> {
    const file = await queryOne<{
      bucket: string;
      storage_path: string;
      filename: string;
      entity_type: string;
      entity_id: string;
    }>(
      `SELECT bucket, storage_path, filename, entity_type, entity_id FROM attachments WHERE id = ? LIMIT 1`,
      [id],
    );

    if (!file) return null;

    await assertEntityVisible(file.entity_type, file.entity_id);

    if (isBucket(file.bucket)) {
      try {
        await deleteFromR2(file.bucket, file.storage_path);
      } catch {
        // Best-effort cleanup: the row must still be soft-deleted even if the object is already gone.
      }
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE attachments SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id],
    );

    return { filename: file.filename, entity_type: file.entity_type, entity_id: file.entity_id };
  }

  static async restore(id: string): Promise<{ filename: string } | null> {
    const file = await queryOne<{ filename: string; entity_type: string; entity_id: string }>(
      "SELECT filename, entity_type, entity_id FROM attachments WHERE id = ? AND deleted_at IS NOT NULL",
      [id],
    );
    if (!file) return null;

    await assertEntityVisible(file.entity_type, file.entity_id);

    await query(
      `UPDATE attachments SET is_active = 1, deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );

    return { filename: file.filename };
  }

  // Historia 10.8 — eliminación permanente. Solo administradores (verificado
  // en la capa de acciones); borra el registro y sus comparticiones.
  static async deletePermanently(id: string): Promise<{ filename: string } | null> {
    const file = await queryOne<{ filename: string; entity_type: string; entity_id: string }>(
      "SELECT filename, entity_type, entity_id FROM attachments WHERE id = ? AND deleted_at IS NOT NULL",
      [id],
    );
    if (!file) return null;

    await assertEntityVisible(file.entity_type, file.entity_id);

    await query("DELETE FROM file_shares WHERE attachment_id = ?", [id]);
    await query("DELETE FROM attachments WHERE id = ?", [id]);

    return { filename: file.filename };
  }

  static async getStats() {
    const scope = await attachmentScope("a.entity_type", "a.entity_id");
    const scopeSql = scope.sql ? `AND ${scope.sql}` : "";

    const [totalRow, spaceRow] = await Promise.all([
      queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM attachments a WHERE a.deleted_at IS NULL ${scopeSql}`,
        scope.args,
      ),
      queryOne<{ bytes: number }>(
        `SELECT COALESCE(SUM(a.size_bytes), 0) AS bytes FROM attachments a WHERE a.deleted_at IS NULL ${scopeSql}`,
        scope.args,
      ),
    ]);

    const recent = await query<AttachmentDbRow>(
      `SELECT a.*, u.first_name AS uploader_first_name, u.last_name AS uploader_last_name
       FROM attachments a
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.deleted_at IS NULL ${scopeSql}
       ORDER BY a.created_at DESC
       LIMIT 5`,
      scope.args,
    );

    return {
      total: Number(totalRow?.total ?? 0),
      bytesUsed: Number(spaceRow?.bytes ?? 0),
      recent: recent.map(withUploader),
      // Últimas descargas registradas en el log de actividad (10.12): el nombre
      // del archivo se persiste en new_value.filename al registrar la descarga.
      recentDownloads: (
        await query<{ new_value: string | null; created_at: string }>(
          `SELECT new_value, created_at
           FROM activity_logs
           WHERE action = 'downloaded_file'
           ORDER BY created_at DESC
           LIMIT 25`,
        )
      )
        .map((row) => {
          let filename: string | null = null;
          if (row.new_value) {
            try {
              const parsed: unknown = JSON.parse(row.new_value);
              if (parsed && typeof parsed === "object") {
                filename = (parsed as { filename?: string }).filename ?? null;
              }
            } catch {
              filename = null;
            }
          }
          return filename ? { filename, date: row.created_at } : null;
        })
        .filter((row): row is { filename: string; date: string } => row !== null)
        .slice(0, 5),
    };
  }

  // ============================================================
  // Compartir (Historia 10.9)
  // ============================================================

  static async listShares(fileId: string): Promise<FileShareRow[]> {
    const file = await queryOne<{ entity_type: string; entity_id: string }>(
      "SELECT entity_type, entity_id FROM attachments WHERE id = ?",
      [fileId],
    );
    if (!file) throw new Error("File not found.");
    await assertEntityVisible(file.entity_type, file.entity_id);

    return query<FileShareRow>(
      "SELECT id, attachment_id, entity_type, entity_id, access_level, created_at FROM file_shares WHERE attachment_id = ?",
      [fileId],
    );
  }

  static async share(
    fileId: string,
    input: { entity_type: string; entity_id: string; access_level: FileAccessLevel },
  ): Promise<FileShareRow> {
    const file = await queryOne<{ entity_type: string; entity_id: string }>(
      "SELECT entity_type, entity_id FROM attachments WHERE id = ?",
      [fileId],
    );
    if (!file) throw new Error("File not found.");
    await assertEntityVisible(file.entity_type, file.entity_id);

    if (!FILE_ACCESS_LEVELS.includes(input.access_level)) {
      throw new Error("Invalid access level.");
    }

    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM file_shares WHERE attachment_id = ? AND entity_type = ? AND entity_id = ?",
      [fileId, input.entity_type, input.entity_id],
    );

    if (existing) {
      await query(
        "UPDATE file_shares SET access_level = ?, updated_at = ? WHERE id = ?",
        [input.access_level, new Date().toISOString(), existing.id],
      );
      return (await queryOne<FileShareRow>("SELECT * FROM file_shares WHERE id = ?", [existing.id]))!;
    }

    await query(
      `INSERT INTO file_shares (id, attachment_id, entity_type, entity_id, access_level)
       VALUES (?, ?, ?, ?, ?)`,
      [newId(), fileId, input.entity_type, input.entity_id, input.access_level],
    );

    const created = await queryOne<FileShareRow>(
      "SELECT * FROM file_shares WHERE attachment_id = ? AND entity_type = ? AND entity_id = ?",
      [fileId, input.entity_type, input.entity_id],
    );
    return created!;
  }

  static async unshare(fileId: string, shareId: string): Promise<void> {
    const file = await queryOne<{ entity_type: string; entity_id: string }>(
      "SELECT entity_type, entity_id FROM attachments WHERE id = ?",
      [fileId],
    );
    if (!file) throw new Error("File not found.");
    await assertEntityVisible(file.entity_type, file.entity_id);

    await query("DELETE FROM file_shares WHERE id = ? AND attachment_id = ?", [shareId, fileId]);
  }
}

// Helpers compartidos por la Server Action y el Route Handler de subida:
// convención única de entidad para el log de actividad y resolución del
// proyecto asociado para notificaciones (Historias 9.16 / 10.14).
export function toActivityEntity(entityType: string): string {
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

export async function resolveFileProjectId(entityType: string, entityId: string): Promise<string | null> {
  if (entityType === "project") return entityId;
  if (entityType === "task") {
    const row = await queryOne<{ project_id: string }>(
      "SELECT project_id FROM tasks WHERE id = ? LIMIT 1",
      [entityId],
    );
    return row?.project_id ?? null;
  }
  if (entityType === "milestone") {
    const row = await queryOne<{ project_id: string }>(
      "SELECT project_id FROM milestones WHERE id = ? LIMIT 1",
      [entityId],
    );
    return row?.project_id ?? null;
  }
  if (entityType === "comment") {
    const row = await queryOne<{ project_id: string }>(
      `SELECT c.project_id FROM project_comments c WHERE c.id = ?
       UNION ALL SELECT t.project_id FROM task_comments tc JOIN tasks t ON t.id = tc.task_id WHERE tc.id = ?
       UNION ALL SELECT m.project_id FROM milestone_comments mc JOIN milestones m ON m.id = mc.milestone_id WHERE mc.id = ?
       LIMIT 1`,
      [entityId, entityId, entityId],
    );
    return row?.project_id ?? null;
  }
  return null;
}