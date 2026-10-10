import { newId, query } from "@/lib/turso/client";
import { NotificationsService, type NotificationType } from "@/features/notifications";
import { WebhooksService } from "@/features/webhooks/webhooks.service";
import { ActivityService } from "@/services/activity.service";
import type { SystemEvent } from "@/lib/events/bus";
import {
  type AutomationAction,
  type AutomationRuleConfig,
  type AutomationRuleRow,
  type AutomationRuleView,
  type AutomationTestResult,
  AUTOMATION_EVENT_DEFINITIONS,
} from "./types";

export { AUTOMATION_EVENTS_LIST as AUTOMATION_EVENTS } from "@/schemas/integrations";
export { AUTOMATION_ACTION_DEFINITIONS as AUTOMATION_ACTIONS } from "./types";
export type {
  AutomationAction,
  AutomationRuleRow,
  AutomationRuleView,
  AutomationRuleConfig,
  AutomationTestResult,
};

function parseRuleConfig(raw: string | null | undefined): AutomationRuleConfig {
  if (!raw) return { conditions: {}, actionConfig: {} };
  try {
    const parsed = JSON.parse(raw) as AutomationRuleConfig;
    return {
      conditions: parsed.conditions ?? {},
      actionConfig: parsed.actionConfig ?? {},
    };
  } catch {
    return { conditions: {}, actionConfig: {} };
  }
}

function interpolateTemplate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const val = payload[key];
    if (val !== undefined && val !== null) {
      return String(val);
    }
    return match;
  });
}

function evaluateConditions(
  conditions: AutomationRuleConfig["conditions"],
  payload?: Record<string, unknown>,
): { passed: boolean; reason: string } {
  if (!conditions || Object.keys(conditions).length === 0) {
    return { passed: true, reason: "Sin condiciones adicionales (se ejecuta siempre)." };
  }

  const p = payload ?? {};

  if (conditions.status && conditions.status.trim() !== "") {
    const actualStatus = String(p.status ?? p.newStatus ?? p.new_status ?? "");
    if (actualStatus.toLowerCase() !== conditions.status.toLowerCase()) {
      return {
        passed: false,
        reason: `Filtro de estado no coincide: se esperaba "${conditions.status}", actual es "${actualStatus}".`,
      };
    }
  }

  if (conditions.priority && conditions.priority.trim() !== "") {
    const actualPriority = String(p.priority ?? "");
    if (actualPriority.toLowerCase() !== conditions.priority.toLowerCase()) {
      return {
        passed: false,
        reason: `Filtro de prioridad no coincide: se esperaba "${conditions.priority}", actual es "${actualPriority}".`,
      };
    }
  }

  if (conditions.filterField && conditions.filterField.trim() !== "" && conditions.filterValue !== undefined) {
    const fieldVal = String(p[conditions.filterField] ?? "");
    if (fieldVal.toLowerCase() !== String(conditions.filterValue).toLowerCase()) {
      return {
        passed: false,
        reason: `Filtro de campo "${conditions.filterField}" no coincide: se esperaba "${conditions.filterValue}", actual es "${fieldVal}".`,
      };
    }
  }

  return { passed: true, reason: "Todas las condiciones se cumplieron satisfactoriamente." };
}

export class AutomationsService {
  static async create(input: {
    name: string;
    event: string;
    action: AutomationAction;
    createdBy: string;
    config?: AutomationRuleConfig;
  }): Promise<string> {
    const id = newId();
    const configJson = JSON.stringify(input.config ?? { conditions: {}, actionConfig: {} });
    await query(
      `INSERT INTO automation_rules (id, name, event, action, config, active, created_by)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [id, input.name, input.event, input.action, configJson, input.createdBy],
    );
    return id;
  }

  static async update(
    id: string,
    input: {
      name: string;
      event: string;
      action: AutomationAction;
      config?: AutomationRuleConfig;
      active?: boolean;
    },
  ): Promise<void> {
    const configJson = JSON.stringify(input.config ?? { conditions: {}, actionConfig: {} });
    const params: (string | number)[] = [
      input.name,
      input.event,
      input.action,
      configJson,
      new Date().toISOString(),
    ];

    let sql = `UPDATE automation_rules SET name = ?, event = ?, action = ?, config = ?, updated_at = ?`;
    if (input.active !== undefined) {
      sql += `, active = ?`;
      params.push(input.active ? 1 : 0);
    }
    sql += ` WHERE id = ?`;
    params.push(id);

    await query(sql, params);
  }

  static async getById(id: string): Promise<AutomationRuleView | null> {
    const rows = await query<AutomationRuleRow>(
      `SELECT id, name, event, action, config, active, created_by, created_at, updated_at
       FROM automation_rules WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      event: row.event,
      action: row.action,
      config: parseRuleConfig(row.config),
      active: row.active === 1,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async list(): Promise<AutomationRuleView[]> {
    const rows = await query<AutomationRuleRow>(
      `SELECT id, name, event, action, config, active, created_by, created_at, updated_at
       FROM automation_rules ORDER BY created_at DESC`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      event: row.event,
      action: row.action,
      config: parseRuleConfig(row.config),
      active: row.active === 1,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
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

  /**
   * Executes the active rules matching the published event type.
   * Evaluates conditions and dynamic action parameters.
   */
  static async executeForEvent(event: SystemEvent): Promise<void> {
    const rows = await query<AutomationRuleRow>(
      `SELECT id, name, event, action, config, active, created_by, created_at
       FROM automation_rules WHERE active = 1 AND event = ?`,
      [event.type],
    );

    for (const row of rows) {
      try {
        const config = parseRuleConfig(row.config);
        const conditionCheck = evaluateConditions(config.conditions, event.payload);
        if (!conditionCheck.passed) {
          continue;
        }

        if (row.action === "webhook_forward") {
          await WebhooksService.dispatchEvent(event);
          await ActivityService.log({
            user_id: row.created_by ?? "",
            action: "automation_executed",
            entity: "Automation",
            entity_id: row.id,
            new_value: {
              rule: row.name,
              event: event.type,
              action: row.action,
              condition: conditionCheck.reason,
            },
          });
          continue;
        }

        if (row.action === "notify_project_audience") {
          const projectId =
            typeof event.payload?.projectId === "string" ? event.payload.projectId : null;
          if (!projectId) continue;

          const recipients = await NotificationsService.getProjectRecipients(projectId);
          if (recipients.length === 0) continue;

          const titleTemplate =
            config.actionConfig?.titleTemplate || `Automatización: ${row.name}`;
          const messageTemplate =
            config.actionConfig?.messageTemplate || `Evento detectado: ${event.type}`;
          const severity = config.actionConfig?.severity || "reminder";

          const title = interpolateTemplate(titleTemplate, event.payload ?? {});
          const message = interpolateTemplate(messageTemplate, event.payload ?? {});

          const notifType: NotificationType =
            severity === "alert"
              ? "deadline_upcoming"
              : severity === "info"
                ? "project_updated"
                : "reminder";

          await Promise.all(
            recipients.map((receiverId) =>
              NotificationsService.create({
                receiver_id: receiverId,
                title,
                message,
                type: notifType,
                entity_type: "Project",
                entity_id: projectId,
                dedupe_key: `automation:${row.id}:${event.type}:${receiverId}:${
                  event.payload?.dedupeKey ?? new Date().toISOString().slice(0, 10)
                }`,
              }),
            ),
          );

          await ActivityService.log({
            user_id: row.created_by ?? "",
            action: "automation_executed",
            entity: "Automation",
            entity_id: row.id,
            new_value: {
              rule: row.name,
              event: event.type,
              action: row.action,
              notified: recipients.length,
              title,
            },
          });
        }
      } catch (err) {
        console.error("[automations] rule failed:", row.name, err instanceof Error ? err.message : err);
      }
    }
  }

  /**
   * Tests a rule simulation without modifying actual production state.
   */
  static async testRule(id: string, actorId: string): Promise<AutomationTestResult> {
    const rule = await AutomationsService.getById(id);
    if (!rule) {
      throw new Error("Automation rule not found.");
    }

    const eventDef = AUTOMATION_EVENT_DEFINITIONS.find((e) => e.type === rule.event);
    const simulatedPayload: Record<string, unknown> = {
      ...(eventDef?.samplePayload ?? {
        projectId: "proj-simulated",
        projectName: "Proyecto Demo",
      }),
    };

    // If rule requires specific status, adjust payload to match or test
    if (rule.config.conditions?.status) {
      simulatedPayload.status = rule.config.conditions.status;
    }
    if (rule.config.conditions?.priority) {
      simulatedPayload.priority = rule.config.conditions.priority;
    }

    const conditionCheck = evaluateConditions(rule.config.conditions, simulatedPayload);

    let evaluatedMessage = "";
    let actionDetails = "";

    if (rule.action === "notify_project_audience") {
      const titleTemplate =
        rule.config.actionConfig?.titleTemplate || `Automatización: ${rule.name}`;
      const msgTemplate =
        rule.config.actionConfig?.messageTemplate || `Evento detectado: ${rule.event}`;
      const title = interpolateTemplate(titleTemplate, simulatedPayload);
      const msg = interpolateTemplate(msgTemplate, simulatedPayload);
      evaluatedMessage = `${title} — ${msg}`;
      actionDetails = `Notificaría a la audiencia del proyecto asignado con severidad "${
        rule.config.actionConfig?.severity || "reminder"
      }".`;
    } else if (rule.action === "webhook_forward") {
      actionDetails =
        "Reenviaría el payload firmado HMAC-SHA256 a los endpoints webhooks activos configurados.";
    }

    await ActivityService.log({
      user_id: actorId,
      action: "tested_automation",
      entity: "Automation",
      entity_id: rule.id,
      new_value: { rule: rule.name, conditionsPassed: conditionCheck.passed },
    });

    return {
      success: true,
      ruleName: rule.name,
      event: rule.event,
      conditionsPassed: conditionCheck.passed,
      conditionDetails: conditionCheck.reason,
      actionExecuted: rule.action,
      actionDetails,
      simulatedPayload,
      evaluatedMessage,
    };
  }
}
