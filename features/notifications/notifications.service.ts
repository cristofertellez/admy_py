import { countRows, query, type InValue } from "@/lib/turso/client";

interface NotificationDbRow {
  id: string;
  receiver_id: string;
  sender_id: string | null;
  title: string;
  message: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: number;
  created_at: string;
  sender_first_name: string | null;
  sender_last_name: string | null;
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

  static async markAsRead(notificationId: string) {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [notificationId],
    );
  }

  static async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0`,
      [userId],
    );
  }
}
