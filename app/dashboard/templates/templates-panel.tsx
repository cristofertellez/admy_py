"use client";

import { useState, useTransition } from "react";
import { createTemplate, updateTemplate, deleteTemplate } from "@/actions/templates";
import { TemplateActionState } from "@/schemas/template";
import { Input } from "@/components/forms/input";
import { FormSelect } from "@/components/forms/form-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { TEMPLATE_ENTITY_TYPES } from "@/features/templates/templates.constants";
import type { Template, TemplateEntityType } from "@/features/templates/templates.types";

interface TemplatesPanelProps {
  templates: Template[];
}

interface FormState {
  id: string | null;
  name: string;
  description: string;
  entity_type: TemplateEntityType;
  payload: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  description: "",
  entity_type: "project",
  payload: '{\n  "notes": ""\n}',
};

const ENTITY_LABEL: Record<TemplateEntityType, string> = {
  project: "Project",
  task: "Task",
  milestone: "Milestone",
  report: "Report",
};

export function TemplatesPanel({ templates }: TemplatesPanelProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<TemplateActionState>(undefined);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing(true);
    setFeedback(undefined);
  }

  function openEdit(template: Template) {
    setForm({
      id: template.id,
      name: template.name,
      description: template.description ?? "",
      entity_type: template.entity_type,
      payload: JSON.stringify(template.payload, null, 2),
    });
    setEditing(true);
    setFeedback(undefined);
  }

  function parsePayload(raw: string): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  function handleSave() {
    const payload = parsePayload(form.payload);
    if (!payload) {
      setFeedback({ error: "Template payload must be a valid JSON object." });
      return;
    }

    const input = {
      name: form.name,
      description: form.description,
      entity_type: form.entity_type,
      payload,
    };

    startTransition(async () => {
      const result = form.id
        ? await updateTemplate(form.id, input)
        : await createTemplate(input);
      setFeedback(result);
      if (result.success) {
        setEditing(false);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteTemplate(id);
      setFeedback(result);
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={
            "rounded-md px-4 py-3 text-body-sm " +
            ("success" in feedback && feedback.success
              ? "bg-success/10 text-success"
              : "bg-error/10 text-error")
          }
        >
          {"success" in feedback && feedback.success ? feedback.success : ("error" in feedback && feedback.error) || ""}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Edit Template" : "New Template"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editing ? (
            <div className="flex justify-end">
              <Button onClick={openNew}>New Template</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  placeholder="Template name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <FormSelect
                  label=""
                  value={form.entity_type}
                  onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value as TemplateEntityType }))}
                  options={TEMPLATE_ENTITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>
              <Input
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm font-medium text-body-strong">Payload (JSON)</label>
                <textarea
                  value={form.payload}
                  onChange={(e) => setForm((f) => ({ ...f, payload: e.target.value }))}
                  rows={6}
                  className="w-full rounded-md border border-hairline bg-surface-card px-3 py-2 font-mono text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button disabled={isPending} onClick={handleSave}>
                  {isPending ? "Saving..." : form.id ? "Save Changes" : "Create Template"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {templates.length === 0 && !editing ? (
          <Card>
            <CardContent>
              <p className="text-body-sm text-muted">No templates yet. Create your first template to get started.</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>{template.name}</CardTitle>
                  <Badge variant="default">{ENTITY_LABEL[template.entity_type]}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(template.id, template.name)}>
                    Delete
                  </Button>
                </div>
              </CardHeader>
              {template.description && (
                <CardContent>
                  <p className="text-body-sm text-muted">{template.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}