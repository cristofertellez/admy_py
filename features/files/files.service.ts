import { countRows, query, queryOne, type InValue } from "@/lib/turso/client";
import { deleteFromR2, getSignedDownloadUrl, isBucket } from "@/lib/storage/r2";

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

export class FilesService {
  static async list(filters: {
    entityType?: string;
    entityId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { search, entityType, entityId, page = 1, pageSize = 20 } = filters;

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

    return row ? withUploader(row) : null;
  }

  static async getSignedUrl(bucket: string, storagePath: string) {
    if (!isBucket(bucket)) {
      throw new Error("Invalid storage bucket.");
    }
    return getSignedDownloadUrl(bucket, storagePath, 300);
  }

  static async delete(id: string) {
    const file = await queryOne<{ bucket: string; storage_path: string }>(
      `SELECT bucket, storage_path FROM attachments WHERE id = ? LIMIT 1`,
      [id],
    );

    if (file && isBucket(file.bucket)) {
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
  }
}
