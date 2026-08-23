"use client";

import { useState } from "react";
import { createTag, updateTag, deleteTag } from "@/actions/tags";
import { Button } from "@/components/ui/button";
interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

const TAG_COLORS = [
  "#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

export function TagsTable({ tags }: { tags: Tag[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");

  function resetForm() {
    setIsCreating(false);
    setEditingId(null);
    setName("");
    setColor("#3B82F6");
  }

  return (
    <div className="space-y-4">
      {!isCreating && (
        <Button onClick={() => setIsCreating(true)} className="text-body-sm">
          + New Tag
        </Button>
      )}

      {(isCreating || editingId) && (
        <form
          action={async (formData) => {
            if (editingId) {
              formData.append("id", editingId);
              await updateTag(formData);
            } else {
              await createTag(formData);
            }
            resetForm();
          }}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-surface-card p-4"
        >
          <div className="flex-1 min-w-[150px]">
            <label className="mb-1 block text-caption-uppercase text-muted-soft">Name</label>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name"
              required
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-body-strong placeholder:text-muted-soft focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption-uppercase text-muted-soft">Color</label>
            <div className="flex gap-1.5">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-colors ${
                    color === c ? "border-ink scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="text-body-sm">
              {editingId ? "Update" : "Create"}
            </Button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-3 py-2 text-body-sm text-muted hover:text-body-strong"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {tags.length === 0 ? (
        <p className="py-8 text-center text-body-sm text-muted">
          No tags yet. Create your first tag to categorize projects and tasks.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-3 text-caption-uppercase text-muted-soft">Tag</th>
                <th className="px-4 py-3 text-caption-uppercase text-muted-soft">Created</th>
                <th className="px-4 py-3 text-caption-uppercase text-muted-soft">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b border-hairline-soft hover:bg-surface-card/50">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption-uppercase font-semibold border"
                      style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-muted">
                    {new Date(tag.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(tag.id);
                          setName(tag.name);
                          setColor(tag.color);
                          setIsCreating(false);
                        }}
                        className="text-body-sm text-muted hover:text-body-strong"
                      >
                        Edit
                      </button>
                      <form
                        action={async (formData) => {
                          formData.append("id", tag.id);
                          await deleteTag(formData);
                        }}
                      >
                        <button type="submit" className="text-body-sm text-error hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
