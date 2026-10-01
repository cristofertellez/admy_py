import Link from "next/link";
import { Card, CardContent } from "@/components/shared/card";

// Historia 11.5 — KPI Card widget. Single source for every stat tile on the
// platform so role dashboards and feature pages stay visually consistent.

const TONE_CLASS = {
  default: "text-ink",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-error",
  violet: "text-accent-violet",
  cyan: "text-accent-cyan",
} as const;

export type KpiTone = keyof typeof TONE_CLASS;

interface KpiCardProps {
  value: string | number;
  label: string;
  href?: string;
  tone?: KpiTone;
}

export function KpiCard({ value, label, href, tone = "default" }: KpiCardProps) {
  const body = (
    <CardContent className="pt-6 pb-6 text-center">
      <p className={`text-display-md ${TONE_CLASS[tone]}`}>{value}</p>
      <p className="text-caption text-muted">{label}</p>
    </CardContent>
  );

  if (!href) {
    return <Card>{body}</Card>;
  }

  return (
    <Link
      href={href}
      className="block rounded-xl bg-surface-card transition-colors hover:bg-surface-card-elevated focus-visible:outline-2 focus-visible:outline-primary"
    >
      {body}
    </Link>
  );
}
