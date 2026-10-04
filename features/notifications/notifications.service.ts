import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";
import { SettingsService } from "@/features/settings/service";

export type NotificationType =
  | "project_updated"
  | "comment_created"
  | "task_created"
  | "project_completed"
  | "project_delayed"
  | "deadline_upcoming"
  | "project_created"
  | "project_status_changed"
  | "task_assigned"
  | "task_status_changed"
  | "task_completed"
  | "task_due_soon"
  | "task_blocked"
  | "subtask_created"
  | "milestone_completed"
  | "file_uploaded"
  | "reminder";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "project_updated",
  "comment_created",
  "task_created",
  "project_completed",
  "project_delayed",
  "deadline_upcoming",
  "project_created",
  "project_status_changed",
  "task_assigned",
  "task_status_changed",
  "task_completed",
  "task_due_soon",
  "task_blocked",
  "subtask_created",
  "milestone_completed",
  "file_uploaded",
  "reminder",
];

interface NotificationDbRow {
  id: string;
  receiver_id: string;
  sender_id: string | null;
  title: string;
  message: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  dedupe_key: string | null;
  is_read: number;
  dismissed_at: string | null;
  created_at: string;
  sender_first_name: string | null;
  sender_last_name: string | null;
}

export interface CreateNotificationInput {
  receiver_id: string;
  sender_id?: string | null;
  title: string;
  message?: string | null;
  type: NotificationType;
  entity_type?: string | null;
  entity_id?: string | null;
  dedupe_key?: string | null;
}

export interface NotificationListFilters {
  isRead?: boolean;
  type?: string;
  search?: string;
  projectId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  email_frequency: "instant" | "daily" | "weekly";
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  event_types: NotificationType[] | null;
  last_email_digest_at: string | null;
}

interface PreferencesDbRow {
  in_app_enabled: number;
  email_enabled: number;
  push_enabled: number;
  email_frequency: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  event_types: string | null;
  last_email_digest_at: string | null;
}

const UPCOMING_DEADLINE_DAYS = 7;
const REMINDER_PROJECT_INACTIVE_DAYS = 14;
const REMINDER_COMMENT_UNANSWERED_DAYS = 3;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  in_app_enabled: true,
  email_enabled: false,
  push_enabled: false,
  email_frequency: "instant",
  quiet_hours_start: null,
  quiet_hours_end: null,
  event_types: null,
  last_email_digest_at: null,
};

function toLocalDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseEventTypes(raw: string | null): NotificationType[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter((value): value is NotificationType =>
      NOTIFICATION_TYPES.includes(value as NotificationType),
    );
  } catch {
    return null;
  }
}

export class NotificationsService {
  // ============================================================
  // Reading (Historia 13.1 / 13.10)
  // ============================================================

  static async list(userId: string, filters: NotificationListFilters = {}) {
    const { isRead, type, search, projectId, from, to, page = 1, pageSize = 20 } = filters;

    let whereSql = "n.receiver_id = ? AND n.dismissed_at IS NULL";
    const args: InValue[] = [userId];

    if (isRead !== undefined) {
      whereSql += " AND n.is_read = ?";
      args.push(isRead ? 1 : 0);
    }
    if (type) {
      whereSql += " AND n.type = ?";
      args.push(type);
    }
    if (search) {
      whereSql += " AND (n.title LIKE ? OR n.message LIKE ?)";
      const pattern = `%${search}%`;
      args.push(pattern, pattern);
    }
    if (projectId) {
      // Historia 13.10 — the project filter covers project, task and
      // milestone notifications linked to the selected project.
      whereSql += ` AND (
        (n.entity_type = 'Project' AND n.entity_id = ?)
        OR (n.entity_type = 'Task' AND n.entity_id IN (
          SELECT id FROM tasks WHERE project_id = ? AND deleted_at IS NULL))
        OR (n.entity_type = 'Milestone' AND n.entity_id IN (
          SELECT id FROM milestones WHERE project_id = ? AND deleted_at IS NULL))
      )`;
      args.push(projectId, projectId, projectId);
    }
    if (from) {
      whereSql += " AND n.created_at >= ?";
      args.push(from);
    }
    if (to) {
      whereSql += " AND n.created_at <= ?";
      args.push(`${to}T23:59:59.999Z`);
    }

    const total = await countRows(
      `SELECT COUNT(*) AS total FROM notifications n WHERE ${whereSql}`,
      args,
    );

    const rows = await query<NotificationDbRow>(
      `SELECT n.*, u.first_name AS sender_first_name, u.last_name AS sender_last_name
       FROM notifications n
       LEFT JOIN users u ON u.id = n.sender_id
       WHERE ${whereSql}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...args, pageSize, (page - 1) * pageSize],
    );

    const data = rows.map(({ sender_first_name, sender_last_name, is_read, ...notification }) => ({
      ...notification,
      is_read: is_read === 1,
      sender:
        sender_first_name !== null && sender_last_name !== null
          ? { first_name: sender_first_name, last_name: sender_last_name }
          : null,
    }));

    return { data, total, page, pageSize };
  }

  static async getUnreadCount(userId: string) {
    return countRows(
      `SELECT COUNT(*) AS total FROM notifications
       WHERE receiver_id = ? AND is_read = 0 AND dismissed_at IS NULL`,
      [userId],
    );
  }

  /**
   * Per-user indicators (Historia 13.12): total, unread, today, this week
   * and the distribution by notification type.
   */
  static async getStats(userId: string) {
    const todayKey = toLocalDateKey(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [total, unread, today, thisWeek, byTypeRows] = await Promise.all([
      countRows(
        `SELECT COUNT(*) AS total FROM notifications WHERE receiver_id = ? AND dismissed_at IS NULL`,
        [userId],
      ),
      this.getUnreadCount(userId),
      countRows(
        `SELECT COUNT(*) AS total FROM notifications
         WHERE receiver_id = ? AND dismissed_at IS NULL AND created_at >= ?`,
        [userId, `${todayKey}T00:00:00.000Z`],
      ),
      countRows(
        `SELECT COUNT(*) AS total FROM notifications
         WHERE receiver_id = ? AND dismissed_at IS NULL AND created_at >= ?`,
        [userId, `${toLocalDateKey(weekAgo)}T00:00:00.000Z`],
      ),
      query<{ type: string; total: number }>(
        `SELECT type, COUNT(*) AS total FROM notifications
         WHERE receiver_id = ? AND dismissed_at IS NULL
         GROUP BY type ORDER BY total DESC`,
        [userId],
      ),
    ]);

    const byType: Record<string, number> = {};
    for (const row of byTypeRows) byType[row.type] = row.total;

    return { total, unread, today, thisWeek, byType };
  }

  // ============================================================
  // Read state (Historia 13.9)
  // ============================================================

  static async markAsRead(notificationId: string, userId: string) {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND receiver_id = ?`,
      [notificationId, userId],
    );
  }

  static async markAsUnread(notificationId: string, userId: string) {
    await query(
      `UPDATE notifications SET is_read = 0 WHERE id = ? AND receiver_id = ?`,
      [notificationId, userId],
    );
  }

  static async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0`,
      [userId],
    );
  }

  /** Soft-dismiss: hides the notification without deleting audit context. */
  static async dismiss(notificationId: string, userId: string) {
    const dismissedAt = new Date().toISOString();
    await query(
      `UPDATE notifications SET dismissed_at = ?, is_read = 1 WHERE id = ? AND receiver_id = ?`,
      [dismissedAt, notificationId, userId],
    );
  }

  // ============================================================
  // Preferences (Historia 13.6)
  // ============================================================

  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    const row = await queryOne<PreferencesDbRow>(
      `SELECT in_app_enabled, email_enabled, push_enabled, email_frequency,
              quiet_hours_start, quiet_hours_end, event_types, last_email_digest_at
       FROM notification_preferences WHERE user_id = ? LIMIT 1`,
      [userId],
    );

    if (!row) return { ...DEFAULT_PREFERENCES };

    return {
      in_app_enabled: row.in_app_enabled === 1,
      email_enabled: row.email_enabled === 1,
      push_enabled: row.push_enabled === 1,
      email_frequency: (["instant", "daily", "weekly"] as const).includes(
        row.email_frequency as "instant" | "daily" | "weekly",
      )
        ? (row.email_frequency as NotificationPreferences["email_frequency"])
        : "instant",
      quiet_hours_start: row.quiet_hours_start,
      quiet_hours_end: row.quiet_hours_end,
      event_types: parseEventTypes(row.event_types),
      last_email_digest_at: row.last_email_digest_at,
    };
  }

  static async updatePreferences(
    userId: string,
    input: Omit<NotificationPreferences, "last_email_digest_at">,
  ): Promise<void> {
    await query(
      `INSERT INTO notification_preferences
         (id, user_id, in_app_enabled, email_enabled, push_enabled, email_frequency,
          quiet_hours_start, quiet_hours_end, event_types, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         in_app_enabled = excluded.in_app_enabled,
         email_enabled = excluded.email_enabled,
         push_enabled = excluded.push_enabled,
         email_frequency = excluded.email_frequency,
         quiet_hours_start = excluded.quiet_hours_start,
         quiet_hours_end = excluded.quiet_hours_end,
         event_types = excluded.event_types,
         updated_at = excluded.updated_at`,
      [
        newId(),
        userId,
        input.in_app_enabled ? 1 : 0,
        input.email_enabled ? 1 : 0,
        input.push_enabled ? 1 : 0,
        input.email_frequency,
        input.quiet_hours_start,
        input.quiet_hours_end,
        input.event_types ? JSON.stringify(input.event_types) : null,
        new Date().toISOString(),
      ],
    );
  }

  // ============================================================
  // Push subscriptions (Historias 13.4 / 14.12 — prepared)
  // ============================================================

  static async registerPushSubscription(
    userId: string,
    subscription: { endpoint: string; p256dh?: string | null; auth?: string | null; userAgent?: string | null },
  ): Promise<void> {
    await query(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`,
      [
        newId(),
        userId,
        subscription.endpoint,
        subscription.p256dh ?? null,
        subscription.auth ?? null,
        subscription.userAgent ?? null,
      ],
    );
  }

  static async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    await query(
      `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
      [userId, endpoint],
    );
  }

  static async listPushSubscriptions(userId: string) {
    return query<{ id: string; endpoint: string; created_at: string; user_agent: string | null }>(
      `SELECT id, endpoint, created_at, user_agent FROM push_subscriptions
       WHERE user_id = ? ORDER BY created_at DESC`,
      [userId],
    );
  }

  // ============================================================
  // Creation (Historia 5.11 / 13.2 / 13.8)
  // ============================================================

  /**
   * Creates one in-app notification. Respects the receiver's per-user
   * preferences (Historia 13.6): channel opt-in and event-type allowlist.
   * Dedupe keys make regeneration idempotent (Historia 13.8).
   */
  static async create(input: CreateNotificationInput): Promise<boolean> {
    const preferences = await NotificationsService.getPreferences(input.receiver_id);

    if (!preferences.in_app_enabled) return false;
    if (preferences.event_types && !preferences.event_types.includes(input.type)) return false;

    if (input.dedupe_key) {
      const existing = await queryOne<{ id: string }>(
        `SELECT id FROM notifications WHERE dedupe_key = ? LIMIT 1`,
        [input.dedupe_key],
      );
      if (existing) return false;
    }

    await query(
      `INSERT INTO notifications (id, receiver_id, sender_id, title, message, type, entity_type, entity_id, dedupe_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        input.receiver_id,
        input.sender_id ?? null,
        input.title,
        input.message ?? null,
        input.type,
        input.entity_type ?? null,
        input.entity_id ?? null,
        input.dedupe_key ?? null,
      ],
    );

    return true;
  }

  /**
   * Everyone who can see a project and should hear about it:
   * the project's intermediary, the client's intermediary, project
   * members and the client user (clients are linked by e-mail,
   * mirroring lib/auth-scope.ts).
   */
  static async getProjectRecipients(projectId: string): Promise<string[]> {
    const ids = new Set<string>();

    const staffRows = await query<{ id: string }>(
      `SELECT DISTINCT u.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       LEFT JOIN users u ON u.id = p.intermediary_id OR u.id = c.intermediary_id
       WHERE p.id = ?
         AND u.id IS NOT NULL
         AND u.is_active = 1 AND u.deleted_at IS NULL
         AND p.deleted_at IS NULL AND p.is_active = 1
         AND c.is_active = 1 AND c.deleted_at IS NULL`,
      [projectId],
    );
    for (const row of staffRows) ids.add(row.id);

    const clientRows = await query<{ id: string }>(
      `SELECT DISTINCT u.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       JOIN users u ON u.email = c.email
       JOIN roles r ON r.id = u.role_id AND r.name = 'Client'
       WHERE p.id = ?
         AND u.is_active = 1 AND u.deleted_at IS NULL
         AND p.deleted_at IS NULL AND p.is_active = 1
         AND c.is_active = 1 AND c.deleted_at IS NULL`,
      [projectId],
    );
    for (const row of clientRows) ids.add(row.id);

    const memberRows = await query<{ id: string }>(
      `SELECT DISTINCT u.id
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.project_id = ?
         AND u.is_active = 1 AND u.deleted_at IS NULL
         AND p.deleted_at IS NULL AND p.is_active = 1`,
      [projectId],
    );
    for (const row of memberRows) ids.add(row.id);

    return [...ids];
  }

  /** Kept for backward compatibility with the original trigger flow. */
  static async getProjectIntermediaryRecipients(projectId: string): Promise<string[]> {
    const rows = await query<{ id: string }>(
      `SELECT DISTINCT u.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       LEFT JOIN users u ON u.id IN (p.intermediary_id, c.intermediary_id)
       WHERE p.id = ?
         AND u.is_active = 1 AND u.deleted_at IS NULL
         AND p.is_active = 1 AND p.deleted_at IS NULL
         AND c.is_active = 1 AND c.deleted_at IS NULL`,
      [projectId],
    );
    return rows.map((row) => row.id);
  }

  // ============================================================
  // Time-based reminders (Historia 13.5)
  // ============================================================

  /**
   * Idempotent-per-day generation of time-based notifications:
   * delayed projects, upcoming project/milestone deadlines, overdue and
   * soon-due tasks, projects without activity and unanswered comments.
   * Runs on dashboard/notifications load (lazy "cron").
   */
  static async syncTimeBasedNotifications(): Promise<number> {
    const remindersEnabled = await SettingsService.getValue("reminder_enabled").catch(() => null);
    if (remindersEnabled === false) return 0;

    const reminderDaysRaw = await SettingsService.getValue("reminder_days").catch(() => null);
    const reminderDays =
      typeof reminderDaysRaw === "number" && reminderDaysRaw > 0 && reminderDaysRaw <= 90
        ? Math.floor(reminderDaysRaw)
        : UPCOMING_DEADLINE_DAYS;

    const today = new Date();
    const dateKey = toLocalDateKey(today);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + reminderDays);
    const horizonKey = toLocalDateKey(horizon);

    let created = 0;

    created += await NotificationsService.generateDelayedProjects(dateKey);
    created += await NotificationsService.generateUpcomingProjects(dateKey, horizonKey);
    created += await NotificationsService.generateUpcomingMilestones(dateKey, horizonKey);
    created += await NotificationsService.generateTaskReminders(dateKey, horizonKey);
    created += await NotificationsService.generateInactiveProjectReminders(today, dateKey);
    created += await NotificationsService.generateUnansweredCommentReminders(today, dateKey);

    return created;
  }

  private static async generateDelayedProjects(dateKey: string): Promise<number> {
    const projects = await query<{ id: string; name: string; estimated_end_date: string }>(
      `SELECT p.id, p.name, p.estimated_end_date
       FROM projects p
       WHERE p.deleted_at IS NULL AND p.is_active = 1
         AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
         AND p.estimated_end_date IS NOT NULL AND p.estimated_end_date < ?`,
      [dateKey],
    );

    let created = 0;
    for (const project of projects) {
      const recipients = await NotificationsService.getProjectRecipients(project.id);
      for (const receiverId of recipients) {
        const inserted = await NotificationsService.create({
          receiver_id: receiverId,
          title: "Project delayed",
          message: `"${project.name}" passed its estimated end date (${project.estimated_end_date}).`,
          type: "project_delayed",
          entity_type: "Project",
          entity_id: project.id,
          dedupe_key: `project_delayed:${project.id}:${receiverId}:${dateKey}`,
        });
        if (inserted) created += 1;
      }
    }
    return created;
  }

  private static async generateUpcomingProjects(dateKey: string, horizonKey: string): Promise<number> {
    const projects = await query<{ id: string; name: string; estimated_end_date: string }>(
      `SELECT p.id, p.name, p.estimated_end_date
       FROM projects p
       WHERE p.deleted_at IS NULL AND p.is_active = 1
         AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
         AND p.estimated_end_date IS NOT NULL
         AND p.estimated_end_date >= ? AND p.estimated_end_date <= ?`,
      [dateKey, horizonKey],
    );

    let created = 0;
    for (const project of projects) {
      const recipients = await NotificationsService.getProjectRecipients(project.id);
      for (const receiverId of recipients) {
        const inserted = await NotificationsService.create({
          receiver_id: receiverId,
          title: "Upcoming deadline",
          message: `"${project.name}" is due on ${project.estimated_end_date}.`,
          type: "deadline_upcoming",
          entity_type: "Project",
          entity_id: project.id,
          dedupe_key: `deadline_upcoming:project:${project.id}:${receiverId}:${dateKey}`,
        });
        if (inserted) created += 1;
      }
    }
    return created;
  }

  private static async generateUpcomingMilestones(dateKey: string, horizonKey: string): Promise<number> {
    const milestones = await query<{
      id: string;
      title: string;
      estimated_date: string;
      project_id: string;
      project_name: string;
    }>(
      `SELECT m.id, m.title, m.estimated_date, p.id AS project_id, p.name AS project_name
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       WHERE m.deleted_at IS NULL AND m.is_active = 1
         AND m.status NOT IN ('Completed', 'Cancelled')
         AND m.estimated_date IS NOT NULL
         AND m.estimated_date >= ? AND m.estimated_date <= ?
         AND p.deleted_at IS NULL AND p.is_active = 1`,
      [dateKey, horizonKey],
    );

    let created = 0;
    for (const milestone of milestones) {
      const recipients = await NotificationsService.getProjectRecipients(milestone.project_id);
      for (const receiverId of recipients) {
        const inserted = await NotificationsService.create({
          receiver_id: receiverId,
          title: "Upcoming deadline",
          message: `Milestone "${milestone.title}" of "${milestone.project_name}" is due on ${milestone.estimated_date}.`,
          type: "deadline_upcoming",
          entity_type: "Milestone",
          entity_id: milestone.id,
          dedupe_key: `deadline_upcoming:milestone:${milestone.id}:${receiverId}:${dateKey}`,
        });
        if (inserted) created += 1;
      }
    }
    return created;
  }

  /** Overdue tasks notify the assignee; tasks due soon do the same (13.5 / 7.20). */
  private static async generateTaskReminders(dateKey: string, horizonKey: string): Promise<number> {
    const tasks = await query<{
      id: string;
      title: string;
      project_id: string;
      estimated_end: string | null;
      assigned_to: string | null;
      status: string;
    }>(
      `SELECT t.id, t.title, t.project_id, t.estimated_end, t.assigned_to, t.status
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.deleted_at IS NULL AND t.is_active = 1
         AND t.status NOT IN ('Completed', 'Cancelled')
         AND t.estimated_end IS NOT NULL
         AND t.estimated_end <= ?
         AND p.deleted_at IS NULL AND p.is_active = 1`,
      [horizonKey],
    );

    let created = 0;
    for (const task of tasks) {
      if (!task.assigned_to) continue;
      const isOverdue = task.estimated_end !== null && task.estimated_end < dateKey;
      const inserted = await NotificationsService.create({
        receiver_id: task.assigned_to,
        title: isOverdue ? "Task overdue" : "Task due soon",
        message: isOverdue
          ? `"${task.title}" passed its due date (${task.estimated_end}).`
          : `"${task.title}" is due on ${task.estimated_end}.`,
        type: "task_due_soon",
        entity_type: "Task",
        entity_id: task.id,
        dedupe_key: `task_due_soon:${task.id}:${isOverdue ? "overdue" : "soon"}:${dateKey}`,
      });
      if (inserted) created += 1;
    }
    return created;
  }

  /** Projects without any activity for two weeks remind their audience. */
  private static async generateInactiveProjectReminders(today: Date, dateKey: string): Promise<number> {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - REMINDER_PROJECT_INACTIVE_DAYS);
    const cutoffKey = toLocalDateKey(cutoff);

    const projects = await query<{ id: string; name: string }>(
      `SELECT p.id, p.name
       FROM projects p
       WHERE p.deleted_at IS NULL AND p.is_active = 1
         AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
         AND p.updated_at < ?
         AND NOT EXISTS (
           SELECT 1 FROM activity_logs al
           WHERE al.entity = 'Project' AND al.entity_id = p.id AND al.created_at >= ?
         )`,
      [`${cutoffKey}T00:00:00.000Z`, `${cutoffKey}T00:00:00.000Z`],
    );

    let created = 0;
    for (const project of projects) {
      const recipients = await NotificationsService.getProjectRecipients(project.id);
      for (const receiverId of recipients) {
        const inserted = await NotificationsService.create({
          receiver_id: receiverId,
          title: "Project without activity",
          message: `"${project.name}" has no recorded activity in the last ${REMINDER_PROJECT_INACTIVE_DAYS} days.`,
          type: "reminder",
          entity_type: "Project",
          entity_id: project.id,
          dedupe_key: `project_inactive:${project.id}:${receiverId}:${dateKey}`,
        });
        if (inserted) created += 1;
      }
    }
    return created;
  }

  /**
   * Comments with no replies after a few days remind the project
   * audience so conversations do not stall silently.
   */
  private static async generateUnansweredCommentReminders(today: Date, dateKey: string): Promise<number> {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - REMINDER_COMMENT_UNANSWERED_DAYS);
    const cutoffKey = toLocalDateKey(cutoff);

    const comments = await query<{ id: string; project_id: string; content: string; user_id: string }>(
      `SELECT pc.id, pc.project_id, pc.content, pc.user_id
       FROM project_comments pc
       JOIN projects p ON p.id = pc.project_id
       WHERE pc.parent_comment_id IS NULL
         AND pc.deleted_at IS NULL
         AND pc.created_at < ?
         AND p.deleted_at IS NULL AND p.is_active = 1
         AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
         AND NOT EXISTS (
           SELECT 1 FROM project_comments reply
           WHERE reply.parent_comment_id = pc.id AND reply.deleted_at IS NULL
         )`,
      [`${cutoffKey}T00:00:00.000Z`],
    );

    let created = 0;
    for (const comment of comments) {
      const recipients = await NotificationsService.getProjectRecipients(comment.project_id);
      for (const receiverId of recipients) {
        if (receiverId === comment.user_id) continue;
        const inserted = await NotificationsService.create({
          receiver_id: receiverId,
          title: "Comment awaiting response",
          message: `A comment on "${comment.content.slice(0, 80)}..." has no replies yet.`,
          type: "reminder",
          entity_type: "Project",
          entity_id: comment.project_id,
          dedupe_key: `comment_unanswered:${comment.id}:${receiverId}:${dateKey}`,
        });
        if (inserted) created += 1;
      }
    }
    return created;
  }
}
