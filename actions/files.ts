"use server";

import { getUser, requirePermission } from "@/lib/auth";
import { isBucket, uploadToR2 } from "@/lib/storage/r2";
import { newId, query } from "@/lib/turso/client";
import { assertEntityVisible, isScopedEntityType } from "@/lib/auth-scope";
import { FilesService } from "@/features/files";
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

export async function uploadFile(_prevState: unknown, formData: FormData) {
  const user = await requirePermission("files.upload");

  try {
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entity_type") as string;
    const entityId = formData.get("entity_id") as string;

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

    const sanitizedName = file.name.replace(/\s+/g, "_").replace(/[/\\]+/g, "");
    const storagePath = `${crypto.randomUUID()}-${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    await uploadToR2(bucket, storagePath, new Uint8Array(arrayBuffer), mimeType);

    await query(
      `INSERT INTO attachments (id, bucket, storage_path, filename, extension, mime_type, size_bytes, uploaded_by, entity_type, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    );

    await ActivityService.log({
      user_id: user.id,
      action: "uploaded_file",
      entity: toActivityEntity(entityType),
      entity_id: entityId,
      new_value: { filename: file.name, size_bytes: file.size, mime_type: mimeType },
    });

    revalidatePath(`/dashboard/${entityType}s`, "layout");
    if (entityType === "client") {
      revalidatePath(`/dashboard/clients/${entityId}`);
    }
    return { success: "File uploaded." };
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
    }

    return { success: "File deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete file." };
  }
}
