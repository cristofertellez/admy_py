import { NextResponse } from "next/server";
import { getUser, hasPermission } from "@/lib/auth";
import { FilesService, resolveFileProjectId, toActivityEntity } from "@/features/files";
import { notifyFileUploaded } from "@/features/notifications";
import { ActivityService } from "@/services/activity.service";

export const dynamic = "force-dynamic";

// Historia 10.2 — subida con barra de progreso y cancelación. El dropzone del
// cliente usa XMLHttpRequest contra este endpoint; la lógica de validación y
// persistencia vive centralizada en FilesService.uploadAttachment (la misma
// que usa la Server Action uploadFile).
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!hasPermission(user, "files.upload")) {
      return NextResponse.json({ error: "Missing upload permission." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entity_type") as string;
    const entityId = formData.get("entity_id") as string;
    const category = (formData.get("category") as string) || "Otros";
    const versionOf = (formData.get("version_of") as string) || null;

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: "File, entity type, and entity ID are required." }, { status: 400 });
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

    return NextResponse.json({ success: true, id: created.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload file.";
    const status =
      message.includes("access") || message.includes("Unauthorized") || message.includes("permission")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
