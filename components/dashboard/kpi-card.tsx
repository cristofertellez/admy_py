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

const TONE_ACCENT = {
  default: "from-white/10 to-transparent",
  primary: "from-primary/30 to-transparent",
  success: "from-success/30 to-transparent",
  warning: "from-yellow-400/30 to-transparent",
  danger: "from-error/30 to-transparent",
  violet: "from-accent-violet/30 to-transparent",
  cyan: "from-accent-cyan/30 to-transparent",
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
    <CardContent className="relative overflow-hidden pt-6 pb-6 text-center">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${TONE_ACCENT[tone]}`}
      />
      <p className={`text-display-md font-semibold tracking-tight transition-transform duration-200 group-hover:scale-105 ${TONE_CLASS[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-caption font-medium text-muted">{label}</p>
    </CardContent>
  );

  if (!href) {
    return <Card className="group relative overflow-hidden">{body}</Card>;
  }

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-hairline/80 bg-surface-card transition-all duration-200 hover:border-hairline-strong hover:bg-surface-card-elevated focus-visible:outline-2 focus-visible:outline-primary"
    >
      {body}
    </Link>
  );
}
