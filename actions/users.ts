"use server";

import { UsersService } from "@/features/users";
import { getUser } from "@/lib/auth";
import { queryOne } from "@/lib/turso/client";
import { ActivityService } from "@/services/activity.service";
import { createUserSchema, updateUserSchema } from "@/schemas";
import { revalidatePath } from "next/cache";

export async function createUser(_prevState: unknown, formData: FormData) {
  const parsed = createUserSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role_id: formData.get("role_id"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const created = await UsersService.create(parsed.data);

    const actor = await getUser();

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "created_user",
        entity: "User",
        entity_id: created.id,
        new_value: {
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name,
          email: parsed.data.email,
          role_id: parsed.data.role_id,
        },
      });
    }

    revalidatePath("/dashboard/users");
    return { success: "User created." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create user." };
  }
}

export async function updateUser(_prevState: unknown, formData: FormData) {
  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    role_id: formData.get("role_id"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(fieldErrors).flat()[0] || "Invalid data." };
  }

  try {
    const actor = await getUser();

    const oldUser = await queryOne<{
      first_name: string;
      last_name: string;
      role_id: string;
      role_name: string;
    }>(
      `SELECT u.first_name, u.last_name, u.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       LIMIT 1`,
      [parsed.data.id],
    );

    await UsersService.update(parsed.data.id, {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      role_id: parsed.data.role_id,
    });

    if (actor && oldUser) {
      const nameChanged =
        oldUser.first_name !== parsed.data.first_name ||
        oldUser.last_name !== parsed.data.last_name;

      if (nameChanged) {
        await ActivityService.log({
          user_id: actor.id,
          action: "updated_user",
          entity: "User",
          entity_id: parsed.data.id,
          old_value: { first_name: oldUser.first_name, last_name: oldUser.last_name },
          new_value: { first_name: parsed.data.first_name, last_name: parsed.data.last_name },
        });
      }

      if (oldUser.role_id !== parsed.data.role_id) {
        const newRole = await queryOne<{ name: string }>(
          "SELECT name FROM roles WHERE id = ? LIMIT 1",
          [parsed.data.role_id],
        );

        await ActivityService.log({
          user_id: actor.id,
          action: "changed_role",
          entity: "User",
          entity_id: parsed.data.id,
          old_value: { role: oldUser.role_name },
          new_value: { role: newRole?.name },
        });
      }
    }

    revalidatePath("/dashboard/users");
    return { success: "User updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update user." };
  }
}

export async function toggleUserActive(id: string, isActive: boolean) {
  try {
    await UsersService.toggleActive(id, isActive);

    const actor = await getUser();

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: isActive ? "activated_user" : "deactivated_user",
        entity: "User",
        entity_id: id,
        old_value: { is_active: !isActive },
        new_value: { is_active: isActive },
      });
    }

    revalidatePath("/dashboard/users");
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to update user status.");
  }
}
