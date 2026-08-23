import { ClientsService } from "@/features/clients";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const client = await ClientsService.getById(id);
  return { title: client.company_name };
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await ClientsService.getById(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/clients" className="text-body-sm text-muted hover:text-body-strong">
            ← Back to Clients
          </Link>
          <h1 className="mt-2 text-display-sm text-ink">{client.company_name}</h1>
        </div>
        <Badge variant={client.is_active ? "success" : "error"}>
          {client.is_active ? "Active" : "Archived"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Contact" value={client.contact_name} />
            <DetailRow label="Email" value={client.email} />
            <DetailRow label="Phone" value={client.phone} />
            <DetailRow label="Address" value={client.address} />
            <DetailRow label="Country" value={client.country} />
            <DetailRow label="City" value={client.city} />
            <DetailRow label="Website" value={client.website} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted">{client.notes || "No notes."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-body-sm text-muted">{label}</span>
      <span className="text-body-sm text-body-strong">{value || "—"}</span>
    </div>
  );
}
