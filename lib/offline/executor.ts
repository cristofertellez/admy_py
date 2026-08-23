import {
  createProjectCommentAction,
  createTaskCommentAction,
} from "@/actions/comments";
import { toggleTaskCompletion, updateTask } from "@/actions/tasks";
import { updateProject } from "@/actions/projects";
import { toFormData, type PendingAction } from "./pending-actions";

type FormAction = (
  prevState: unknown,
  formData: FormData,
) => Promise<{ success?: string; error?: string }>;

const formActions: Record<string, FormAction> = {
  "project-comment.create": createProjectCommentAction,
  "task-comment.create": createTaskCommentAction,
  "task.update": updateTask,
  "task.complete": toggleTaskCompletion,
  "project.update": updateProject,
};

export function isReplayableAction(type: string): boolean {
  return type in formActions;
}

export async function executePendingAction(action: PendingAction): Promise<void> {
  const formAction = formActions[action.type];
  if (!formAction) {
    throw new Error(`Unsupported pending action type: ${action.type}`);
  }

  const result = await formAction(null, toFormData(action.payload));
  if (result.error) {
    throw new Error(result.error);
  }
}
