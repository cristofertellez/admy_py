"use server";

import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { ClientsService } from "@/features/clients";
import { ProjectsService } from "@/features/projects";
import { TasksService } from "@/features/tasks";
import { MilestonesService } from "@/features/milestones";
import { publish } from "@/lib/events/bus";
import { clientSchema } from "@/schemas";
import { dateString } from "@/schemas/shared";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

// Épica 17 (17.10) — data import for clients, projects, tasks and
// milestones. The flow is two-phase: `previewImport` validates every row
// without writing and returns a detailed report; `commitImport` re-validates
// and inserts only the rows that pass. Sources: pasted/CSV text or an
// uploaded .csv / .xlsx file.

export type ImportEntity = "clients" | "projects" | "tasks" | "milestones";

interface ImportRowResult {
  row: number;
  status: "valid" | "error";
  summary: string;
  error?: string;
}

export interface ImportPreviewResult {
  rows: ImportRowResult[];
  validCount: number;
  errorCount: number;
}

export interface ImportCommitResult {
  created: number;
  skipped: number;
  errors: ImportRowResult[];
}

/** Minimal RFC-4180-aware CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          currentField += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field !== "")) rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  currentRow.push(currentField.trim());
  if (currentRow.some((field) => field !== "")) rows.push(currentRow);
  return rows;
}

/** Normalizes a source (pasted CSV text or uploaded file) into rows. */
async function parseSource(source: string | File): Promise<string[][]> {
  if (typeof source === "string") return parseCsv(source);

  const buffer = new Uint8Array(await source.arrayBuffer());
  if (source.name.toLowerCase().endsWith(".xlsx")) {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return [];
    const json = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
    return json.map((row) => row.map((cell) => String(cell ?? "").trim()));
  }

  return parseCsv(new TextDecoder().decode(buffer));
}

const CLIENT_HEADER_ALIASES: Record<string, string> = {
  company_name: "company_name",
  company: "company_name",
  contact_name: "contact_name",
  contact: "contact_name",
  email: "email",
  phone: "phone",
  address: "address",
  status: "status",
};

const PROJECT_HEADER_ALIASES: Record<string, string> = {
  name: "name",
  title: "name",
  client: "client",
  client_email: "client",
  status: "status",
  priority: "priority",
  estimated_hours: "estimated_hours",
  estimated_start: "estimated_start",
  estimated_end: "estimated_end",
};

const TASK_HEADER_ALIASES: Record<string, string> = {
  project: "project",
  title: "title",
  name: "title",
  status: "status",
  priority: "priority",
  estimated_hours: "estimated_hours",
  due_date: "estimated_end",
  estimated_end: "estimated_end",
};

const MILESTONE_HEADER_ALIASES: Record<string, string> = {
  project: "project",
  title: "title",
  name: "title",
  estimated_date: "estimated_date",
  date: "estimated_date",
  status: "status",
};

function aliasesFor(entity: ImportEntity): Record<string, string> {
  switch (entity) {
    case "clients":
      return CLIENT_HEADER_ALIASES;
    case "projects":
      return PROJECT_HEADER_ALIASES;
    case "tasks":
      return TASK_HEADER_ALIASES;
    case "milestones":
      return MILESTONE_HEADER_ALIASES;
  }
}

function mapRow(header: string[], row: string[], aliases: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  header.forEach((column, index) => {
    const key = aliases[column.toLowerCase().replace(/\s+/g, "_")];
    if (key && row[index] !== undefined) mapped[key] = row[index];
  });
  return mapped;
}

const projectImportSchema = z.object({
  name: z.string().min(2),
  client: z.string().min(2),
  status: z.string().min(2),
  priority: z.string().min(2),
  estimated_hours: z.coerce.number().min(0).optional(),
  estimated_start: z.string().optional(),
  estimated_end: z.string().optional(),
});

const taskImportSchema = z.object({
  project: z.string().min(2),
  title: z.string().min(2),
  status: z.string().min(2),
  priority: z.string().min(2),
  estimated_hours: z.coerce.number().min(0).optional(),
  estimated_end: z.string().optional(),
});

const milestoneImportSchema = z.object({
  project: z.string().min(2),
  title: z.string().min(2),
  estimated_date: dateString,
  status: z.string().min(2).optional(),
});

function requiredPermissionFor(entity: ImportEntity): string {
  switch (entity) {
    case "clients":
      return "clients.create";
    case "projects":
      return "projects.create";
    case "tasks":
      return "tasks.create";
    case "milestones":
      return "projects.update";
  }
}

function validateCommon(rows: string[][], entity: ImportEntity): ImportPreviewResult {
  if (rows.length < 2) {
    return {
      rows: [{ row: 0, status: "error", summary: "The file needs a header row and at least one data row.", error: "Empty file" }],
      validCount: 0,
      errorCount: 1,
    };
  }

  const [header, ...dataRows] = rows;
  const aliases = aliasesFor(entity);
  const results: ImportRowResult[] = [];

  dataRows.forEach((row, index) => {
    const mapped = mapRow(header, row, aliases);
    const rowNumber = index + 2;

    const parsed =
      entity === "clients"
        ? clientSchema.safeParse({ ...mapped, status: (mapped.status || "active").toLowerCase() })
        : entity === "projects"
          ? projectImportSchema.safeParse(mapped)
          : entity === "tasks"
            ? taskImportSchema.safeParse(mapped)
            : milestoneImportSchema.safeParse(mapped);

    if (!parsed.success) {
      results.push({
        row: rowNumber,
        status: "error",
        summary: row.join(", "),
        error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid row.",
      });
    } else {
      const summary =
        entity === "clients"
          ? (parsed.data as z.infer<typeof clientSchema>).company_name
          : entity === "projects"
            ? (parsed.data as z.infer<typeof projectImportSchema>).name
            : entity === "tasks"
              ? (parsed.data as z.infer<typeof taskImportSchema>).title
              : (parsed.data as z.infer<typeof milestoneImportSchema>).title;
      results.push({ row: rowNumber, status: "valid", summary });
    }
  });

  return {
    rows: results,
    validCount: results.filter((result) => result.status === "valid").length,
    errorCount: results.filter((result) => result.status === "error").length,
  };
}

export async function previewImport(
  entity: ImportEntity,
  source: string | File,
): Promise<ImportPreviewResult | { error: string }> {
  await requirePermission(requiredPermissionFor(entity));
  return validateCommon(await parseSource(source), entity);
}

export async function commitImport(
  entity: ImportEntity,
  source: string | File,
): Promise<ImportCommitResult | { error: string }> {
  const actor = await requirePermission(requiredPermissionFor(entity));

  const rows = await parseSource(source);
  const preview = validateCommon(rows, entity);
  const [header, ...dataRows] = rows;
  const aliases = aliasesFor(entity);

  let created = 0;
  let skipped = 0;
  const errors: ImportRowResult[] = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const result = preview.rows[index];
    if (result?.status !== "valid") {
      if (result?.status === "error") errors.push(result);
      continue;
    }

    const mapped = mapRow(header, dataRows[index], aliases);

    try {
      switch (entity) {
        case "clients": {
          const client = await ClientsService.create({
            company_name: mapped.company_name,
            contact_name: mapped.contact_name || null,
            email: mapped.email || null,
            phone: mapped.phone || null,
            address: mapped.address || null,
            country: null,
            city: null,
            website: null,
            notes: null,
            logo: null,
            status: (mapped.status || "active").toLowerCase(),
            intermediary_id: null,
            deleted_at: null,
            is_active: true,
            created_by: actor.id,
            updated_by: actor.id,
          });

          await ActivityService.log({
            user_id: actor.id,
            action: "created_client",
            entity: "Client",
            entity_id: client.id,
            new_value: { company_name: client.company_name, imported: true },
          });
          await publish({
            type: "client.created",
            payload: { clientId: client.id, companyName: client.company_name, actorId: actor.id, imported: true },
          });
          break;
        }

        case "projects": {
          const client = await ClientsService.findByEmailOrCompany(mapped.client);
          if (!client) {
            throw new Error(`Client "${mapped.client}" not found. Import the clients file first.`);
          }

          const project = await ProjectsService.create({
            name: mapped.name,
            code: null,
            description: null,
            client_id: client.id,
            intermediary_id: null,
            status: mapped.status,
            priority: mapped.priority,
            estimated_start_date: mapped.estimated_start || null,
            estimated_end_date: mapped.estimated_end || null,
            real_start_date: null,
            real_end_date: null,
            estimated_hours: mapped.estimated_hours ? Number(mapped.estimated_hours) : 0,
            worked_hours: 0,
            completion_percentage: 0,
            budget: null,
            visibility: "Internal",
            notes: null,
            deleted_at: null,
            is_active: true,
            created_by: actor.id,
            updated_by: actor.id,
          });

          await ActivityService.log({
            user_id: actor.id,
            action: "created_project",
            entity: "Project",
            entity_id: project.id,
            new_value: { name: project.name, imported: true },
          });
          break;
        }

        case "tasks": {
          const project = await ProjectsService.findByName(mapped.project);
          if (!project) {
            throw new Error(`Project "${mapped.project}" not found. Import the projects file first.`);
          }

          const task = await TasksService.create({
            project_id: project.id,
            parent_task_id: null,
            milestone_id: null,
            title: mapped.title,
            description: null,
            assigned_to: null,
            status: mapped.status,
            priority: mapped.priority,
            estimated_hours: mapped.estimated_hours ? Number(mapped.estimated_hours) : 0,
            worked_hours: 0,
            estimated_start: null,
            estimated_end: mapped.estimated_end || null,
            real_start: null,
            real_end: null,
            completion_percentage: 0,
            position: 0,
            weight: 1,
            task_type: "Feature",
            deleted_at: null,
            is_active: true,
            created_by: actor.id,
            updated_by: actor.id,
          });

          await ActivityService.log({
            user_id: actor.id,
            action: "created_task",
            entity: "Task",
            entity_id: task.id,
            new_value: { title: task.title, project_id: project.id, imported: true },
          });
          break;
        }

        case "milestones": {
          const project = await ProjectsService.findByName(mapped.project);
          if (!project) {
            throw new Error(`Project "${mapped.project}" not found. Import the projects file first.`);
          }

          const milestone = await MilestonesService.create({
            project_id: project.id,
            title: mapped.title,
            description: null,
            estimated_date: mapped.estimated_date,
            status: mapped.status || "Pending",
            completion_percentage: 0,
            sort_order: 0,
            created_by: actor.id,
            updated_by: actor.id,
            deleted_at: null,
            is_active: true,
          });

          await ActivityService.log({
            user_id: actor.id,
            action: "created_milestone",
            entity: "Milestone",
            entity_id: milestone.id,
            new_value: { title: milestone.title, project_id: project.id, imported: true },
          });
          break;
        }
      }

      created += 1;
    } catch (err) {
      skipped += 1;
      errors.push({
        row: index + 2,
        status: "error",
        summary: mapped.title ?? mapped.name ?? mapped.company_name ?? "",
        error: err instanceof Error ? err.message : "Insert failed.",
      });
    }
  }

  if (created > 0) {
    await ActivityService.log({
      user_id: actor.id,
      action: "imported_data",
      entity: entity === "clients" ? "Client" : entity === "projects" ? "Project" : entity === "tasks" ? "Task" : "Milestone",
      new_value: { entity, created, skipped },
    });

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
  }

  return { created, skipped, errors };
}
