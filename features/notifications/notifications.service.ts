import { countRows, newId, query, queryOne, type InValue } from "@/lib/turso/client";

export type NotificationType =
  | "project_updated"
  | "comment_created"
  | "task_created"
  | "project_completed"
  | "project_delayed"
  | "deadline_upcoming";

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

const UPCOMING_DEADLINE_DAYS = 7;

function toLocalDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class NotificationsService {
  static async list(userId: string, filters: { isRead?: boolean; page?: number; pageSize?: number } = {}) {
    const { isRead, page = 1, pageSize = 20 } = filters;

    let whereSql = "n.receiver_id = ?";
    const args: InValue[] = [userId];

    if (isRead !== undefined) {
      whereSql += " AND n.is_read = ?";
      args.push(isRead ? 1 : 0);
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
      `SELECT COUNT(*) AS total FROM notifications WHERE receiver_id = ? AND is_read = 0`,
      [userId],
    );
  }

  static async markAsRead(notificationId: string, userId: string) {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND receiver_id = ?`,
      [notificationId, userId],
    );
  }

  static async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0`,
      [userId],
    );
  }

  // ============================================================
  // Creation (Historia 5.11)
  // ============================================================

  static async create(input: CreateNotificationInput): Promise<boolean> {
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
   * Intermediaries who can see a project: active users with the
   * Intermediary role assigned to the project's client (mirrors the
   * project visibility scope in lib/auth-scope.ts).
   */
  static async getProjectIntermediaryRecipients(projectId: string): Promise<string[]> {
    const rows = await query<{ id: string }>(
      `SELECT DISTINCT u.id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       JOIN users u ON u.id = c.intermediary_id
       JOIN roles r ON r.id = u.role_id
       WHERE p.id = ?
         AND r.name = 'Intermediary'
         AND u.is_active = 1 AND u.deleted_at IS NULL
         AND c.is_active = 1 AND c.deleted_at IS NULL
         AND p.is_active = 1 AND p.deleted_at IS NULL`,
      [projectId],
    );

    return rows.map((row) => row.id);
  }

  /**
   * Generates time-based notifications (delayed projects and upcoming
   * deadlines) for intermediary recipients. Idempotent per day via
   * dedupe keys, so it is safe to call on every dashboard/notifications load.
   */
  static async syncTimeBasedNotifications(): Promise<number> {
    const today = new Date();
    const dateKey = toLocalDateKey(today);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + UPCOMING_DEADLINE_DAYS);
    const horizonKey = toLocalDateKey(horizon);

    let created = 0;

    const delayedProjects = await query<{
      id: string;
      name: string;
      estimated_end_date: string;
      client_intermediary_id: string | null;
    }>(
      `SELECT p.id, p.name, p.estimated_end_date, c.intermediary_id AS client_intermediary_id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.deleted_at IS NULL AND p.is_active = 1
         AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
         AND p.estimated_end_date IS NOT NULL AND p.estimated_end_date < ?
         AND c.intermediary_id IS NOT NULL
         AND c.is_active = 1 AND c.deleted_at IS NULL`,
      [dateKey],
    );

    for (const project of delayedProjects) {
      if (!project.client_intermediary_id) continue;
      const inserted = await NotificationsService.create({
        receiver_id: project.client_intermediary_id,
        title: "Project delayed",
        message: `"${project.name}" passed its estimated end date (${project.estimated_end_date}).`,
        type: "project_delayed",
        entity_type: "Project",
        entity_id: project.id,
        dedupe_key: `project_delayed:${project.id}:${dateKey}`,
      });
      if (inserted) created += 1;
    }

    const upcomingProjects = await query<{
      id: string;
      name: string;
      estimated_end_date: string;
      client_intermediary_id: string | null;
    }>(
      `SELECT p.id, p.name, p.estimated_end_date, c.intermediary_id AS client_intermediary_id
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       WHERE p.deleted_at IS NULL AND p.is_active = 1
         AND p.status NOT IN ('Completed', 'Cancelled', 'Archived')
         AND p.estimated_end_date IS NOT NULL
         AND p.estimated_end_date >= ? AND p.estimated_end_date <= ?
         AND c.intermediary_id IS NOT NULL
         AND c.is_active = 1 AND c.deleted_at IS NULL`,
      [dateKey, horizonKey],
    );

    for (const project of upcomingProjects) {
      if (!project.client_intermediary_id) continue;
      const inserted = await NotificationsService.create({
        receiver_id: project.client_intermediary_id,
        title: "Upcoming deadline",
        message: `"${project.name}" is due on ${project.estimated_end_date}.`,
        type: "deadline_upcoming",
        entity_type: "Project",
        entity_id: project.id,
        dedupe_key: `deadline_upcoming:project:${project.id}:${dateKey}`,
      });
      if (inserted) created += 1;
    }

    const upcomingMilestones = await query<{
      id: string;
      title: string;
      estimated_date: string;
      project_name: string;
      client_intermediary_id: string | null;
    }>(
      `SELECT m.id, m.title, m.estimated_date, p.name AS project_name,
              c.intermediary_id AS client_intermediary_id
       FROM milestones m
       JOIN projects p ON p.id = m.project_id
       JOIN clients c ON c.id = p.client_id
       WHERE m.deleted_at IS NULL AND m.is_active = 1
         AND m.status NOT IN ('Completed', 'Cancelled')
         AND m.estimated_date IS NOT NULL
         AND m.estimated_date >= ? AND m.estimated_date <= ?
         AND p.deleted_at IS NULL AND p.is_active = 1
         AND c.intermediary_id IS NOT NULL
         AND c.is_active = 1 AND c.deleted_at IS NULL`,
      [dateKey, horizonKey],
    );

    for (const milestone of upcomingMilestones) {
      if (!milestone.client_intermediary_id) continue;
      const inserted = await NotificationsService.create({
        receiver_id: milestone.client_intermediary_id,
        title: "Upcoming deadline",
        message: `Milestone "${milestone.title}" of "${milestone.project_name}" is due on ${milestone.estimated_date}.`,
        type: "deadline_upcoming",
        entity_type: "Milestone",
        entity_id: milestone.id,
        dedupe_key: `deadline_upcoming:milestone:${milestone.id}:${dateKey}`,
      });
      if (inserted) created += 1;
    }

    return created;
  }
}
