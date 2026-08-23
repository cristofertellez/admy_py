"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { ProgressRing } from "@/components/charts/progress-ring";

interface TaskBarItem {
  label: string;
  value: number;
  color: string;
}

interface ProjectBarItem {
  label: string;
  value: number;
  color: string;
}

interface ChartsProps {
  taskData?: TaskBarItem[];
  projectData?: ProjectBarItem[];
  avgProgress?: number;
}

export function DashboardCharts({ taskData, projectData, avgProgress }: ChartsProps) {
  if (taskData?.length) {
    return <BarChart data={taskData} />;
  }

  if (projectData?.length && avgProgress !== undefined) {
    return (
      <ProgressRing
        percentage={avgProgress}
        size={140}
        strokeWidth={12}
        color="#10B981"
        bgColor="#F3F4F6"
        label={`${Math.round(avgProgress)}%`}
        sublabel="Completed"
      />
    );
  }

  return <p className="text-body-sm text-muted-soft">No data available.</p>;
}
