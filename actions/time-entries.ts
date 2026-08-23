"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { TimeEntriesService } from "@/features/time-entries";

export async function getTimeEntries(taskId: string) {
  return TimeEntriesService.listByTask(taskId);
}

export async function createTimeEntry(formData: FormData) {
  const user = await requirePermission("time-entries.create");

  const taskId = formData.get("task_id") as string;
  const date = formData.get("date") as string;
  const startTime = (formData.get("start_time") as string) || undefined;
  const endTime = (formData.get("end_time") as string) || undefined;
  const totalHours = parseFloat(formData.get("total_hours") as string);
  const description = (formData.get("description") as string) || undefined;

  const result = await TimeEntriesService.create({
    task_id: taskId,
    user_id: user.id,
    date,
    start_time: startTime,
    end_time: endTime,
    total_hours: totalHours,
    description,
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return result;
}

export async function deleteTimeEntry(formData: FormData) {
  await requirePermission("time-entries.delete");

  const id = formData.get("id") as string;
  try {
    const result = await TimeEntriesService.remove(id);
    revalidatePath("/dashboard/tasks");
    return result;
  } catch {
    return false;
  }
}
