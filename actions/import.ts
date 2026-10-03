"use server";

import { requirePermission } from "@/lib/auth";
import { ActivityService } from "@/services/activity.service";
import { ClientsService } from "@/features/clients";
import { ProjectsService } from "@/features/projects";
import { publish } from "@/lib/events/bus";
import { clientSchema } from "@/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Épica 17 (17.10) — CSV import for clients and projects. The flow is
// two-phase: `previewCsvImport` validates every row without writing and
// returns a detailed report; `commitCsvImport` re-validates and inserts
// only the rows that pass.

export type ImportEntity = "clients" | "projects";

export interface ImportRowResult {
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

function validateCommon(rows: string[][], entity: ImportEntity): ImportPreviewResult {
  if (rows.length < 2) {
    return {
      rows: [{ row: 0, status: "error", summary: "The file needs a header row and at least one data row.", error: "Empty file" }],
      validCount: 0,
      errorCount: 1,
    };
  }

  const [header, ...dataRows] = rows;
  const aliases = entity === "clients" ? CLIENT_HEADER_ALIASES : PROJECT_HEADER_ALIASES;
  const results: ImportRowResult[] = [];

  dataRows.forEach((row, index) => {
    const mapped = mapRow(header, row, aliases);
    const rowNumber = index + 2;

    if (entity === "clients") {
      const normalized = { ...mapped, status: (mapped.status || "active").toLowerCase() };
      const parsed = clientSchema.safeParse(normalized);
      if (!parsed.success) {
        results.push({
          row: rowNumber,
          status: "error",
          summary: row.join(", "),
          error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid row.",
        });
      } else {
        results.push({ row: rowNumber, status: "valid", summary: parsed.data.company_name });
      }
    } else {
      const parsed = projectImportSchema.safeParse(mapped);
      if (!parsed.success) {
        results.push({
          row: rowNumber,
          status: "error",
          summary: row.join(", "),
          error: Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Invalid row.",
        });
      } else {
        results.push({ row: rowNumber, status: "valid", summary: parsed.data.name });
      }
    }
  });

  return {
    rows: results,
    validCount: results.filter((result) => result.status === "valid").length,
    errorCount: results.filter((result) => result.status === "error").length,
  };
}

export async function previewCsvImport(
  entity: ImportEntity,
  csv: string,
): Promise<ImportPreviewResult | { error: string }> {
  await requirePermission(entity === "clients" ? "clients.create" : "projects.create");
  return validateCommon(parseCsv(csv), entity);
}

export async function commitCsvImport(
  entity: ImportEntity,
  csv: string,
): Promise<ImportCommitResult | { error: string }> {
  const actor = await requirePermission(entity === "clients" ? "clients.create" : "projects.create");

  const rows = parseCsv(csv);
  const preview = validateCommon(rows, entity);
  const [header, ...dataRows] = rows;
  const aliases = entity === "clients" ? CLIENT_HEADER_ALIASES : PROJECT_HEADER_ALIASES;

  let created = 0;
  let skipped = 0;
  const errors: ImportRowResult[] = [];

  if (entity === "clients") {
    for (let index = 0; index < dataRows.length; index += 1) {
      const result = preview.rows[index];
      if (result?.status !== "valid") {
        if (result?.status === "error") errors.push(result);
        continue;
      }

      const mapped = mapRow(header, dataRows[index], aliases);
      try {
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
        created += 1;
      } catch (err) {
        skipped += 1;
        errors.push({
          row: index + 2,
          status: "error",
          summary: mapped.company_name ?? "",
          error: err instanceof Error ? err.message : "Insert failed.",
        });
      }
    }
  } else {
    for (let index = 0; index < dataRows.length; index += 1) {
      const result = preview.rows[index];
      if (result?.status !== "valid") {
        if (result?.status === "error") errors.push(result);
        continue;
      }

      const mapped = mapRow(header, dataRows[index], aliases);
      try {
        const client = await ClientsService.findByEmailOrCompany(mapped.client);
        if (!client) {
          skipped += 1;
          errors.push({
            row: index + 2,
            status: "error",
            summary: mapped.name,
            error: `Client "${mapped.client}" not found. Import the clients CSV first.`,
          });
          continue;
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
        created += 1;
      } catch (err) {
        skipped += 1;
        errors.push({
          row: index + 2,
          status: "error",
          summary: mapped.name ?? "",
          error: err instanceof Error ? err.message : "Insert failed.",
        });
      }
    }
  }

  await ActivityService.log({
    user_id: actor.id,
    action: "imported_data",
    entity: entity === "clients" ? "Client" : "Project",
    new_value: { entity, created, skipped },
  });

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");

  return { created, skipped, errors };
}
