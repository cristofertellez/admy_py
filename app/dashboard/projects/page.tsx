import { ProjectsService } from "@/features/projects";
import { ClientsService } from "@/features/clients";
import { TagsService } from "@/features/tags";
import { requirePermission, hasPermission } from "@/lib/auth";
import { PROJECT_PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/constants";
import { getCatalogOptions } from "@/features/settings";
import { ProjectsTable } from "./projects-table";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

const PAGE_SIZE = 20;
const CLIENT_OPTIONS_LIMIT = 200;

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    active?: string;
    tag?: string;
    page?: string;
  }>;
}

function pickOption(value: string | undefined, options: { value: string }[]) {
  return options.some((option) => option.value === value) ? value : undefined;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const actor = await requirePermission("projects.read");
  const params = await searchParams;

  const search = params.search?.trim() || undefined;

  // Historia 15.15: status/priority options come from the configured catalogs
  // (falling back to the built-in constants) so filters and forms reflect config.
  const statusOptions = await getCatalogOptions("project_statuses", PROJECT_STATUS_OPTIONS);
  const priorityOptions = await getCatalogOptions("project_priorities", PROJECT_PRIORITY_OPTIONS);
  const status = pickOption(params.status, statusOptions);
  const priority = pickOption(params.priority, priorityOptions);
  const active =
    params.active === "true" || params.active === "false" ? params.active === "true" : undefined;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  // Tag taxonomy (Historia 6.10) drives both the filter and the form selector.
  const tagOptions = await TagsService.list();
  const tag = tagOptions.some((option) => option.id === params.tag) ? params.tag : undefined;

  const { data: projects, total } = await ProjectsService.list({
    search,
    status,
    priority,
    isActive: active,
    tagId: tag,
    page,
    pageSize: PAGE_SIZE,
  });

  const canCreate = hasPermission(actor, "projects.create");
  const canUpdate = hasPermission(actor, "projects.update");
  const clientOptions =
    canCreate && hasPermission(actor, "clients.read")
      ? (await ClientsService.list({ pageSize: CLIENT_OPTIONS_LIMIT })).data.map((client) => ({
          id: client.id,
          company_name: client.company_name,
        }))
      : [];
  const intermediaryOptions =
    canCreate || canUpdate ? await ClientsService.listAvailableIntermediaries() : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-ink">Projects</h1>
          <p className="mt-1 text-body-sm text-muted">Manage all your projects.</p>
        </div>
      </div>
      <ProjectsTable
        initialProjects={projects}
        total={total}
        initialFilters={{
          search: search ?? "",
          status: status ?? "",
          priority: priority ?? "",
          active: active === undefined ? "" : String(active),
          tag: tag ?? "",
        }}
        pageIndex={page - 1}
        pageSize={PAGE_SIZE}
        clientOptions={clientOptions}
        intermediaryOptions={intermediaryOptions.map((intermediary) => ({
          id: intermediary.id,
          first_name: intermediary.first_name,
          last_name: intermediary.last_name,
        }))}
        tagOptions={tagOptions.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        }))}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        canCreate={canCreate}
        canUpdate={canUpdate}
      />
    </div>
  );
}
