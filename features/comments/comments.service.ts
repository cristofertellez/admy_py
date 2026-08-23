import { assertProjectVisible, assertTaskVisible, projectScope, requireScopedUser } from "@/lib/auth-scope";
import { newId, query, queryOne } from "@/lib/turso/client";
import type { Comment } from "@/types";

export interface CommentWithAuthor extends Comment {
  users: { first_name: string; last_name: string; avatar: string | null };
}

interface CommentAuthorColumns {
  author_first_name: string | null;
  author_last_name: string | null;
  author_avatar: string | null;
}

function mapCommentWithAuthor<T extends Comment & CommentAuthorColumns>(
  row: T,
): Omit<T, keyof CommentAuthorColumns> & { users: CommentWithAuthor["users"] } {
  const { author_first_name, author_last_name, author_avatar, ...comment } = row;
  return {
    ...comment,
    is_edited: Number(comment.is_edited) === 1,
    is_active: Number(comment.is_active) === 1,
    users: {
      first_name: author_first_name ?? "",
      last_name: author_last_name ?? "",
      avatar: author_avatar ?? null,
    },
  };
}

export class CommentsService {
  static async listByProject(projectId: string) {
    const scope = await projectScope("pc.project_id");
    const rows = await query<Comment & CommentAuthorColumns>(
      `SELECT pc.*, u.first_name AS author_first_name, u.last_name AS author_last_name, u.avatar AS author_avatar
       FROM project_comments pc
       LEFT JOIN users u ON u.id = pc.user_id
       WHERE pc.project_id = ? AND pc.parent_comment_id IS NULL AND pc.deleted_at IS NULL AND pc.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY pc.created_at ASC`,
      [projectId, ...scope.args],
    );

    return rows.map((row) => mapCommentWithAuthor(row));
  }

  static async listByTask(taskId: string) {
    const scope = await projectScope("t.project_id");
    const rows = await query<Comment & CommentAuthorColumns>(
      `SELECT tc.*, u.first_name AS author_first_name, u.last_name AS author_last_name, u.avatar AS author_avatar
       FROM task_comments tc
       JOIN tasks t ON t.id = tc.task_id
       LEFT JOIN users u ON u.id = tc.user_id
       WHERE tc.task_id = ? AND tc.parent_comment_id IS NULL AND tc.deleted_at IS NULL AND tc.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY tc.created_at ASC`,
      [taskId, ...scope.args],
    );

    return rows.map((row) => mapCommentWithAuthor(row));
  }

  static async createProjectComment(input: {
    project_id: string;
    user_id: string;
    message: string;
    parent_comment_id?: string;
  }) {
    await assertProjectVisible(input.project_id);

    const id = newId();
    await query(
      `INSERT INTO project_comments (id, project_id, user_id, parent_comment_id, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.project_id, input.user_id, input.parent_comment_id ?? null, input.message],
    );

    const row = await queryOne<Comment>("SELECT * FROM project_comments WHERE id = ?", [id]);
    return this.mapComment(row!);
  }

  static async createTaskComment(input: {
    task_id: string;
    user_id: string;
    message: string;
    parent_comment_id?: string;
  }) {
    await assertTaskVisible(input.task_id);

    const id = newId();
    await query(
      `INSERT INTO task_comments (id, task_id, user_id, parent_comment_id, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.task_id, input.user_id, input.parent_comment_id ?? null, input.message],
    );

    const row = await queryOne<Comment>("SELECT * FROM task_comments WHERE id = ?", [id]);
    return this.mapComment(row!);
  }

  private static mapComment(row: Comment): Comment {
    return { ...row, is_edited: Number(row.is_edited) === 1, is_active: Number(row.is_active) === 1 };
  }

  static async deleteProjectComment(id: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM project_comments WHERE id = ?",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    if (user.role !== "Developer" && comment.user_id !== user.id) {
      throw new Error("You can only delete your own comments.");
    }

    const now = new Date().toISOString();
    await query("UPDATE project_comments SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);
  }

  static async deleteTaskComment(id: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>("SELECT user_id FROM task_comments WHERE id = ?", [
      id,
    ]);
    if (!comment) throw new Error("Comment not found.");

    if (user.role !== "Developer" && comment.user_id !== user.id) {
      throw new Error("You can only delete your own comments.");
    }

    const now = new Date().toISOString();
    await query("UPDATE task_comments SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);
  }
}
