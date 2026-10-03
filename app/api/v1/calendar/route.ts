import { withActor } from "@/lib/api/actor-context";
import { authenticateApiKey, isAuthFailure, apiError } from "@/lib/api/public-api";
import { MilestonesService } from "@/features/milestones";
import { query } from "@/lib/turso/client";
import { projectScope } from "@/lib/auth-scope";
import type { NextRequest } from "next/server";

// Épica 17 (17.4) — iCalendar feed with upcoming milestone deliveries and
// task due dates. Import the URL in Google Calendar ("From URL") or Outlook
// ("Subscribe from web") to keep external calendars in sync.

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toIcsDate(dateKey: string): string {
  return dateKey.replace(/-/g, "");
}

function buildVEvent(input: {
  uid: string;
  title: string;
  date: string;
  description: string;
}): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${input.uid}@admipy`,
    `DTSTAMP:${toIcsDate(new Date().toISOString().slice(0, 10))}T000000Z`,
    `DTSTART;VALUE=DATE:${toIcsDate(input.date)}`,
    `DTEND;VALUE=DATE:${toIcsDate(input.date)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    "END:VEVENT",
  ];
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (isAuthFailure(auth)) return auth;

  try {
    return await withActor(auth.profile, async () => {
      const scope = await projectScope("t.project_id");
      const [milestones, taskRows] = await Promise.all([
        MilestonesService.getUpcomingForScope(50),
        query<{ id: string; title: string; estimated_end: string; status: string; project_name: string }>(
          `SELECT t.id, t.title, t.estimated_end, t.status, p.name AS project_name
           FROM tasks t
           JOIN projects p ON p.id = t.project_id
           WHERE t.deleted_at IS NULL AND t.is_active = 1
             AND t.status NOT IN ('Completed', 'Cancelled')
             AND t.estimated_end IS NOT NULL
             AND t.estimated_end >= ?
             ${scope.sql ? `AND ${scope.sql}` : ""}`,
          [new Date().toISOString().slice(0, 10), ...scope.args],
        ),
      ]);

      const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AdmiPy//Milestones//EN",
        "CALSCALE:GREGORIAN",
      ];

      for (const milestone of milestones) {
        if (!milestone.estimated_date) continue;
        lines.push(
          ...buildVEvent({
            uid: `milestone-${milestone.id}`,
            title: `${milestone.title} — ${milestone.project_name}`,
            date: milestone.estimated_date,
            description: `Milestone delivery (${milestone.status}) of project ${milestone.project_name}.`,
          }),
        );
      }

      for (const task of taskRows) {
        lines.push(
          ...buildVEvent({
            uid: `task-${task.id}`,
            title: `Task due: ${task.title} — ${task.project_name}`,
            date: task.estimated_end,
            description: `Task due date (${task.status}).`,
          }),
        );
      }

      lines.push("END:VCALENDAR");

      return new Response(lines.join("\r\n"), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'inline; filename="admipy-calendar.ics"',
        },
      });
    });
  } catch (err) {
    console.error("[api/v1/calendar]", err instanceof Error ? err.message : err);
    return apiError(500, "Failed to build calendar feed.");
  }
}
