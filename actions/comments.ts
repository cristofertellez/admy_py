"use server";

import { CommentsService } from "@/features/comments";
import { getUser } from "@/lib/auth";
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
