import { IntermediariesService } from "@/features/intermediaries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await IntermediariesService.getById(id) as Record<string, unknown>;
  return { title: `${data.first_name} ${data.last_name}` };
}

export default async function IntermediaryDetailPage({ params }: Props) {
  const { id } = await params;
  const intermediary = await IntermediariesService.getById(id) as Record<string, unknown>;
  const clients = await IntermediariesService.getAssignedClients(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/intermediaries" className="text-body-sm text-muted hover:text-body-strong">← Back</Link>
        <h1 className="mt-2 text-display-sm text-ink">{intermediary.first_name as string} {intermediary.last_name as string}</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Email" value={intermediary.email as string} />
            <DetailRow label="Phone" value={(intermediary.phone as string) || null} />
            <DetailRow label="Status" value={intermediary.is_active ? "Active" : "Inactive"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Assigned Clients ({clients.length})</CardTitle></CardHeader>
          <CardContent>
            {clients.length === 0 ? <p className="text-body-sm text-muted-soft">No clients assigned.</p> : (
              <div className="divide-y divide-hairline-soft">
                {clients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2">
                    <span className="text-body-sm text-body-strong">{c.company_name}</span>
                    <Badge variant={c.is_active ? "success" : "error"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return <div className="flex justify-between"><span className="text-body-sm text-muted">{label}</span><span className="text-body-sm text-body-strong">{value || "—"}</span></div>;
}
