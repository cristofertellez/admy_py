"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { TagsService } from "@/features/tags";

export async function getTags() {
  await requirePermission("tasks.read");
  return TagsService.list();
}

export async function createTag(formData: FormData) {
  await requirePermission("tasks.create");
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const result = await TagsService.create(name, color);
  revalidatePath("/dashboard/tags");
  return result;
}

export async function updateTag(formData: FormData) {
  await requirePermission("tasks.update");
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const result = await TagsService.update(id, name, color);
  revalidatePath("/dashboard/tags");
  return result;
}

export async function deleteTag(formData: FormData) {
  await requirePermission("tasks.delete");
  const id = formData.get("id") as string;
  const result = await TagsService.remove(id);
  revalidatePath("/dashboard/tags");
  return result;
}
