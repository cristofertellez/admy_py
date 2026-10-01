import { hasPermission } from "@/lib/auth";
import {
  assertClientVisible,
  assertMilestoneVisible,
  assertProjectVisible,
  assertTaskVisible,
  clientScope,
  milestoneScope,
  projectScope,
  requireScopedUser,
} from "@/lib/auth-scope";
import { newId, query, queryOne } from "@/lib/turso/client";
import { hasFullAccess } from "@/lib/roles";
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
       WHERE pc.project_id = ? AND pc.deleted_at IS NULL AND pc.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}
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

    if (input.parent_comment_id) {
      const parent = await queryOne<{ project_id: string }>(
        `SELECT project_id FROM project_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1`,
        [input.parent_comment_id],
      );
      if (!parent || parent.project_id !== input.project_id) {
        throw new Error("Parent comment not found.");
      }
    }

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

  static async updateProjectComment(id: string, message: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM project_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    const canModerate = hasFullAccess(user.role) || hasPermission(user, "comments.update");
    if (!canModerate && comment.user_id !== user.id) {
      throw new Error("You can only edit your own comments.");
    }

    const now = new Date().toISOString();
    await query(
      "UPDATE project_comments SET message = ?, is_edited = 1, edited_at = ?, updated_at = ? WHERE id = ?",
      [message, now, now, id],
    );
  }

  static async deleteProjectComment(id: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM project_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    const canModerate = hasFullAccess(user.role) || hasPermission(user, "comments.delete");
    if (!canModerate && comment.user_id !== user.id) {
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

    if (!hasFullAccess(user.role) && comment.user_id !== user.id) {
      throw new Error("You can only delete your own comments.");
    }

    const now = new Date().toISOString();
    await query("UPDATE task_comments SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);
  }

  // ============================================================
  // Milestone comments (Historia 9.4)
  // ============================================================

  static async listByMilestone(milestoneId: string) {
    const scope = await milestoneScope("mc.milestone_id");
    const rows = await query<Comment & CommentAuthorColumns>(
      `SELECT mc.*, u.first_name AS author_first_name, u.last_name AS author_last_name, u.avatar AS author_avatar
       FROM milestone_comments mc
       LEFT JOIN users u ON u.id = mc.user_id
       WHERE mc.milestone_id = ? AND mc.deleted_at IS NULL AND mc.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY mc.created_at ASC`,
      [milestoneId, ...scope.args],
    );

    return rows.map((row) => mapCommentWithAuthor(row));
  }

  // Loads every visible comment of every milestone of the project in one
  // query so the milestones page does not fan out per-milestone lookups.
  static async listByProjectMilestones(projectId: string) {
    await assertProjectVisible(projectId);

    const scope = await milestoneScope("mc.milestone_id");
    const rows = await query<Comment & CommentAuthorColumns & { milestone_id: string }>(
      `SELECT mc.*, u.first_name AS author_first_name, u.last_name AS author_last_name, u.avatar AS author_avatar
       FROM milestone_comments mc
       JOIN milestones m ON m.id = mc.milestone_id
       LEFT JOIN users u ON u.id = mc.user_id
       WHERE m.project_id = ? AND m.deleted_at IS NULL
         AND mc.deleted_at IS NULL AND mc.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY mc.created_at ASC`,
      [projectId, ...scope.args],
    );

    return rows.map((row) => mapCommentWithAuthor(row));
  }

  static async createMilestoneComment(input: {
    milestone_id: string;
    user_id: string;
    message: string;
    parent_comment_id?: string;
  }) {
    await assertMilestoneVisible(input.milestone_id);

    if (input.parent_comment_id) {
      const parent = await queryOne<{ milestone_id: string }>(
        `SELECT milestone_id FROM milestone_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1`,
        [input.parent_comment_id],
      );
      if (!parent || parent.milestone_id !== input.milestone_id) {
        throw new Error("Parent comment not found.");
      }
    }

    const id = newId();
    await query(
      `INSERT INTO milestone_comments (id, milestone_id, user_id, parent_comment_id, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.milestone_id, input.user_id, input.parent_comment_id ?? null, input.message],
    );

    const row = await queryOne<Comment>("SELECT * FROM milestone_comments WHERE id = ?", [id]);
    return this.mapComment(row!);
  }

  static async updateMilestoneComment(id: string, message: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM milestone_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    const canModerate = hasFullAccess(user.role) || hasPermission(user, "comments.update");
    if (!canModerate && comment.user_id !== user.id) {
      throw new Error("You can only edit your own comments.");
    }

    const now = new Date().toISOString();
    await query(
      "UPDATE milestone_comments SET message = ?, is_edited = 1, edited_at = ?, updated_at = ? WHERE id = ?",
      [message, now, now, id],
    );
  }

  static async deleteMilestoneComment(id: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM milestone_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    const canModerate = hasFullAccess(user.role) || hasPermission(user, "comments.delete");
    if (!canModerate && comment.user_id !== user.id) {
      throw new Error("You can only delete your own comments.");
    }

    const now = new Date().toISOString();
    await query("UPDATE milestone_comments SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?", [
      now,
      now,
      id,
    ]);
  }

  // ============================================================
  // Client comments (Historia 4.9)
  // ============================================================

  static async listByClient(clientId: string): Promise<CommentWithAuthor[]> {
    await assertClientVisible(clientId);

    const scope = await clientScope("c.id");
    const rows = await query<Comment & CommentAuthorColumns>(
      `SELECT cc.*, u.first_name AS author_first_name, u.last_name AS author_last_name, u.avatar AS author_avatar
       FROM client_comments cc
       JOIN clients c ON c.id = cc.client_id
       LEFT JOIN users u ON u.id = cc.user_id
       WHERE cc.client_id = ? AND cc.deleted_at IS NULL AND cc.is_active = 1${scope.sql ? ` AND ${scope.sql}` : ""}
       ORDER BY cc.created_at ASC`,
      [clientId, ...scope.args],
    );

    return rows.map((row) => mapCommentWithAuthor(row));
  }

  static async createClientComment(input: {
    client_id: string;
    user_id: string;
    message: string;
    parent_comment_id?: string;
  }): Promise<Comment> {
    await assertClientVisible(input.client_id);

    if (input.parent_comment_id) {
      const parent = await queryOne<{ client_id: string }>(
        `SELECT client_id FROM client_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1 LIMIT 1`,
        [input.parent_comment_id],
      );
      if (!parent || parent.client_id !== input.client_id) {
        throw new Error("Parent comment not found.");
      }
    }

    const id = newId();
    await query(
      `INSERT INTO client_comments (id, client_id, user_id, parent_comment_id, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.client_id, input.user_id, input.parent_comment_id ?? null, input.message],
    );

    const row = await queryOne<Comment>("SELECT * FROM client_comments WHERE id = ?", [id]);
    return this.mapComment(row!);
  }

  static async updateClientComment(id: string, message: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM client_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    const canModerate =
      hasFullAccess(user.role) ||
      (hasPermission(user, "comments.update"));
    if (!canModerate && comment.user_id !== user.id) {
      throw new Error("You can only edit your own comments.");
    }

    const now = new Date().toISOString();
    await query(
      "UPDATE client_comments SET message = ?, is_edited = 1, edited_at = ?, updated_at = ? WHERE id = ?",
      [message, now, now, id],
    );
  }

  static async deleteClientComment(id: string) {
    const user = await requireScopedUser();
    const comment = await queryOne<{ user_id: string }>(
      "SELECT user_id FROM client_comments WHERE id = ? AND deleted_at IS NULL AND is_active = 1",
      [id],
    );
    if (!comment) throw new Error("Comment not found.");

    const canModerate =
      hasFullAccess(user.role) ||
      (hasPermission(user, "comments.delete"));
    if (!canModerate && comment.user_id !== user.id) {
      throw new Error("You can only delete your own comments.");
    }

    const now = new Date().toISOString();
    await query(
      "UPDATE client_comments SET is_active = 0, deleted_at = ?, updated_at = ? WHERE id = ?",
      [now, now, id],
    );
  }

  // ============================================================
  // Comment search (Historia 9.15)
  // ============================================================
  //
  // Searches message content across all comment entities, scoping each source
  // by the caller's visibility so restricted roles only see permitted threads.

  static async search(searchTerm: string, limit = 10) {
    const pattern = `%${searchTerm.toLowerCase()}%`;

    const projectScopeClause = await projectScope("pc.project_id");
    const milestoneScopeClause = await milestoneScope("mc.milestone_id");
    const taskScopeClause = await projectScope("t.project_id");
    const clientScopeClause = await clientScope("cc.client_id");

    const results = await Promise.all([
      query<Record<string, unknown>>(
        `SELECT pc.id AS comment_id, 'project' AS entity_type, pc.project_id AS entity_id,
                pc.message, pc.created_at, p.name AS entity_name,
                u.first_name AS author_first_name, u.last_name AS author_last_name
         FROM project_comments pc
         JOIN projects p ON p.id = pc.project_id
         LEFT JOIN users u ON u.id = pc.user_id
         WHERE LOWER(pc.message) LIKE ? AND pc.deleted_at IS NULL AND pc.is_active = 1
           ${projectScopeClause.sql ? `AND ${projectScopeClause.sql}` : ""}
         LIMIT ?`,
        [pattern, ...projectScopeClause.args, limit],
      ),
      query<Record<string, unknown>>(
        `SELECT mc.id AS comment_id, 'milestone' AS entity_type, mc.milestone_id AS entity_id,
                mc.message, mc.created_at, m.title AS entity_name, m.project_id AS project_id,
                u.first_name AS author_first_name, u.last_name AS author_last_name
         FROM milestone_comments mc
         JOIN milestones m ON m.id = mc.milestone_id
         LEFT JOIN users u ON u.id = mc.user_id
         WHERE LOWER(mc.message) LIKE ? AND mc.deleted_at IS NULL AND mc.is_active = 1
           ${milestoneScopeClause.sql ? `AND ${milestoneScopeClause.sql}` : ""}
         LIMIT ?`,
        [pattern, ...milestoneScopeClause.args, limit],
      ),
      query<Record<string, unknown>>(
        `SELECT tc.id AS comment_id, 'task' AS entity_type, tc.task_id AS entity_id,
                tc.message, tc.created_at, t.title AS entity_name,
                u.first_name AS author_first_name, u.last_name AS author_last_name
         FROM task_comments tc
         JOIN tasks t ON t.id = tc.task_id
         LEFT JOIN users u ON u.id = tc.user_id
         WHERE LOWER(tc.message) LIKE ? AND tc.deleted_at IS NULL AND tc.is_active = 1
           ${taskScopeClause.sql ? `AND ${taskScopeClause.sql}` : ""}
         LIMIT ?`,
        [pattern, ...taskScopeClause.args, limit],
      ),
      query<Record<string, unknown>>(
        `SELECT cc.id AS comment_id, 'client' AS entity_type, cc.client_id AS entity_id,
                cc.message, cc.created_at, c.company_name AS entity_name,
                u.first_name AS author_first_name, u.last_name AS author_last_name
         FROM client_comments cc
         JOIN clients c ON c.id = cc.client_id
         LEFT JOIN users u ON u.id = cc.user_id
         WHERE LOWER(cc.message) LIKE ? AND cc.deleted_at IS NULL AND cc.is_active = 1
           ${clientScopeClause.sql ? `AND ${clientScopeClause.sql}` : ""}
         LIMIT ?`,
        [pattern, ...clientScopeClause.args, limit],
      ),
    ]);

    return results.flat();
  }
}
