"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactionsService, ALLOWED_REACTIONS } from "@/features/reactions";
import { toggleCommentReactionAction } from "@/actions/reactions";
import { queryKeys } from "@/hooks/query-keys";
import { useTransition } from "react";

export function CommentReactions({ entityType, commentId }: { entityType: string; commentId: string }) {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const queryKey = queryKeys.comments.reactions(entityType, commentId);

  const { data } = useQuery({
    queryKey,
    queryFn: () => ReactionsService.list(entityType, commentId),
  });

  function handleToggle(reaction: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("entity_type", entityType);
      formData.set("comment_id", commentId);
      formData.set("reaction", reaction);

      await toggleCommentReactionAction(null, formData);
      queryClient.invalidateQueries({ queryKey });
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {(data ?? ALLOWED_REACTIONS.map((reaction) => ({ reaction, count: 0, reacted: false }))).map((item) => (
        <button
          key={item.reaction}
          type="button"
          onClick={() => handleToggle(item.reaction)}
          aria-pressed={item.reacted}
          aria-label={`React with ${item.reaction}`}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption transition-colors ${
            item.reacted
              ? "border-primary bg-primary/10 text-primary"
              : "border-hairline text-muted hover:border-primary hover:text-primary"
          }`}
        >
          <span aria-hidden="true">{item.reaction}</span>
          {item.count > 0 && <span>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}