"use server";

import { CommentsService } from "@/features/comments";
import { notifyCommentCreated } from "@/features/notifications";
import { getUser } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";

export async function createProjectCommentAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const projectId = formData.get("project_id") as string;
    const message = (formData.get("message") as string)?.trim();
    const parentCommentId = (formData.get("parent_comment_id") as string) || undefined;

    if (!projectId || !message) {
      return { error: "Comment message cannot be empty." };
    }

    const created = await CommentsService.createProjectComment({
      project_id: projectId,
      user_id: user.id,
      message,
      parent_comment_id: parentCommentId,
    });

    await ActivityService.log({
      user_id: user.id,
      action: parentCommentId ? "replied_comment" : "created_comment",
      entity: "Comment",
      entity_id: created.id,
      new_value: {
        project_id: projectId,
        comment_preview: message.slice(0, 140),
        parent_comment_id: parentCommentId ?? null,
      },
    });

    await notifyCommentCreated({
      entityType: "project",
      entityId: projectId,
      commentId: created.id,
      commentPreview: message,
      authorId: user.id,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: "Comment posted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post comment." };
  }
}

export async function updateProjectCommentAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const commentId = formData.get("comment_id") as string;
    const projectId = formData.get("project_id") as string;
    const message = (formData.get("message") as string)?.trim();

    if (!commentId || !message) {
      return { error: "Comment message cannot be empty." };
    }

    await CommentsService.updateProjectComment(commentId, message);

    await ActivityService.log({
      user_id: user.id,
      action: "updated_comment",
      entity: "Comment",
      entity_id: commentId,
      new_value: { project_id: projectId, comment_preview: message.slice(0, 140) },
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: "Comment updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update comment." };
  }
}

export async function createTaskCommentAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const taskId = formData.get("task_id") as string;
    const message = formData.get("message") as string;

    if (!taskId || !message?.trim()) {
      return { error: "Comment message cannot be empty." };
    }

    const created = await CommentsService.createTaskComment({
      task_id: taskId,
      user_id: user.id,
      message: message.trim(),
    });

    await notifyCommentCreated({
      entityType: "task",
      entityId: taskId,
      commentId: created.id,
      commentPreview: message.trim(),
      authorId: user.id,
    });

    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Comment posted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post comment." };
  }
}

export async function deleteProjectCommentAction(commentId: string, projectId: string) {
  try {
    const actor = await getUser();
    await CommentsService.deleteProjectComment(commentId);

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "deleted_comment",
        entity: "Comment",
        entity_id: commentId,
        old_value: { project_id: projectId },
      });
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: "Comment deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete comment." };
  }
}

// ============================================================
// Client comments (Historia 4.9)
// ============================================================

function revalidateClient(clientId: string) {
  revalidatePath(`/dashboard/clients/${clientId}`, "layout");
  revalidatePath("/dashboard");
}

export async function createClientCommentAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const clientId = formData.get("client_id") as string;
    const message = (formData.get("message") as string)?.trim();
    const parentCommentId = (formData.get("parent_comment_id") as string) || undefined;

    if (!clientId || !message) {
      return { error: "Comment message cannot be empty." };
    }

    await CommentsService.createClientComment({
      client_id: clientId,
      user_id: user.id,
      message,
      parent_comment_id: parentCommentId,
    });

    await ActivityService.log({
      user_id: user.id,
      action: parentCommentId ? "replied_client_comment" : "created_client_comment",
      entity: "Client",
      entity_id: clientId,
      new_value: { comment_preview: message.slice(0, 140), parent_comment_id: parentCommentId ?? null },
    });

    revalidateClient(clientId);
    return { success: "Comment posted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post comment." };
  }
}

export async function updateClientCommentAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const commentId = formData.get("comment_id") as string;
    const clientId = formData.get("client_id") as string;
    const message = (formData.get("message") as string)?.trim();

    if (!commentId || !message) {
      return { error: "Comment message cannot be empty." };
    }

    await CommentsService.updateClientComment(commentId, message);

    await ActivityService.log({
      user_id: user.id,
      action: "updated_client_comment",
      entity: "Client",
      entity_id: clientId,
      new_value: { comment_preview: message.slice(0, 140) },
    });

    revalidateClient(clientId);
    return { success: "Comment updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update comment." };
  }
}

export async function deleteClientCommentAction(commentId: string, clientId: string) {
  try {
    const actor = await getUser();
    await CommentsService.deleteClientComment(commentId);

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "deleted_client_comment",
        entity: "Client",
        entity_id: clientId,
        old_value: { comment_id: commentId },
      });
    }

    revalidateClient(clientId);
    return { success: "Comment deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete comment." };
  }
}
