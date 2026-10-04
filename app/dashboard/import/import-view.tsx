"use client";

import { useState, useTransition } from "react";
import {
  previewImport,
  commitImport,
  type ImportEntity,
  type ImportPreviewResult,
  type ImportCommitResult,
} from "@/actions/import";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";

const SAMPLE_CSV: Record<ImportEntity, string> = {
  clients: "company_name,contact_name,email,phone,status\nAcme Corp,Jane Doe,jane@acme.com,+1 555 0100,active",
  projects:
    "name,client,status,priority,estimated_hours,estimated_start,estimated_end\nNew website,Acme Corp,In Progress,High,80,2026-01-05,2026-03-01",
  tasks: "project,title,status,priority,estimated_hours,due_date\nNew website,Design mockups,Pending,High,12,2026-01-20",
  milestones: "project,title,estimated_date,status\nNew website,Visual design approved,2026-01-25,Pending",
};

const HEADERS: Record<ImportEntity, string> = {
  clients: "company_name,contact_name,email,phone,status",
  projects: "name,client,status,priority,estimated_hours,estimated_start,estimated_end",
  tasks: "project,title,status,priority,estimated_hours,due_date",
  milestones: "project,title,estimated_date,status",
};

/**
 * Épica 17 (17.10) — two-phase data import: dry-run validation report and
 * a commit step that inserts only the valid rows. Sources: pasted CSV text
 * or an uploaded .csv / .xlsx file (parsed server-side).
 */
export function ImportView() {
  const [entity, setEntity] = useState<ImportEntity>("clients");
  const [csv, setCsv] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetResults() {
    setPreview(null);
    setCommitResult(null);
  }

  function handleFile(next: File | null) {
    setFile(next);
    setCsv("");
    resetResults();
  }

  function handlePreview() {
    startTransition(async () => {
      const result = await previewImport(entity, file ?? csv);
      if ("error" in result) {
        setError(result.error);
        setPreview(null);
        return;
      }
      setError(null);
      setPreview(result);
      setCommitResult(null);
    });
  }

  function handleCommit() {
    startTransition(async () => {
      const result = await commitImport(entity, file ?? csv);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setCommitResult(result);
    });
  }

  const inputClasses =
    "h-10 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-body-sm text-body-strong focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  const hasSource = file !== null || csv.trim().length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>1. Upload data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="import-entity" className="mb-1 block text-caption text-muted">
              Entity
            </label>
            <select
              id="import-entity"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value as ImportEntity);
                handleFile(null);
              }}
              className={inputClasses}
            >
              <option value="clients">Clients</option>
              <option value="projects">Projects (requires existing clients)</option>
              <option value="tasks">Tasks (requires existing projects)</option>
              <option value="milestones">Milestones (requires existing projects)</option>
            </select>
          </div>

          <div>
            <label htmlFor="import-file" className="mb-1 block text-caption text-muted">
              CSV or Excel file
            </label>
            <input
              id="import-file"
              type="file"
              accept=".csv,.xlsx,text/csv"
              onChange={(e) => {
                const next = e.target.files?.[0] ?? null;
                if (next) handleFile(next);
              }}
              className="text-body-sm text-muted"
            />
            {file && (
              <p className="mt-1 text-caption text-body-strong">
                {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                <button
                  type="button"
                  onClick={() => handleFile(null)}
                  className="ml-2 text-primary hover:underline"
                >
                  Remove
                </button>
              </p>
            )}
            <p className="mt-1 text-caption text-muted">
              Expected header:{" "}
              <code className="text-body-strong">{HEADERS[entity]}</code>
            </p>
          </div>

          <div>
            <label htmlFor="import-csv" className="mb-1 block text-caption text-muted">
              Or paste CSV content
            </label>
            <textarea
              id="import-csv"
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setFile(null);
                resetResults();
              }}
              rows={8}
              className="w-full rounded-md border border-hairline bg-surface-card p-3 font-mono text-caption text-body-strong focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={SAMPLE_CSV[entity]}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePreview} disabled={isPending || !hasSource}>
              {isPending ? "Working…" : "Validate"}
            </Button>
            {preview && preview.validCount > 0 && (
              <Button variant="outline" onClick={handleCommit} disabled={isPending}>
                Import {preview.validCount} valid row{preview.validCount === 1 ? "" : "s"}
              </Button>
            )}
          </div>
          {error && (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Validation report</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!preview && !commitResult && (
            <p className="text-body-sm text-muted-soft">
              Nothing validated yet. Upload or paste data and press Validate.
            </p>
          )}

          {preview && !commitResult && (
            <>
              <div className="flex gap-2">
                <Badge variant="success">{preview.validCount} valid</Badge>
                <Badge variant={preview.errorCount > 0 ? "error" : "default"}>{preview.errorCount} errors</Badge>
              </div>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {preview.rows.map((row) => (
                  <li
                    key={row.row}
                    className={`rounded-md border p-2 text-caption ${
                      row.status === "valid" ? "border-success/40 text-success" : "border-error/40 text-error"
                    }`}
                  >
                    Row {row.row}: {row.summary}
                    {row.error ? ` — ${row.error}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}

          {commitResult && (
            <>
              <div className="flex gap-2">
                <Badge variant="success">{commitResult.created} imported</Badge>
                {commitResult.skipped > 0 && <Badge variant="error">{commitResult.skipped} skipped</Badge>}
              </div>
              <p className="text-body-sm text-muted">
                Import finished. The created records appear in their module with full audit history.
              </p>
              {commitResult.errors.length > 0 && (
                <ul className="max-h-60 space-y-1 overflow-y-auto">
                  {commitResult.errors.map((row) => (
                    <li key={row.row} className="rounded-md border border-error/40 p-2 text-caption text-error">
                      Row {row.row}: {row.summary} — {row.error}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
