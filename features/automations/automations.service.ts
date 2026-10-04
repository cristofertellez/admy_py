import { newId, query } from "@/lib/turso/client";
import { NotificationsService } from "@/features/notifications";
import { WebhooksService } from "@/features/webhooks/webhooks.service";
import { ActivityService } from "@/services/activity.service";
import type { SystemEvent } from "@/lib/events/bus";

// Épica 17 (17.6) — automation rules. A rule maps one internal event type
// to an action; the engine executes every active rule matching the event.

export type AutomationAction = "notify_project_audience" | "webhook_forward";

export interface AutomationRuleRow {
  id: string;
  name: string;
  event: string;
  action: AutomationAction;
  config: string;
  active: number;
  created_by: string | null;
  created_at: string;
}

export const AUTOMATION_EVENTS = [
  "project.created",
  "project.status_changed",
  "project.completed",
  "task.created",
  "task.status_changed",
  "task.assigned",
  "comment.created",
  "file.uploaded",
  "milestone.completed",
] as const;

export const AUTOMATION_ACTIONS: { value: AutomationAction; label: string }[] = [
  { value: "notify_project_audience", label: "Send in-app notification to the project audience" },
  { value: "webhook_forward", label: "Forward to active webhooks" },
];

export class AutomationsService {
  static async create(input: {
    name: string;
    event: string;
    action: AutomationAction;
    createdBy: string;
    config?: Record<string, unknown>;
  }): Promise<string> {
    const id = newId();
    await query(
      `INSERT INTO automation_rules (id, name, event, action, config, active, created_by)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [id, input.name, input.event, input.action, JSON.stringify(input.config ?? {}), input.createdBy],
    );
    return id;
  }

  static async list(): Promise<AutomationRuleRow[]> {
    return query<AutomationRuleRow>(
      `SELECT id, name, event, action, config, active, created_by, created_at
       FROM automation_rules ORDER BY created_at DESC`,
    );
  }

  static async remove(id: string): Promise<void> {
    await query(`DELETE FROM automation_rules WHERE id = ?`, [id]);
  }

  static async setActive(id: string, active: boolean): Promise<void> {
    await query(`UPDATE automation_rules SET active = ?, updated_at = ? WHERE id = ?`, [
      active ? 1 : 0,
      new Date().toISOString(),
      id,
    ]);
  }

  /** Executes the active rules matching the published event type. */
  static async executeForEvent(event: SystemEvent): Promise<void> {
    const rules = await query<AutomationRuleRow>(
      `SELECT id, name, event, action, config, active, created_by, created_at
       FROM automation_rules WHERE active = 1 AND event = ?`,
      [event.type],
    );

    for (const rule of rules) {
      try {
        if (rule.action === "webhook_forward") {
          await WebhooksService.dispatchEvent(event);
          await ActivityService.log({
            user_id: rule.created_by ?? "",
            action: "automation_executed",
            entity: "Automation",
            entity_id: rule.id,
            new_value: { rule: rule.name, event: event.type, action: rule.action },
          });
          continue;
        }

        if (rule.action === "notify_project_audience") {
          const projectId =
            typeof event.payload?.projectId === "string" ? event.payload.projectId : null;
          if (!projectId) continue;

          const recipients = await NotificationsService.getProjectRecipients(projectId);
          await Promise.all(
            recipients.map((receiverId) =>
              NotificationsService.create({
                receiver_id: receiverId,
                title: `Automation: ${rule.name}`,
                message: `Triggered by ${event.type}.`,
                type: "reminder",
                entity_type: "Project",
                entity_id: projectId,
                dedupe_key: `automation:${rule.id}:${event.type}:${receiverId}:${
                  event.payload?.dedupeKey ?? new Date().toISOString().slice(0, 10)
                }`,
              }),
            ),
          );
          await ActivityService.log({
            user_id: rule.created_by ?? "",
            action: "automation_executed",
            entity: "Automation",
            entity_id: rule.id,
            new_value: {
              rule: rule.name,
              event: event.type,
              action: rule.action,
              notified: recipients.length,
            },
          });
        }
      } catch (err) {
        console.error("[automations] rule failed:", rule.name, err instanceof Error ? err.message : err);
      }
    }
  }
}
