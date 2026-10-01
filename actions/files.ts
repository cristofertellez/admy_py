"use server";

import { getUser, requirePermission } from "@/lib/auth";
import { isBucket, uploadToR2 } from "@/lib/storage/r2";
import { newId, query, queryOne } from "@/lib/turso/client";
import { assertEntityVisible, isScopedEntityType } from "@/lib/auth-scope";
import { FilesService, FILE_CATEGORIES } from "@/features/files";
import { notifyFileUploaded } from "@/features/notifications";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "application/zip": "zip",
};

// Activity events use capitalized entity labels ("Client", "Project", ...) so
// that every module's history queries resolve them consistently.
function toActivityEntity(entityType: string): string {
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

async function resolveProjectId(entityType: string, entityId: string): Promise<string | null> {
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

export async function uploadFile(_prevState: unknown, formData: FormData) {
  const user = await requirePermission("files.upload");

  try {
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entity_type") as string;
    const entityId = formData.get("entity_id") as string;
    const category = (formData.get("category") as string) || "Otros";
    const versionOf = (formData.get("version_of") as string) || null;

    if (!file || !entityType || !entityId) {
      return { error: "File, entity type, and entity ID are required." };
    }

    if (!isScopedEntityType(entityType)) {
      return { error: "Invalid entity type." };
    }

    await assertEntityVisible(entityType, entityId, user);

    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size must be under 10MB." };
    }

    const mimeType = file.type;
    const extension = ALLOWED_TYPES[mimeType];
    if (!extension) {
      return { error: "File type not allowed." };
    }

    const bucket = "attachments";
    if (!isBucket(bucket)) {
      return { error: "Invalid storage bucket." };
    }

    // Versioning (10.4): a new revision inherits the original's entity and
    // increments the version number.
    let version = 1;
    if (versionOf) {
      const original = await queryOne<{ version: number; entity_type: string; entity_id: string }>(
        "SELECT version, entity_type, entity_id FROM attachments WHERE id = ? AND deleted_at IS NULL",
        [versionOf],
      );
      if (!original) return { error: "Original file not found." };
      version = Number(original.version) + 1;
      await assertEntityVisible(original.entity_type, original.entity_id, user);
    }

    const sanitizedName = file.name.replace(/\s+/g, "_").replace(/[/\\]+/g, "");
    const storagePath = `${crypto.randomUUID()}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    await uploadToR2(bucket, storagePath, new Uint8Array(arrayBuffer), mimeType);

    await query(
      `INSERT INTO attachments (id, bucket, storage_path, filename, extension, mime_type, size_bytes, uploaded_by, entity_type, entity_id, category, version, version_of)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        bucket,
        storagePath,
        file.name,
        extension,
        mimeType,
        file.size,
        user.id,
        entityType,
        entityId,
        category,
        version,
        versionOf,
      ],
    );

    await ActivityService.log({
      user_id: user.id,
      action: versionOf ? "uploaded_file_version" : "uploaded_file",
      entity: toActivityEntity(entityType),
      entity_id: entityId,
      new_value: { filename: file.name, size_bytes: file.size, mime_type: mimeType, version },
    });

    const projectId = await resolveProjectId(entityType, entityId);
    if (projectId) {
      await notifyFileUploaded({ projectId, actorId: user.id, filename: file.name });
    }

    revalidatePath(`/dashboard/${entityType}s`, "layout");
    if (entityType === "client") {
      revalidatePath(`/dashboard/clients/${entityId}`);
    }
    if (entityType === "project") {
      revalidatePath(`/dashboard/projects/${entityId}`);
    }
    return { success: versionOf ? "Version uploaded." : "File uploaded." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload file." };
  }
}

export async function getFileUrl(fileId: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const file = await FilesService.getById(fileId);
    if (!file || !file.bucket || !file.storage_path) {
      return { error: "File not found." };
    }

    const url = await FilesService.getSignedUrl(file.bucket, file.storage_path);

    await ActivityService.log({
      user_id: user.id,
      action: "downloaded_file",
      entity: toActivityEntity(file.entity_type),
      entity_id: file.entity_id,
      new_value: { filename: file.filename },
    });

    return { success: url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to get file URL." };
  }
}

export async function deleteFile(fileId: string) {
  const user = await requirePermission("files.delete");

  try {
    const deleted = await FilesService.delete(fileId);

    if (deleted) {
      await ActivityService.log({
        user_id: user.id,
        action: "deleted_file",
        entity: toActivityEntity(deleted.entity_type),
        entity_id: deleted.entity_id,
        old_value: { filename: deleted.filename },
      });

      revalidatePath(`/dashboard/${deleted.entity_type}s`, "layout");
      if (deleted.entity_type === "client") {
        revalidatePath(`/dashboard/clients/${deleted.entity_id}`);
      }
      if (deleted.entity_type === "project") {
        revalidatePath(`/dashboard/projects/${deleted.entity_id}`);
      }
    }

    return { success: "File deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete file." };
  }
}

// ============================================================
// Épica 10 — categorías, mover, versionado, restaurar, compartir
// ============================================================

export async function updateFileCategory(fileId: string, category: string) {
  const user = await requirePermission("files.upload");
  try {
    if (!FILE_CATEGORIES.includes(category as never)) {
      return { error: "Invalid category." };
    }
    const updated = await FilesService.updateMetadata(fileId, { category });

    await ActivityService.log({
      user_id: user.id,
      action: "changed_file_category",
      entity: toActivityEntity(String(updated.entity_type)),
      entity_id: String(updated.entity_id),
      new_value: { category },
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "Category updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update category." };
  }
}

export async function moveFile(fileId: string, entityType: string, entityId: string) {
  const user = await requirePermission("files.upload");
  try {
    const updated = await FilesService.updateMetadata(fileId, { entity_type: entityType, entity_id: entityId });

    await ActivityService.log({
      user_id: user.id,
      action: "moved_file",
      entity: toActivityEntity(String(updated.entity_type)),
      entity_id: String(updated.entity_id),
      new_value: { filename: updated.filename },
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "File moved." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to move file." };
  }
}

export async function restoreFile(fileId: string) {
  const user = await requirePermission("files.delete");
  try {
    const restored = await FilesService.restore(fileId);
    if (!restored) return { error: "File not found." };

    await ActivityService.log({
      user_id: user.id,
      action: "restored_file",
      entity: "File",
      entity_id: fileId,
      new_value: { filename: restored.filename },
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "File restored." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to restore file." };
  }
}

export async function restoreFileVersion(fileId: string) {
  const user = await requirePermission("files.upload");
  try {
    await FilesService.restoreVersion(fileId);

    await ActivityService.log({
      user_id: user.id,
      action: "restored_file_version",
      entity: "File",
      entity_id: fileId,
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "Version restored." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to restore version." };
  }
}

export async function shareFile(fileId: string, entityType: string, entityId: string, accessLevel: string) {
  const user = await requirePermission("files.upload");
  try {
    await FilesService.share(fileId, {
      entity_type: entityType,
      entity_id: entityId,
      access_level: accessLevel as never,
    });

    await ActivityService.log({
      user_id: user.id,
      action: "shared_file",
      entity: "File",
      entity_id: fileId,
      new_value: { entity_type: entityType, entity_id: entityId, access_level: accessLevel },
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "File shared." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to share file." };
  }
}

export async function unshareFile(fileId: string, shareId: string) {
  const user = await requirePermission("files.upload");
  try {
    await FilesService.unshare(fileId, shareId);

    await ActivityService.log({
      user_id: user.id,
      action: "unshared_file",
      entity: "File",
      entity_id: fileId,
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "Share removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove share." };
  }
}
