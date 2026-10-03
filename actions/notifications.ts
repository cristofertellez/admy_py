"use server";

import { NotificationsService, type NotificationType } from "@/features/notifications";
import { getUser } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";
import {
  notificationPreferencesSchema,
  pushSubscriptionSchema,
} from "@/schemas/notifications";

type ActionState = { success?: string; error?: string };

function revalidateNotificationSurfaces() {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard", "layout");
}

export async function markAsRead(notificationId: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.markAsRead(notificationId, user.id);
    await ActivityService.logAccessOnce({
      user_id: user.id,
      action: "marked_notification_read",
      entity: "Notification",
      entity_id: notificationId,
    });
    revalidateNotificationSurfaces();
    return { success: "Notification marked as read." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to mark as read." };
  }
}

export async function markAsUnread(notificationId: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.markAsUnread(notificationId, user.id);
    revalidateNotificationSurfaces();
    return { success: "Notification marked as unread." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to mark as unread." };
  }
}

export async function markAllAsRead() {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.markAllAsRead(user.id);
    await ActivityService.log({
      user_id: user.id,
      action: "marked_all_notifications_read",
      entity: "Notification",
    });
    revalidateNotificationSurfaces();
    return { success: "All notifications marked as read." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to mark all as read." };
  }
}

export async function dismissNotification(notificationId: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.dismiss(notificationId, user.id);
    await ActivityService.log({
      user_id: user.id,
      action: "dismissed_notification",
      entity: "Notification",
      entity_id: notificationId,
    });
    revalidateNotificationSurfaces();
    return { success: "Notification dismissed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to dismiss notification." };
  }
}

export async function updateNotificationPreferences(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthenticated." };

  const eventTypes = formData.getAll("event_types").map(String);
  const parsed = notificationPreferencesSchema.safeParse({
    in_app_enabled: formData.get("in_app_enabled")?.toString(),
    email_enabled: formData.get("email_enabled")?.toString(),
    push_enabled: formData.get("push_enabled")?.toString(),
    email_frequency: formData.get("email_frequency") || "instant",
    quiet_hours_start: formData.get("quiet_hours_start") || "",
    quiet_hours_end: formData.get("quiet_hours_end") || "",
    event_types: eventTypes.length > 0 ? eventTypes : null,
  });

  if (!parsed.success) {
    return { error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    await NotificationsService.updatePreferences(user.id, {
      in_app_enabled: parsed.data.in_app_enabled,
      email_enabled: parsed.data.email_enabled,
      push_enabled: parsed.data.push_enabled,
      email_frequency: parsed.data.email_frequency,
      quiet_hours_start: parsed.data.quiet_hours_start,
      quiet_hours_end: parsed.data.quiet_hours_end,
      event_types: parsed.data.event_types as NotificationType[] | null,
    });

    await ActivityService.log({
      user_id: user.id,
      action: "updated_notification_preferences",
      entity: "Notification",
      new_value: {
        in_app_enabled: parsed.data.in_app_enabled,
        email_enabled: parsed.data.email_enabled,
        push_enabled: parsed.data.push_enabled,
        email_frequency: parsed.data.email_frequency,
      },
    });

    revalidateNotificationSurfaces();
    return { success: "Notification preferences saved." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save preferences." };
  }
}

export async function registerPushSubscription(subscription: unknown) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };

    const parsed = pushSubscriptionSchema.safeParse(subscription);
    if (!parsed.success) return { error: "Invalid subscription payload." };

    await NotificationsService.registerPushSubscription(user.id, {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys?.p256dh ?? null,
      auth: parsed.data.keys?.auth ?? null,
      userAgent: null,
    });

    await ActivityService.log({
      user_id: user.id,
      action: "registered_push_subscription",
      entity: "Notification",
      new_value: { endpoint: parsed.data.endpoint },
    });

    revalidatePath("/dashboard/notifications");
    return { success: "Device registered for push notifications." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to register device." };
  }
}

export async function removePushSubscription(endpoint: string) {
  try {
    const user = await getUser();
    if (!user) return { error: "Unauthenticated." };
    await NotificationsService.removePushSubscription(user.id, endpoint);
    revalidatePath("/dashboard/notifications");
    return { success: "Device removed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove device." };
  }
}
