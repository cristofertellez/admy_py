import { requirePermission } from "@/lib/auth";
import { FilesService } from "@/features/files";
import { FilesTable } from "./files-table";

export const metadata = { title: "Files" };

export default async function FilesPage() {
  await requirePermission("files.download");
  const { data: files } = await FilesService.list({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <h1 className="text-display-sm text-ink">Files</h1>
      <FilesTable files={files} />
    </div>
  );
}
