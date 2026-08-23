import { requirePermission } from "@/lib/auth";
import { query } from "@/lib/turso/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/shared/card";
import { TagsTable } from "./tags-table";
import type { Metadata } from "next";

interface TagRow {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  await requirePermission("tasks.read");

  const tags = await query<TagRow>(
    `SELECT id, name, color, created_at FROM tags ORDER BY name`,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-ink">Tags</h1>
        <p className="mt-1 text-body-sm text-muted">
          Manage tags used to categorize projects and tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <p className="text-body-sm text-muted">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} total
          </p>
        </CardHeader>
        <CardContent>
          <TagsTable tags={tags.map((tag) => ({ ...tag, color: tag.color ?? "#3B82F6" }))} />
        </CardContent>
      </Card>
    </div>
  );
}
