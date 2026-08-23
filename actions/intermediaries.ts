"use server";

import { IntermediariesService } from "@/features/intermediaries";
import { revalidatePath } from "next/cache";

export async function createIntermediary(_prevState: unknown, formData: FormData) {
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const email = formData.get("email") as string;

  if (!first_name || !last_name || !email) {
    return { error: "All fields are required." };
  }

  try {
    await IntermediariesService.create({ first_name, last_name, email, password: "temppass123" });
    revalidatePath("/dashboard/intermediaries");
    return { success: "Intermediary created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create." };
  }
}

export async function updateIntermediary(_prevState: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const email = formData.get("email") as string;

  if (!id || !first_name || !last_name || !email) {
    return { error: "All fields are required." };
  }

  try {
    await IntermediariesService.update(id, { first_name, last_name, email, updated_at: new Date().toISOString() });
    revalidatePath("/dashboard/intermediaries");
    return { success: "Intermediary updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update." };
  }
}

export async function toggleIntermediaryActive(id: string, isActive: boolean) {
  try {
    await IntermediariesService.toggleActive(id, isActive);
    revalidatePath("/dashboard/intermediaries");
  } catch {
    throw new Error("Failed to update.");
  }
}
