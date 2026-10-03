"use client";

// Gráficos SVG ligeros y accesibles para el centro de reportes (Historia 12.14).
// No dependen de librerías externas y comparten paleta con BarChart.

interface ChartItem {
  label: string;
  value: number;
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export function PieChart({ data, title }: { data: ChartItem[]; title?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div>
      {title && <p className="mb-3 text-caption-uppercase text-muted">{title}</p>}
      {total === 0 ? (
        <p className="text-body-sm text-muted-soft py-6 text-center">No data available.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <svg width={160} height={160} viewBox="0 0 160 160" role="img" aria-label={title ?? "Pie chart"}>
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="24" />
            {data.map((item, i) => {
              const fraction = item.value / total;
              const dash = fraction * circumference;
              const segment = (
                <circle
                  key={item.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="24"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                />
              );
              offset += dash;
              return segment;
            })}
            <text x="80" y="84" textAnchor="middle" className="fill-ink text-body-sm font-medium">
              {total}
            </text>
          </svg>
          <ul className="space-y-1.5">
            {data.map((item, i) => (
              <li key={item.label} className="flex items-center gap-2 text-caption text-muted">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {item.label} · {item.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function LineChart({ data, title, height = 180, area = false }: { data: ChartItem[]; title?: string; height?: number; area?: boolean }) {
  const width = 560;
  const pad = 32;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: height - pad - (d.value / maxValue) * (height - pad * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`
      : "";

  return (
    <div>
      {title && <p className="mb-3 text-caption-uppercase text-muted">{title}</p>}
      {data.length === 0 ? (
        <p className="text-body-sm text-muted-soft py-6 text-center">No data available.</p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={title ?? "Trend chart"}
        >
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#E5E7EB" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#E5E7EB" />
          {area && areaPath && <path d={areaPath} fill="#3B82F6" opacity={0.12} />}
          {linePath && <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth={2} />}
          {points.map((p, i) => (
            <g key={data[i].label}>
              <circle cx={p.x} cy={p.y} r={3.5} fill="#3B82F6" />
              <text x={p.x} y={height - pad + 14} textAnchor="middle" className="fill-muted" fontSize={10}>
                {data[i].label}
              </text>
              <text x={p.x} y={p.y - 8} textAnchor="middle" className="fill-ink" fontSize={10}>
                {data[i].value}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
