"use server";

import { getUser } from "@/lib/auth";
import { isBucket, uploadToR2 } from "@/lib/storage/r2";
import { newId, query } from "@/lib/turso/client";
import { FilesService } from "@/features/files";
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

export async function uploadFile(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const file = formData.get("file") as File | null;
    const entityType = formData.get("entity_type") as string;
    const entityId = formData.get("entity_id") as string;

    if (!file || !entityType || !entityId) {
      return { error: "File, entity type, and entity ID are required." };
    }

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

    revalidatePath(`/dashboard/${entityType}s`, "layout");
    return { success: "File uploaded." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload file." };
  }
}

export async function getFileUrl(fileId: string) {
  try {
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
  try {
    await FilesService.delete(fileId);
    revalidatePath("/dashboard/files");
    return { success: "File deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete file." };
  }
}
