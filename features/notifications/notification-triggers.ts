import { queryOne } from "@/lib/turso/client";
import { NotificationsService } from "./notifications.service";
import { EmailService } from "./email.service";

/**
 * Notification triggers (Historias 5.11 / 13.2 / 7.20).
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

  const recipients = await NotificationsService.getProjectRecipients(projectId);

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

export async function notifyProjectCreated(input: {
  projectId: string;
  actorId: string;
}): Promise<void> {
  await safeExecute(() =>
    notifyProjectRecipients(input.projectId, input.actorId, (projectName) => ({
      title: "New project",
      message: `Project "${projectName}" was created and shared with you.`,
      type: "project_created",
      entity_type: "Project",
      entity_id: input.projectId,
      sender_id: input.actorId,
      dedupe_key: `project_created:${input.projectId}`,
    })),
  );
}

export async function notifyProjectStatusChanged(input: {
  projectId: string;
  actorId: string;
  from: string;
  to: string;
}): Promise<void> {
  await safeExecute(() =>
    notifyProjectRecipients(input.projectId, input.actorId, (projectName) => ({
      title: "Project status changed",
      message: `"${projectName}" moved from ${input.from} to ${input.to}.`,
      type: "project_status_changed",
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
  await safeExecute(async () => {
    const project = await getProjectContext(input.projectId);
    if (!project) return;

    const recipients = await NotificationsService.getProjectRecipients(input.projectId);
    await Promise.all(
      recipients
        .filter((receiverId) => receiverId !== input.actorId)
        .map((receiverId) =>
          NotificationsService.create({
            receiver_id: receiverId,
            title: "Project completed",
            message: `"${project.name}" has been completed.`,
            type: "project_completed",
            entity_type: "Project",
            entity_id: input.projectId,
            sender_id: input.actorId,
            dedupe_key: `project_completed:${input.projectId}:${receiverId}`,
          }),
        ),
    );
  });
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

export async function notifyMentioned(input: {
  mentionedUserIds: string[];
  authorId: string;
  commentPreview: string;
  entityType: string;
  entityId: string;
}): Promise<void> {
  await safeExecute(async () => {
    await Promise.all(
      input.mentionedUserIds
        .filter((userId) => userId !== input.authorId)
        .map((userId) =>
          NotificationsService.create({
            receiver_id: userId,
            title: "You were mentioned",
            message: input.commentPreview.slice(0, 200),
            type: "comment_created",
            entity_type: input.entityType,
            entity_id: input.entityId,
            sender_id: input.authorId,
          }),
        ),
    );
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

export async function notifySubtaskCreated(parentTaskId: string, subtaskTitle: string, actorId: string): Promise<void> {
  await safeExecute(async () => {
    const parent = await queryOne<{ title: string; assigned_to: string | null; project_id: string }>(
      `SELECT title, assigned_to, project_id FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [parentTaskId],
    );
    if (!parent) return;

    const recipients = new Set<string>(await NotificationsService.getProjectRecipients(parent.project_id));
    if (parent.assigned_to) recipients.add(parent.assigned_to);

    await Promise.all(
      [...recipients]
        .filter((receiverId) => receiverId !== actorId)
        .map((receiverId) =>
          NotificationsService.create({
            receiver_id: receiverId,
            title: "New subtask",
            message: `Subtask "${subtaskTitle}" was added to "${parent.title}".`,
            type: "subtask_created",
            entity_type: "Task",
            entity_id: parentTaskId,
            sender_id: actorId,
            dedupe_key: `subtask_created:${parentTaskId}:${subtaskTitle}`,
          }),
        ),
    );
  });
}

/** Historia 7.10 — the assignee is notified on assignment/reassignment. */
export async function notifyTaskAssigned(taskId: string, actorId: string): Promise<void> {
  await safeExecute(async () => {
    const task = await queryOne<{ title: string; assigned_to: string | null }>(
      `SELECT title, assigned_to FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [taskId],
    );
    if (!task?.assigned_to || task.assigned_to === actorId) return;

    await NotificationsService.create({
      receiver_id: task.assigned_to,
      title: "Task assigned to you",
      message: `"${task.title}" is now assigned to you.`,
      type: "task_assigned",
      entity_type: "Task",
      entity_id: taskId,
      sender_id: actorId,
      dedupe_key: `task_assigned:${taskId}:${task.assigned_to}`,
    });
  });
}

/** Historia 7.20 — status changes notify the assignee and the project audience. */
export async function notifyTaskStatusChanged(input: {
  taskId: string;
  actorId: string;
  from: string;
  to: string;
}): Promise<void> {
  await safeExecute(async () => {
    const task = await queryOne<{ title: string; assigned_to: string | null; project_id: string }>(
      `SELECT title, assigned_to, project_id FROM tasks WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [input.taskId],
    );
    if (!task) return;

    const dateKey = new Date().toISOString().slice(0, 10);
    const isBlocked = input.to === "Blocked";
    const title = isBlocked
      ? "Task blocked"
      : input.to === "Completed"
        ? "Task completed"
        : "Task status changed";
    const type = isBlocked
      ? "task_blocked"
      : input.to === "Completed"
        ? "task_completed"
        : "task_status_changed";

    const recipients = new Set<string>(await NotificationsService.getProjectRecipients(task.project_id));
    if (task.assigned_to) recipients.add(task.assigned_to);

    await Promise.all(
      [...recipients]
        .filter((receiverId) => receiverId !== input.actorId)
        .map((receiverId) =>
          NotificationsService.create({
            receiver_id: receiverId,
            title,
            message: `"${task.title}" moved from ${input.from} to ${input.to}.`,
            type,
            entity_type: "Task",
            entity_id: input.taskId,
            sender_id: input.actorId,
            dedupe_key: `task_status:${input.taskId}:${input.to}:${receiverId}:${dateKey}`,
          }),
        ),
    );
  });
}

export async function notifyMilestoneCompleted(milestoneId: string, actorId: string): Promise<void> {
  await safeExecute(async () => {
    const milestone = await queryOne<{ title: string; project_id: string }>(
      `SELECT title, project_id FROM milestones WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [milestoneId],
    );
    if (!milestone) return;

    await notifyProjectRecipients(milestone.project_id, actorId, (projectName) => ({
      title: "Milestone completed",
      message: `Milestone "${milestone.title}" of "${projectName}" was completed.`,
      type: "milestone_completed",
      entity_type: "Milestone",
      entity_id: milestoneId,
      sender_id: actorId,
      dedupe_key: `milestone_completed:${milestoneId}`,
    }));
  });
}

export async function notifyFileUploaded(input: {
  projectId: string;
  actorId: string;
  filename: string;
}): Promise<void> {
  await safeExecute(() =>
    notifyProjectRecipients(input.projectId, input.actorId, (projectName) => ({
      title: "File uploaded",
      message: `"${input.filename}" was added to "${projectName}".`,
      type: "file_uploaded",
      entity_type: "Project",
      entity_id: input.projectId,
      sender_id: input.actorId,
      dedupe_key: `file_uploaded:${input.projectId}:${input.filename}`,
    })),
  );
}

/**
 * Historia 13.3 — after creating a notification, queue the e-mail side
 * channel. E-mail delivery is a prepared architecture: the transport
 * logs until an SMTP provider is configured (see email.service.ts).
 */
export async function dispatchEmailSideChannel(input: {
  receiverId: string;
  title: string;
  message: string | null;
  type: string;
}): Promise<void> {
  await safeExecute(async () => {
    const preferences = await NotificationsService.getPreferences(input.receiverId);
    if (!preferences.email_enabled) return;

    await EmailService.sendNotification({
      receiverId: input.receiverId,
      title: input.title,
      message: input.message,
      type: input.type,
      frequency: preferences.email_frequency,
      quietHoursStart: preferences.quiet_hours_start,
      quietHoursEnd: preferences.quiet_hours_end,
    });
  });
}
