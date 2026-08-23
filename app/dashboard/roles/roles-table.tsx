"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { updateRolePermissions, deleteRole } from "@/actions/roles";
import { useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissionIds: string[];
}

interface Permission {
  id: string;
  name: string;
  module: string;
}

export function RolesTable({
  roles: initialRoles,
  permissions,
}: {
  roles: RoleRow[];
  permissions: Permission[];
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const groupedPermissions = permissions.reduce(
    (acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  function handleSavePermissions(roleId: string, permissionIds: string[]) {
    startTransition(async () => {
      await updateRolePermissions(roleId, permissionIds);
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, permissionIds } : r)),
      );
      setEditingRole(null);
    });
  }

  function handleDelete(role: RoleRow) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteRole(role.id);
      if ((result as { error?: string })?.error) {
        alert((result as { error?: string }).error);
        return;
      }
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    });
  }

  const columns: ColumnDef<RoleRow>[] = [
    {
      accessorKey: "name",
      header: "Role",
      cell: ({ getValue }) => <span className="text-body-strong">{getValue() as string}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => (getValue() as string) || "—",
    },
    {
      accessorKey: "permissionIds",
      header: "Permissions",
      cell: ({ getValue }) => (
        <Badge>{(getValue() as string[]).length} granted</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingRole(row.original)}
            className="text-body-sm text-primary hover:underline"
          >
            Manage Permissions
          </button>
          <button
            onClick={() => handleDelete(row.original)}
            className="text-body-sm text-error hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable columns={columns} data={roles} searchColumn="name" />

      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingRole.name} — Permissions</CardTitle>
              <button
                onClick={() => setEditingRole(null)}
                className="text-muted hover:text-body-strong text-lg leading-none"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent>
              <PermissionsEditor
                groupedPermissions={groupedPermissions}
                selectedIds={editingRole.permissionIds}
                onSave={(ids) => handleSavePermissions(editingRole.id, ids)}
                isPending={isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PermissionsEditor({
  groupedPermissions,
  selectedIds,
  onSave,
  isPending,
}: {
  groupedPermissions: Record<string, Permission[]>;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [searchQuery, setSearchQuery] = useState("");

  function toggle(id: string, module: string, permName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!permName.endsWith(".read")) {
          const readPerm = groupedPermissions[module]?.find((p) => p.name === `${module}.read`);
          if (readPerm) {
            next.add(readPerm.id);
          }
        }
      }
      return next;
    });
  }

  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce(
    (acc, [module, perms]) => {
      const filtered = perms.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          module.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (filtered.length > 0) {
        acc[module] = filtered;
      }
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search permissions by name or module..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
        {Object.entries(filteredGroupedPermissions).map(([module, perms]) => (
          <div key={module}>
            <p className="mb-2 text-caption-uppercase text-muted">{module}</p>
            <div className="space-y-1">
              {perms.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-body-sm hover:bg-surface-card"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id, module, p.name)}
                    className="rounded accent-primary"
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={() => onSave(Array.from(selected))}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? "Saving..." : "Save Permissions"}
      </Button>
    </div>
  );
}
