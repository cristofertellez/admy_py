import JSZip from "jszip";
import { getUser, hasPermission } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { withActor } from "@/lib/api/actor-context";
import { query } from "@/lib/turso/client";
import { ActivityService } from "@/services/activity.service";
import { NextResponse } from "next/server";

// Épica 17 (17.11) — global export: a ZIP with CSV files of clients,
// projects, tasks, milestones, the activity log and the system settings.
// Restricted to full-access roles (Developer / Super Administrator).

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }
  if (!hasFullAccess(user.role) || !hasPermission(user, "reports.export")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    return await withActor(user, async () => {
      const [clients, projects, tasks, milestones, activity, settings] = await Promise.all([
        query<Record<string, unknown>>(
          `SELECT id, company_name, contact_name, email, phone, status, created_at
           FROM clients WHERE deleted_at IS NULL ORDER BY company_name`,
        ),
        query<Record<string, unknown>>(
          `SELECT id, name, status, priority, estimated_start_date, estimated_end_date,
                  estimated_hours, worked_hours, completion_percentage, created_at
           FROM projects WHERE deleted_at IS NULL ORDER BY name`,
        ),
        query<Record<string, unknown>>(
          `SELECT id, title, status, priority, assigned_to, estimated_end, completion_percentage, created_at
           FROM tasks WHERE deleted_at IS NULL ORDER BY created_at`,
        ),
        query<Record<string, unknown>>(
          `SELECT id, title, status, estimated_date, completed_date, completion_percentage, created_at
           FROM milestones WHERE deleted_at IS NULL ORDER BY estimated_date`,
        ),
        query<Record<string, unknown>>(
          `SELECT al.created_at, al.action, al.entity, al.entity_id, al.old_value, al.new_value,
                  u.email AS user_email
           FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
           ORDER BY al.created_at DESC LIMIT 5000`,
        ),
        query<Record<string, unknown>>(`SELECT key, value, description FROM settings ORDER BY key`),
      ]);

      const zip = new JSZip();
      const date = new Date().toISOString().slice(0, 10);
      zip.file("clients.csv", rowsToCsv(clients));
      zip.file("projects.csv", rowsToCsv(projects));
      zip.file("tasks.csv", rowsToCsv(tasks));
      zip.file("milestones.csv", rowsToCsv(milestones));
      zip.file("activity-log.csv", rowsToCsv(activity));
      zip.file("settings.csv", rowsToCsv(settings));
      zip.file(
        "README.txt",
        [
          "AdmiPy global export",
          `Generated at: ${new Date().toISOString()}`,
          "",
          "Contents: clients, projects, tasks, milestones, activity log (up to 5000 recent events) and settings.",
          "Deleted/archived records are excluded; soft-deleted entities are omitted.",
        ].join("\n"),
      );

      const content = await zip.generateAsync({ type: "uint8array" });

      await ActivityService.logAccessOnce({
        user_id: user.id,
        action: "exported_globals",
        entity: "Platform",
        new_value: { clients: clients.length, projects: projects.length, tasks: tasks.length },
      });

      return new NextResponse(new Uint8Array(content), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="admipy-export-${date}.zip"`,
        },
      });
    });
  } catch (err) {
    console.error("[export/global]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to build the global export." }, { status: 500 });
  }
}
