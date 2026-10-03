"use client";

import { useState, useTransition } from "react";
import { previewCsvImport, commitCsvImport, type ImportEntity, type ImportPreviewResult, type ImportCommitResult } from "@/actions/import";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/ui/button";

const SAMPLE_CSV: Record<ImportEntity, string> = {
  clients: "company_name,contact_name,email,phone,status\nAcme Corp,Jane Doe,jane@acme.com,+1 555 0100,active",
  projects: "name,client,status,priority,estimated_hours,estimated_start,estimated_end\nNew website,Acme Corp,In Progress,High,80,2026-01-05,2026-03-01",
};

/**
 * Épica 17 (17.10) — two-phase CSV import: dry-run validation report and
 * a commit step that inserts only the valid rows.
 */
export function ImportView() {
  const [entity, setEntity] = useState<ImportEntity>("clients");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result ?? ""));
      setPreview(null);
      setCommitResult(null);
    };
    reader.readAsText(file);
  }

  function handlePreview() {
    startTransition(async () => {
      const result = await previewCsvImport(entity, csv);
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
      const result = await commitCsvImport(entity, csv);
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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>1. Upload CSV</CardTitle></CardHeader>
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
                setPreview(null);
                setCommitResult(null);
              }}
              className={inputClasses}
            >
              <option value="clients">Clients</option>
              <option value="projects">Projects (requires existing clients)</option>
            </select>
          </div>

          <div>
            <label htmlFor="import-file" className="mb-1 block text-caption text-muted">
              CSV file
            </label>
            <input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="text-body-sm text-muted"
            />
            <p className="mt-1 text-caption text-muted">
              Expected header:{" "}
              <code className="text-body-strong">
                {entity === "clients"
                  ? "company_name,contact_name,email,phone,status"
                  : "name,client,status,priority,estimated_hours,estimated_start,estimated_end"}
              </code>
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
                setPreview(null);
                setCommitResult(null);
              }}
              rows={8}
              className="w-full rounded-md border border-hairline bg-surface-card p-3 font-mono text-caption text-body-strong focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={SAMPLE_CSV[entity]}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePreview} disabled={isPending || csv.trim().length === 0}>
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
              Nothing validated yet. Upload or paste a CSV and press Validate.
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
                Import finished. The created records appear in {entity === "clients" ? "Clients" : "Projects"} with
                full audit history.
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
