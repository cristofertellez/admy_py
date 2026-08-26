import { queryOne } from "@/lib/turso/client";
import { NotificationsService } from "./notifications.service";

/**
 * Notification triggers for Historia 5.11.
 *
 * These helpers are invoked from server actions after a successful
 * mutation. They never throw: notification failures must not block
 * the main operation (same contract as ActivityService audit logs).
 */

interface ProjectContext {
  id: string;
  name: string;
  status: string;
}

async function safeExecute(operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation();
  } catch (err) {
    console.error("[notifications] trigger failed:", err instanceof Error ? err.message : err);
  }
}

async function getProjectContext(projectId: string): Promise<ProjectContext | null> {
  return queryOne<ProjectContext>(
    `SELECT id, name, status FROM projects WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [projectId],
  );
}

type NotificationPayload = Omit<Parameters<typeof NotificationsService.create>[0], "receiver_id">;

async function notifyProjectRecipients(
  projectId: string,
  actorId: string,
  build: (projectName: string) => NotificationPayload,
): Promise<void> {
  const project = await getProjectContext(projectId);
  if (!project) return;

  const recipients = await NotificationsService.getProjectIntermediaryRecipients(projectId);

  await Promise.all(
    recipients
      .filter((receiverId) => receiverId !== actorId)
      .map((receiverId) =>
        NotificationsService.create({ ...build(project.name), receiver_id: receiverId }),
      ),
  );
}

export async function notifyProjectUpdated(input: {
  projectId: string;
  actorId: string;
}): Promise<void> {
  await safeExecute(() =>
    notifyProjectRecipients(input.projectId, input.actorId, (projectName) => ({
      title: "Project updated",
      message: `"${projectName}" has been updated.`,
      type: "project_updated",
      entity_type: "Project",
      entity_id: input.projectId,
      sender_id: input.actorId,
    })),
  );
}

export async function notifyProjectCompleted(input: {
  projectId: string;
  actorId: string;
}): Promise<void> {
  await safeExecute(() =>
    notifyProjectRecipients(input.projectId, input.actorId, (projectName) => ({
      title: "Project completed",
      message: `"${projectName}" has been completed.`,
      type: "project_completed",
      entity_type: "Project",
      entity_id: input.projectId,
      sender_id: input.actorId,
      dedupe_key: `project_completed:${input.projectId}`,
    })),
  );
}

export async function notifyCommentCreated(input: {
  entityType: "project" | "task";
  entityId: string;
  commentId: string;
  commentPreview: string;
  authorId: string;
}): Promise<void> {
  await safeExecute(async () => {
    const projectId =
      input.entityType === "project"
        ? input.entityId
        : (
            await queryOne<{ project_id: string }>(
              `SELECT project_id FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
              [input.entityId],
            )
          )?.project_id;

    if (!projectId) return;

    await notifyProjectRecipients(projectId, input.authorId, () => ({
      title: "New comment",
      message: input.commentPreview.slice(0, 200),
      type: "comment_created",
      entity_type: input.entityType === "task" ? "Task" : "Project",
      entity_id: input.entityId,
      sender_id: input.authorId,
      dedupe_key: `comment_created:${input.commentId}`,
    }));
  });
}

export async function notifyTaskCreated(taskId: string, actorId: string): Promise<void> {
  await safeExecute(async () => {
    const task = await queryOne<{ title: string; project_id: string }>(
      `SELECT title, project_id FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [taskId],
    );
    if (!task) return;

    await notifyProjectRecipients(task.project_id, actorId, (projectName) => ({
      title: "New task",
      message: `A new task "${task.title}" was added to "${projectName}".`,
      type: "task_created",
      entity_type: "Task",
      entity_id: taskId,
      sender_id: actorId,
      dedupe_key: `task_created:${taskId}`,
    }));
  });
}
