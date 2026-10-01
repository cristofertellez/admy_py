import { getUser } from "@/lib/auth";
import { newId, query, queryOne } from "@/lib/turso/client";

export const ALLOWED_REACTIONS = ["👍", "❤️", "👀", "✅"] as const;
export type ReactionEmoji = (typeof ALLOWED_REACTIONS)[number];

export interface ReactionSummary {
  reaction: string;
  count: number;
  reacted: boolean;
}

export interface CommentReactionRow {
  id: string;
  comment_entity_type: string;
  comment_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export class ReactionsService {
  static async list(commentEntityType: string, commentId: string): Promise<ReactionSummary[]> {
    const user = await getUser();

    const rows = await query<{ reaction: string; count: number }>(
      `SELECT reaction, COUNT(*) AS count
       FROM comment_reactions
       WHERE comment_entity_type = ? AND comment_id = ?
       GROUP BY reaction`,
      [commentEntityType, commentId],
    );

    const myReactions = new Set<string>();
    if (user) {
      const mine = await query<{ reaction: string }>(
        `SELECT reaction FROM comment_reactions
         WHERE comment_entity_type = ? AND comment_id = ? AND user_id = ?`,
        [commentEntityType, commentId, user.id],
      );
      mine.forEach((r) => myReactions.add(r.reaction));
    }

    return ALLOWED_REACTIONS.map((reaction) => {
      const match = rows.find((r) => r.reaction === reaction);
      return {
        reaction,
        count: match ? Number(match.count) : 0,
        reacted: myReactions.has(reaction),
      };
    });
  }

  static async toggle(commentEntityType: string, commentId: string, reaction: string): Promise<{ added: boolean }> {
    if (!ALLOWED_REACTIONS.includes(reaction as ReactionEmoji)) {
      throw new Error("Invalid reaction.");
    }

    const user = await getUser();
    if (!user) throw new Error("Unauthenticated.");

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM comment_reactions
       WHERE comment_entity_type = ? AND comment_id = ? AND user_id = ? AND reaction = ?
       LIMIT 1`,
      [commentEntityType, commentId, user.id, reaction],
    );

    if (existing) {
      await query(`DELETE FROM comment_reactions WHERE id = ?`, [existing.id]);
      return { added: false };
    }

    await query(
      `INSERT INTO comment_reactions (id, comment_entity_type, comment_id, user_id, reaction)
       VALUES (?, ?, ?, ?, ?)`,
      [newId(), commentEntityType, commentId, user.id, reaction],
    );
    return { added: true };
  }
}