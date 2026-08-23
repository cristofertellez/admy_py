"use client";

import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";
import { createUser, updateUser, toggleUserActive } from "@/actions/users";
import { FormField, FormSelect } from "@/components/forms";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import type { ColumnDef } from "@tanstack/react-table";
import type { UserWithRole } from "@/features/users/users.types";

const columns: ColumnDef<UserWithRole>[] = [
  {
    accessorKey: "first_name",
    header: "Name",
    cell: ({ row }) => (
      <span className="text-body-strong">
        {row.original.first_name} {row.original.last_name}
      </span>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "role_name",
    header: "Role",
    cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant={getValue() ? "success" : "error"}>
        {getValue() ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

interface UsersTableProps {
  initialUsers: UserWithRole[];
  total: number;
  roles: { id: string; name: string }[];
  initialFilters: { search: string; role: string; status: string };
  pageIndex: number;
  pageSize: number;
}

export function UsersTable({
  initialUsers,
  total,
  roles,
  initialFilters,
  pageIndex,
  pageSize,
}: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchInput, 400);

  function navigate(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  useEffect(() => {
    if (debouncedSearch === initialFilters.search) return;
    navigate({ search: debouncedSearch || undefined, page: undefined });
  }, [debouncedSearch]);

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleUserActive(id, !current);
      router.refresh();
    });
  }

  const actionColumns: ColumnDef<UserWithRole>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingUser(row.original)}
            className="text-body-sm text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleToggle(row.original.id, row.original.is_active)}
            className="text-body-sm text-muted hover:text-body-strong"
          >
            {row.original.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="mb-1.5 block text-body-sm font-medium text-body-strong">
              Role
            </label>
            <select
              value={initialFilters.role}
              onChange={(e) => navigate({ role: e.target.value || undefined, page: undefined })}
              className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="mb-1.5 block text-body-sm font-medium text-body-strong">
              Status
            </label>
            <select
              value={initialFilters.status}
              onChange={(e) => navigate({ status: e.target.value || undefined, page: undefined })}
              className="h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>Add User</Button>
      </div>

      <DataTable
        columns={actionColumns}
        data={initialUsers}
        totalCount={total}
        searchColumn="first_name"
        searchPlaceholder="Search by name or email..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onPaginationChange={(pagination) =>
          navigate({ page: pagination.pageIndex === 0 ? undefined : String(pagination.pageIndex + 1) })
        }
        pageIndex={pageIndex}
        pageSize={pageSize}
      />

      {showCreate && (
        <UserFormModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}

      {editingUser && (
        <UserFormModal
          roles={roles}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  roles,
  user,
  onClose,
  onSuccess,
}: {
  roles: { id: string; name: string }[];
  user?: UserWithRole;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const action = user ? updateUser : createUser;
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  function roleName(roleId: string) {
    return roles.find((r) => r.id === roleId)?.name ?? "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const roleChanged = user && user.role_id !== formData.get("role_id");

    if (roleChanged) {
      setPendingFormData(formData);
      return;
    }

    formAction(formData);
  }

  function handleConfirmRoleChange() {
    if (pendingFormData) formAction(pendingFormData);
  }

  function handleCancelRoleChange() {
    setPendingFormData(null);
  }

  if (pendingFormData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Confirm Role Change</CardTitle>
            <button onClick={handleCancelRoleChange} className="text-muted hover:text-body-strong text-lg leading-none">
              ✕
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-body-sm text-body">
                You are about to change the role of{" "}
                <span className="text-body-strong">
                  {user?.first_name} {user?.last_name}
                </span>
                .
              </p>
              <div className="flex items-center gap-3 rounded-md border border-hairline bg-surface-card p-3">
                <Badge>{roleName(user?.role_id ?? "")}</Badge>
                <span className="text-muted">→</span>
                <Badge>{roleName(String(pendingFormData.get("role_id")))}</Badge>
              </div>
              <p className="text-caption text-muted">
                This will update their permissions immediately.
              </p>
              {state?.error && (
                <p className="text-body-sm text-error">{state.error}</p>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={handleCancelRoleChange} className="flex-1">
                  Back
                </Button>
                <Button type="button" onClick={handleConfirmRoleChange} disabled={isPending} className="flex-1">
                  {isPending ? "Updating..." : "Confirm"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{user ? "Edit User" : "Create User"}</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-body-strong text-lg leading-none">
            ✕
          </button>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-body-sm text-success">{state.success}</p>
              <Button onClick={onSuccess} variant="secondary" className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              {user && <input type="hidden" name="id" value={user.id} />}
              <FormField
                label="First Name"
                name="first_name"
                defaultValue={user?.first_name}
                required
              />
              <FormField
                label="Last Name"
                name="last_name"
                defaultValue={user?.last_name}
                required
              />
              {!user && (
                <>
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    required
                  />
                  <FormField
                    label="Password"
                    name="password"
                    type="password"
                    required
                    hint="Minimum 6 characters"
                  />
                </>
              )}
              <FormSelect
                label="Role"
                name="role_id"
                defaultValue={user?.role_id}
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
                required
              />
              {state?.error && (
                <p className="text-body-sm text-error">{state.error}</p>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Saving..." : user ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
