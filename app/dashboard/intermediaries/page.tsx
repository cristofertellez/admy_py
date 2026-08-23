import { requirePermission } from "@/lib/auth";
import { IntermediariesService } from "@/features/intermediaries";
import { IntermediariesTable } from "./intermediaries-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Intermediaries",
};

export default async function IntermediariesPage() {
  await requirePermission("intermediaries.read");
  const { data } = await IntermediariesService.list({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Intermediaries</h1>
          <p className="mt-1 text-body-sm text-muted">Manage agencies and representatives.</p>
        </div>
      </div>
      <IntermediariesTable initialData={(data || []) as Record<string, unknown>[]} />
    </div>
  );
}
