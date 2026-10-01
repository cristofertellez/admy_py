"use server";

import { getUser } from "@/lib/auth";
import { ReactionsService } from "@/features/reactions";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";

async function revalidateCommentScope(entityType: string) {
  if (entityType === "project") {
    revalidatePath("/dashboard/projects/[id]", "layout");
  } else if (entityType === "client") {
    revalidatePath("/dashboard/clients/[id]", "layout");
  } else if (entityType === "milestone") {
    revalidatePath("/dashboard/projects/[id]/milestones", "layout");
    revalidatePath("/dashboard/projects/[id]", "layout");
  } else {
    revalidatePath("/dashboard/tasks/[id]", "layout");
    revalidatePath("/dashboard", "layout");
  }
}

export async function toggleCommentReactionAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const entityType = formData.get("entity_type") as string;
    const commentId = formData.get("comment_id") as string;
    const reaction = formData.get("reaction") as string;

    if (!entityType || !commentId || !reaction) {
      return { error: "Missing reaction data." };
    }

    const result = await ReactionsService.toggle(entityType, commentId, reaction);

    await ActivityService.log({
      user_id: user.id,
      action: result.added ? "reacted_comment" : "removed_reaction",
      entity: "Comment",
      entity_id: commentId,
      new_value: { reaction },
    });

    await revalidateCommentScope(entityType);
    return { success: result.added ? "Reaction added." : "Reaction removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to react." };
  }
}