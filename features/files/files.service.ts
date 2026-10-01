import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";
import { assertEntityVisible, attachmentScope } from "@/lib/auth-scope";
import { deleteFromR2, getSignedDownloadUrl, isBucket } from "@/lib/storage/r2";

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
  static async list(filters: {
    entityType?: string;
    entityId?: string;
    search?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { search, entityType, entityId, category, page = 1, pageSize = 20 } = filters;

    const conditions = ["a.deleted_at IS NULL"];
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

  // ============================================================
  // Indicadores (Historia 10.12)
  // ============================================================

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