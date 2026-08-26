"use client";

import { useState } from "react";
import { createTag, updateTag, deleteTag } from "@/actions/tags";
import { Button } from "@/components/ui/button";
import { TagChip } from "@/components/shared/tag-chip";
import { TAG_COLOR_OPTIONS } from "@/constants";

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

type Feedback = { type: "success" | "error"; message: string };

export function TagsTable({ tags }: { tags: Tag[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLOR_OPTIONS[0]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function resetForm() {
    setIsCreating(false);
    setEditingId(null);
    setName("");
    setColor(TAG_COLOR_OPTIONS[0]);
  }

  async function handleSave(formData: FormData) {
    const result = editingId ? await updateTag(formData) : await createTag(formData);
    if (result?.error) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setFeedback({
      type: "success",
      message: editingId ? "Tag updated." : "Tag created.",
    });
    resetForm();
  }

  async function handleDelete(tag: Tag) {
    if (
      !window.confirm(
        `Delete tag "${tag.name}"? It will be removed from all projects and tasks.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("id", tag.id);
    const result = await deleteTag(formData);
    if (result?.error) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    if (editingId === tag.id) resetForm();
    setFeedback({ type: "success", message: "Tag deleted." });
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={
            feedback.type === "error"
              ? "text-body-sm text-error"
              : "text-body-sm text-success"
          }
        >
          {feedback.message}
        </p>
      )}

      {!isCreating && !editingId && (
        <Button
          onClick={() => {
            setFeedback(null);
            setIsCreating(true);
          }}
          className="text-body-sm"
        >
          + New Tag
        </Button>
      )}

      {(isCreating || editingId) && (
        <form
          action={handleSave}
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
              maxLength={50}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-body-strong placeholder:text-muted-soft focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption-uppercase text-muted-soft">Color</label>
            <div className="flex gap-1.5" role="radiogroup" aria-label="Tag color">
              {TAG_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={`Color ${c}`}
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
              onClick={() => {
                resetForm();
                setFeedback(null);
              }}
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
                    <TagChip label={tag.name} color={tag.color} />
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
                          setFeedback(null);
                        }}
                        className="text-body-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="text-body-sm text-error hover:underline"
                      >
                        Delete
                      </button>
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
