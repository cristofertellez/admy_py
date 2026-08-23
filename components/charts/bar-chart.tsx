"use client";

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
  maxValue?: number;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  height?: number;
}

const DEFAULT_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export function BarChart({ data, title, height = 200 }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-hairline-soft p-6" style={{ minHeight: height }}>
        <p className="text-body-sm text-muted-soft">No data available.</p>
      </div>
    );
  }

  const maxVal = data.reduce((max, d) => {
    const m = d.maxValue || Math.max(...data.map((x) => x.value), 1);
    return m > max ? m : max;
  }, 0);

  const barH = 32;
  const gap = 12;
  const chartH = Math.max(data.length * (barH + gap) + 40, 60);

  return (
    <div>
      {title && <p className="mb-3 text-caption-uppercase text-muted">{title}</p>}
      <div className="relative" style={{ height: chartH }}>
        {data.map((item, i) => {
          const width = maxVal > 0 ? Math.max((item.value / maxVal) * 100, 2) : 0;
          const color = item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          const y = i * (barH + gap);

          return (
            <div key={item.label} className="absolute flex items-center" style={{ top: y, height: barH, left: 0, right: 0 }}>
              <span className="w-24 shrink-0 text-body-sm text-muted truncate pr-2">{item.label}</span>
              <div className="relative flex-1 h-6 rounded-sm bg-surface-card-elevated overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
              <span className="ml-2 w-10 text-right text-caption text-muted tabular-nums">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
