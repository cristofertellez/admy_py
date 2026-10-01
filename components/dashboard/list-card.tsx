import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";

// Historia 11.5 — generic list widget chrome: card header with optional badge,
// semantic list and a single empty-state contract for every consumer.

interface ListCardProps {
  title: string;
  badge?: string;
  emptyMessage: string;
  itemCount: number;
  children: React.ReactNode;
}

export function ListCard({ title, badge, emptyMessage, itemCount, children }: ListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {badge !== undefined && <Badge>{badge}</Badge>}
      </CardHeader>
      <CardContent>
        {itemCount === 0 ? (
          <p className="text-body-sm text-muted-soft">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-hairline-soft">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}
