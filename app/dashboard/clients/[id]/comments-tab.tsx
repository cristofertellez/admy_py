"use client";

import {
  createClientCommentAction,
  deleteClientCommentAction,
  updateClientCommentAction,
} from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { FormTextarea } from "@/components/forms";
import { useActionState, useState, useTransition } from "react";

export interface ClientCommentRow {
  id: string;
  parent_comment_id: string | null;
  message: string;
  is_edited: boolean;
  user_id: string;
  created_at: string;
  users: { first_name: string; last_name: string; avatar: string | null };
}

interface Props {
  clientId: string;
  comments: ClientCommentRow[];
  currentUserId: string | null;
  canComment: boolean;
  canModerate: boolean;
}

interface ThreadNode extends ClientCommentRow {
  replies: ClientCommentRow[];
}

function buildThreads(comments: ClientCommentRow[]): ThreadNode[] {
  const roots: ThreadNode[] = [];
  const byId = new Map<string, ThreadNode>();

  for (const comment of comments) {
    byId.set(comment.id, { ...comment, replies: [] });
  }

  for (const node of byId.values()) {
    if (node.parent_comment_id && byId.has(node.parent_comment_id)) {
      byId.get(node.parent_comment_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function canEditComment(
  comment: Pick<ClientCommentRow, "user_id">,
  currentUserId: string | null,
  canModerate: boolean,
): boolean {
  return !!currentUserId && (canModerate || comment.user_id === currentUserId);
}

export function CommentsTab({ clientId, comments, currentUserId, canComment, canModerate }: Props) {
  const threads = buildThreads(comments);

  return (
    <div className="space-y-6">
      {canComment ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <NewCommentForm clientId={clientId} />
          </CardContent>
        </Card>
      ) : null}

      {comments.length === 0 ? (
        <p className="rounded-xl border border-hairline bg-surface-card px-4 py-8 text-center text-body-sm text-muted-soft">
          No comments yet.
        </p>
      ) : (
        <ol aria-label="Client comments" className="relative space-y-4 border-l border-hairline pl-6 ml-3">
          {threads.map((thread) => (
            <li key={thread.id} className="space-y-3">
              <CommentCard
                clientId={clientId}
                comment={thread}
                currentUserId={currentUserId}
                canModerate={canModerate}
              />
              {thread.replies.length > 0 && (
                <ul className="space-y-3 pl-6">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentCard
                        clientId={clientId}
                        comment={reply}
                        currentUserId={currentUserId}
                        canModerate={canModerate}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CommentCard({
  clientId,
  comment,
  currentUserId,
  canModerate,
}: {
  clientId: string;
  comment: ClientCommentRow;
  currentUserId: string | null;
  canModerate: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [, startTransition] = useTransition();

  const authorName =
    [comment.users?.first_name, comment.users?.last_name].filter(Boolean).join(" ").trim() ||
    "Unknown user";
  const initials =
    `${comment.users?.first_name?.[0] ?? ""}${comment.users?.last_name?.[0] ?? ""}`.toUpperCase() || "?";
  const editable = canEditComment(comment, currentUserId, canModerate);

  function handleDelete() {
    if (!confirm("Delete this comment? This cannot be undone.")) return;

    setError(null);
    setIsBusy(true);
    startTransition(async () => {
      const result = await deleteClientCommentAction(comment.id, clientId);
      setIsBusy(false);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <article className="rounded-xl border border-hairline bg-surface-card p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-card-elevated text-caption font-semibold text-body-strong"
        >
          {initials}
        </span>
        <span className="text-body-sm font-medium text-body-strong">{authorName}</span>
        <time
          dateTime={comment.created_at}
          className="text-caption text-muted"
          title={new Date(comment.created_at).toLocaleString()}
        >
          {new Date(comment.created_at).toLocaleDateString()}
        </time>
        {comment.is_edited && <span className="text-caption text-muted">(edited)</span>}
        <div className="ml-auto flex items-center gap-2">
          {canEditComment(comment, currentUserId, canModerate) && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isBusy}
              className="text-body-sm text-primary hover:underline disabled:opacity-50"
            >
              Edit
            </button>
          )}
          {editable && (
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="text-body-sm text-error hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <EditCommentForm
          clientId={clientId}
          comment={comment}
          onDone={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <p className="mt-2 whitespace-pre-line break-words text-body-sm text-body">{comment.message}</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-caption text-error">
          {error}
        </p>
      )}

      {!isEditing && (
        <button
          onClick={() => setIsReplying((v) => !v)}
          className="mt-2 text-caption-uppercase text-muted transition-colors hover:text-primary"
        >
          Reply
        </button>
      )}

      {isReplying && (
        <div className="mt-3">
          <NewCommentForm clientId={clientId} parentCommentId={comment.id} onDone={() => setIsReplying(false)} />
        </div>
      )}
    </article>
  );
}

function NewCommentForm({
  clientId,
  parentCommentId,
  onDone,
}: {
  clientId: string;
  parentCommentId?: string;
  onDone?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createClientCommentAction, null);

  if (state?.success) {
    return (
      <div className="space-y-3">
        <p className="text-body-sm text-success">{state.success}</p>
        {onDone && (
          <Button onClick={onDone} variant="secondary" className="w-full sm:w-auto">
            Done
          </Button>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="client_id" value={clientId} />
      {parentCommentId && <input type="hidden" name="parent_comment_id" value={parentCommentId} />}
      <FormTextarea label={parentCommentId ? "Your reply" : "Message"} name="message" required />
      {state?.error && (
        <p role="alert" className="text-body-sm text-error">{state.error}</p>
      )}
      <div>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Posting..." : parentCommentId ? "Post Reply" : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}

function EditCommentForm({
  clientId,
  comment,
  onDone,
  onCancel,
}: {
  clientId: string;
  comment: ClientCommentRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateClientCommentAction, null);

  if (state?.success) {
    return (
      <div className="mt-3 space-y-3">
        <p className="text-body-sm text-success">{state.success}</p>
        <Button onClick={onDone} variant="secondary" className="w-full sm:w-auto">
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="comment_id" value={comment.id} />
      <input type="hidden" name="client_id" value={clientId} />
      <FormTextarea label="Message" name="message" defaultValue={comment.message} required />
      {state?.error && (
        <p role="alert" className="text-body-sm text-error">{state.error}</p>
      )}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
