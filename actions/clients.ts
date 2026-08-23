"use server";

import { ClientsService } from "@/features/clients";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clientSchema = z.object({
  company_name: z.string().min(1),
  contact_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClient(_prevState: unknown, formData: FormData) {
  const parsed = clientSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
    website: formData.get("website") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Company name is required." };
  }

  try {
    await ClientsService.create(parsed.data as Parameters<typeof ClientsService.create>[0]);
    revalidatePath("/dashboard/clients");
    return { success: "Client created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create client." };
  }
}

export async function updateClient(_prevState: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  const parsed = clientSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
    website: formData.get("website") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success || !id) {
    return { error: "Invalid data." };
  }

  try {
    await ClientsService.update(id, parsed.data as Parameters<typeof ClientsService.update>[1]);
    revalidatePath("/dashboard/clients");
    return { success: "Client updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update client." };
  }
}

export async function toggleClientActive(id: string, isActive: boolean) {
  try {
    if (isActive) {
      await ClientsService.restore(id);
    } else {
      await ClientsService.archive(id);
    }
    revalidatePath("/dashboard/clients");
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to update client.");
  }
}
