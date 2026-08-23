"use server";

import { UsersService } from "@/features/users";
import { getUser } from "@/lib/auth";
import { countRows, query, queryOne, type InValue } from "@/lib/turso/client";
import { ActivityService } from "@/services/activity.service";
import { revalidatePath } from "next/cache";

function placeholders(ids: string[]): string {
  return ids.map(() => "?").join(", ");
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  try {
    const role = await queryOne<{ name: string }>(
      "SELECT name FROM roles WHERE id = ? LIMIT 1",
      [roleId],
    );

    // Validate dependencies: ensure read permission is included if module actions are selected
    const allPerms = await query<{ id: string; name: string; module: string }>(
      "SELECT id, name, module FROM permissions",
    );
    const permMap = new Map(allPerms.map((p) => [p.id, p]));
    const nameMap = new Map(allPerms.map((p) => [p.name, p]));

    const finalPermIds = new Set(permissionIds);
    for (const id of permissionIds) {
      const perm = permMap.get(id);
      if (perm && !perm.name.endsWith(".read") && !perm.name.endsWith(".*")) {
        const readPermName = `${perm.module}.read`;
        const readPerm = nameMap.get(readPermName);
        if (readPerm) {
          finalPermIds.add(readPerm.id);
        }
      }
    }
    const resolvedPermissionIds = Array.from(finalPermIds);

    const oldPermIds = await UsersService.getPermissionsByRole(roleId);

    const oldPerms =
      oldPermIds.length > 0
        ? await query<{ name: string }>(
            `SELECT name FROM permissions WHERE id IN (${placeholders(oldPermIds)})`,
            oldPermIds as InValue[],
          )
        : [];

    await UsersService.updateRolePermissions(roleId, resolvedPermissionIds);

    const newPerms =
      resolvedPermissionIds.length > 0
        ? await query<{ name: string }>(
            `SELECT name FROM permissions WHERE id IN (${placeholders(resolvedPermissionIds)})`,
            resolvedPermissionIds as InValue[],
          )
        : [];

    const actor = await getUser();

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "updated_permissions",
        entity: "Role",
        entity_id: roleId,
        old_value: { role: role?.name, permissions: oldPerms.map((p) => p.name).sort() },
        new_value: { role: role?.name, permissions: newPerms.map((p) => p.name).sort() },
      });
    }

    revalidatePath("/dashboard/roles");
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to update permissions.");
  }
}

export async function deleteRole(roleId: string) {
  try {
    const role = await queryOne<{ name: string }>(
      "SELECT name FROM roles WHERE id = ? LIMIT 1",
      [roleId],
    );

    if (!role) {
      return { error: "Role not found." };
    }

    const userCount = await countRows(
      "SELECT COUNT(*) AS total FROM users WHERE role_id = ? AND deleted_at IS NULL",
      [roleId],
    );

    if (userCount > 0) {
      return { error: "This role is assigned to active users and cannot be deleted." };
    }

    await UsersService.softDeleteRole(roleId);

    const actor = await getUser();

    if (actor) {
      await ActivityService.log({
        user_id: actor.id,
        action: "deleted_role",
        entity: "Role",
        entity_id: roleId,
        old_value: { role: role.name, is_active: true },
        new_value: { role: role.name, is_active: false },
      });
    }

    revalidatePath("/dashboard/roles");
    return { success: "Role deleted." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete role." };
  }
}
