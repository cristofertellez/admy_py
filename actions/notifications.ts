"use server";

import { NotificationsService } from "@/features/notifications";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAsRead(notificationId: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.markAsRead(notificationId);
    revalidatePath("/dashboard/notifications");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to mark as read." };
  }
}

export async function markAllAsRead() {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.markAllAsRead(user.id);
    revalidatePath("/dashboard/notifications");
    return { success: "All notifications marked as read." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to mark all as read." };
  }
}
