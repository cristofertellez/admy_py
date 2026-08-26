import { requirePermission } from "@/lib/auth";
import { IntermediariesService } from "@/features/intermediaries";
import { IntermediariesTable } from "./intermediaries-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intermediaries",
};

const PAGE_SIZE = 20;

interface IntermediariesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function IntermediariesPage({ searchParams }: IntermediariesPageProps) {
  await requirePermission("intermediaries.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;
  const status =
    params.status === "active" || params.status === "inactive" ? params.status : undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const [{ data: intermediaries, total }, stats] = await Promise.all([
    IntermediariesService.list({ search, status, page, pageSize: PAGE_SIZE }),
    IntermediariesService.getStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Intermediaries</h1>
          <p className="mt-1 text-body-sm text-muted">Manage agencies and representatives.</p>
        </div>
      </div>
      <section aria-label="Intermediary statistics">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Intermediaries" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
        </div>
      </section>
      <IntermediariesTable
        initialData={intermediaries || []}
        total={total}
        initialFilters={{ search: search ?? "", status: status ?? "" }}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-card p-6 text-center">
      <p className="text-display-lg text-ink">{value}</p>
      <p className="mt-1 text-caption text-muted">{label}</p>
    </div>
  );
}
