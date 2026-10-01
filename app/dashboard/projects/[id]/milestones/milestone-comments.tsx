"use client";

import {
  createMilestoneCommentAction,
  deleteMilestoneCommentAction,
  updateMilestoneCommentAction,
} from "@/actions/comments";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/forms";
import { CommentBody, extractMentionStrings } from "@/components/shared/comment-body";
import { CommentReactions } from "@/components/shared/comment-reactions";
import { CommentAttachments } from "@/components/shared/comment-attachments";
import { useActionState, useState, useTransition } from "react";

export interface MilestoneCommentRow {
  id: string;
  parent_comment_id: string | null;
  message: string;
  is_edited: boolean;
  user_id: string;
  created_at: string;
  users: { first_name: string; last_name: string; avatar: string | null };
}

interface Props {
  milestoneId: string;
  comments: MilestoneCommentRow[];
  currentUserId: string | null;
  canComment: boolean;
  canModerate: boolean;
  canUploadFiles: boolean;
  canDeleteFiles: boolean;
  canDownloadFiles: boolean;
}

interface ThreadNode extends MilestoneCommentRow {
  replies: MilestoneCommentRow[];
}

function buildThreads(comments: MilestoneCommentRow[]): ThreadNode[] {
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
  comment: Pick<MilestoneCommentRow, "user_id">,
  currentUserId: string | null,
  canModerate: boolean,
): boolean {
  return !!currentUserId && (canModerate || comment.user_id === currentUserId);
}

export function MilestoneComments({
  milestoneId,
  comments,
  currentUserId,
  canComment,
  canModerate,
  canUploadFiles,
  canDeleteFiles,
  canDownloadFiles,
}: Props) {
  const threads = buildThreads(comments);

  return (
    <div className="space-y-4">
      {canComment ? <NewCommentForm milestoneId={milestoneId} /> : null}

      {comments.length === 0 ? (
        <p className="text-body-sm text-muted-soft">No comments yet.</p>
      ) : (
        <ol aria-label="Milestone comments" className="relative space-y-3 border-l border-hairline pl-5">
          {threads.map((thread) => (
            <li key={thread.id} className="space-y-3">
              <CommentCard
                milestoneId={milestoneId}
                comment={thread}
                currentUserId={currentUserId}
                canModerate={canModerate}
                canComment={canComment}
                canUploadFiles={canUploadFiles}
                canDeleteFiles={canDeleteFiles}
                canDownloadFiles={canDownloadFiles}
              />
              {thread.replies.length > 0 && (
                <ul className="space-y-3 pl-5">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentCard
                        milestoneId={milestoneId}
                        comment={reply}
                        currentUserId={currentUserId}
                        canModerate={canModerate}
                        canComment={canComment}
                        canUploadFiles={canUploadFiles}
                        canDeleteFiles={canDeleteFiles}
                        canDownloadFiles={canDownloadFiles}
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
  milestoneId,
  comment,
  currentUserId,
  canModerate,
  canComment,
  canUploadFiles,
  canDeleteFiles,
  canDownloadFiles,
}: {
  milestoneId: string;
  comment: MilestoneCommentRow;
  currentUserId: string | null;
  canModerate: boolean;
  canComment: boolean;
  canUploadFiles: boolean;
  canDeleteFiles: boolean;
  canDownloadFiles: boolean;
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
      const result = await deleteMilestoneCommentAction(comment.id, milestoneId);
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
          {editable && !isEditing && (
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
          milestoneId={milestoneId}
          comment={comment}
          onDone={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <CommentBody value={comment.message} mentions={extractMentionStrings(comment.message)} />
      )}

      {error && (
        <p role="alert" className="mt-2 text-caption text-error">
          {error}
        </p>
      )}

      <CommentReactions entityType="milestone" commentId={comment.id} />

      <CommentAttachments
        commentId={comment.id}
        canUpload={canUploadFiles}
        canDownload={canDownloadFiles}
        canDelete={canDeleteFiles}
      />

      {canComment && !isEditing && (
        <button
          onClick={() => setIsReplying((v) => !v)}
          className="mt-2 text-caption-uppercase text-muted transition-colors hover:text-primary"
        >
          Reply
        </button>
      )}

      {isReplying && (
        <div className="mt-3">
          <NewCommentForm
            milestoneId={milestoneId}
            parentCommentId={comment.id}
            onDone={() => setIsReplying(false)}
          />
        </div>
      )}
    </article>
  );
}

function NewCommentForm({
  milestoneId,
  parentCommentId,
  onDone,
}: {
  milestoneId: string;
  parentCommentId?: string;
  onDone?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createMilestoneCommentAction, null);

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
      <input type="hidden" name="milestone_id" value={milestoneId} />
      {parentCommentId && <input type="hidden" name="parent_comment_id" value={parentCommentId} />}
      <MentionTextarea label={parentCommentId ? "Your reply" : "Message"} name="message" required />
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
  milestoneId,
  comment,
  onDone,
  onCancel,
}: {
  milestoneId: string;
  comment: MilestoneCommentRow;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateMilestoneCommentAction, null);

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
      <input type="hidden" name="milestone_id" value={milestoneId} />
      <MentionTextarea label="Message" name="message" defaultValue={comment.message} required />
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