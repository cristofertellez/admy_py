import { z } from "zod";
import { NOTIFICATION_TYPES } from "@/features/notifications/notifications.service";
import { timeString } from "./shared";

const notificationTypeSchema = z.enum(
  NOTIFICATION_TYPES as [string, ...string[]],
);

export const notificationPreferencesSchema = z.object({
  in_app_enabled: z
    .string()
    .optional()
    .transform((value) => value === "on"),
  email_enabled: z
    .string()
    .optional()
    .transform((value) => value === "on"),
  push_enabled: z
    .string()
    .optional()
    .transform((value) => value === "on"),
  email_frequency: z.enum(["instant", "daily", "weekly"]).default("instant"),
  quiet_hours_start: timeString
    .or(z.literal(""))
    .nullable()
    .transform((value) => (value ? value : null)),
  quiet_hours_end: timeString
    .or(z.literal(""))
    .nullable()
    .transform((value) => (value ? value : null)),
  event_types: z
    .array(notificationTypeSchema)
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z
    .object({
      p256dh: z.string().optional().nullable(),
      auth: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
