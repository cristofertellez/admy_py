import { requirePermission } from "@/lib/auth";
import { UsersService } from "@/features/users";
import { RolesTable } from "./roles-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roles",
};

export default async function RolesPage() {
  await requirePermission("users.read");
  const roles = await UsersService.getRoles();
  const permissions = await UsersService.getPermissions();

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => ({
      ...role,
      permissionIds: await UsersService.getPermissionsByRole(role.id),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Roles & Permissions</h1>
        <p className="mt-1 text-body-sm text-muted">Manage roles and their permissions.</p>
      </div>
      <RolesTable roles={rolesWithPermissions} permissions={permissions} />
    </div>
  );
}
