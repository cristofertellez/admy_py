"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { ProgressRing } from "@/components/charts/progress-ring";

interface TaskBarItem {
  label: string;
  value: number;
  color: string;
}

interface ReportsChartsProps {
  taskData?: TaskBarItem[];
  taskRate?: number;
  projectRate?: number;
}

export function ReportsCharts({ taskData, taskRate, projectRate }: ReportsChartsProps) {
  if (taskData?.length) {
    return <BarChart data={taskData} />;
  }

  if (taskRate !== undefined && projectRate !== undefined) {
    return (
      <div className="flex items-center justify-center gap-12">
        <ProgressRing
          percentage={taskRate}
          size={120}
          strokeWidth={10}
          color="#3B82F6"
          bgColor="#F3F4F6"
          label={`${taskRate}%`}
          sublabel="Tasks"
        />
        <ProgressRing
          percentage={projectRate}
          size={120}
          strokeWidth={10}
          color="#10B981"
          bgColor="#F3F4F6"
          label={`${projectRate}%`}
          sublabel="Projects"
        />
      </div>
    );
  }

  return <p className="text-body-sm text-muted-soft">No data available.</p>;
}
