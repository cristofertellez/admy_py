import { MilestonesService } from "@/features/milestones";
import { MilestonesTable } from "./milestones-table";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Milestones — ${id.slice(0, 8)}` };
}

export default async function ProjectMilestonesPage({ params }: Props) {
  const { id } = await params;
  const milestones = await MilestonesService.listByProject(id);

  return (
    <div className="space-y-6">
      <h1 className="text-display-sm text-ink">Milestones</h1>
      <MilestonesTable initialData={(milestones || []) as unknown as Record<string, unknown>[]} projectId={id} />
    </div>
  );
}
