"use server";

import { CommentsService } from "@/features/comments";
import { getUser } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";

export async function createProjectCommentAction(_prevState: unknown, formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const projectId = formData.get("project_id") as string;
    const message = formData.get("message") as string;

    if (!projectId || !message?.trim()) {
      return { error: "Comment message cannot be empty." };
    }

    await CommentsService.createProjectComment({
      project_id: projectId,
      user_id: user.id,
      message: message.trim(),
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: "Comment posted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post comment." };
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

    await CommentsService.createTaskComment({
      task_id: taskId,
      user_id: user.id,
      message: message.trim(),
    });

    revalidatePath("/dashboard/tasks/[id]", "layout");
    return { success: "Comment posted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to post comment." };
  }
}

export async function deleteProjectCommentAction(commentId: string, projectId: string) {
  try {
    await CommentsService.deleteProjectComment(commentId);
    revalidatePath(`/dashboard/projects/${projectId}`);
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
