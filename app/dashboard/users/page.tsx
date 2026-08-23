import { requirePermission } from "@/lib/auth";
import { UsersService } from "@/features/users";
import { UsersTable } from "./users-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
};

const PAGE_SIZE = 20;

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requirePermission("users.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const role = params.role || undefined;
  const status =
    params.status === "active" || params.status === "inactive" ? params.status : undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const { data: users, total } = await UsersService.list({
    search,
    role,
    status,
    page,
    pageSize: PAGE_SIZE,
  });
  const roles = await UsersService.getRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Users</h1>
          <p className="mt-1 text-body-sm text-muted">Manage platform users and their roles.</p>
        </div>
      </div>
      <UsersTable
        initialUsers={users}
        total={total}
        roles={roles}
        initialFilters={{ search: search ?? "", role: role ?? "", status: status ?? "" }}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
