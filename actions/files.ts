"use server";

import { getUser, requirePermission } from "@/lib/auth";
import { FilesService, FILE_CATEGORIES, resolveFileProjectId, toActivityEntity } from "@/features/files";
import { notifyFileUploaded } from "@/features/notifications";
import { ActivityService } from "@/services/activity.service";
import { hasFullAccess } from "@/lib/roles";
import { revalidatePath } from "next/cache";

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

    const created = await FilesService.uploadAttachment({
      file,
      userId: user.id,
      entityType,
      entityId,
      category,
      versionOf,
    });

    await ActivityService.log({
      user_id: user.id,
      action: versionOf ? "uploaded_file_version" : "uploaded_file",
      entity: toActivityEntity(entityType),
      entity_id: entityId,
      new_value: { filename: created.filename, size_bytes: file.size, mime_type: file.type, version: created.version },
    });

    const projectId = await resolveFileProjectId(entityType, entityId);
    if (projectId) {
      await notifyFileUploaded({ projectId, actorId: user.id, filename: created.filename });
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

// Historia 10.8 — eliminación permanente (solo Developer/Admin/Super Admin).
export async function deleteFilePermanently(fileId: string) {
  const user = await requirePermission("files.delete");
  try {
    if (!hasFullAccess(user.role)) {
      return { error: "Only administrators can permanently delete files." };
    }

    const deleted = await FilesService.deletePermanently(fileId);
    if (!deleted) return { error: "File not found or not in trash." };

    await ActivityService.log({
      user_id: user.id,
      action: "permanently_deleted_file",
      entity: "File",
      entity_id: fileId,
      old_value: { filename: deleted.filename },
    });

    revalidatePath("/dashboard/files", "layout");
    return { success: "File permanently deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to permanently delete file." };
  }
}
