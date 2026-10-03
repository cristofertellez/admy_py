import { requirePermission, hasPermission } from "@/lib/auth";
import { hasFullAccess } from "@/lib/roles";
import { FilesService, FILE_CATEGORIES } from "@/features/files";
import { FilesTable, DeletedFilesTable } from "./files-table";

export const metadata = { title: "Files" };

export default async function FilesPage() {
  const user = await requirePermission("files.download");
  const { data: files } = await FilesService.list({ pageSize: 100 });
  const stats = await FilesService.getStats();
  const deletedFiles = hasFullAccess(user.role)
    ? (await FilesService.list({ pageSize: 50, showDeleted: true })).data
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-display-sm text-ink">Files</h1>
      <FilesTable
        files={files}
        stats={stats}
        categories={[...FILE_CATEGORIES]}
        canUpload={hasPermission(user, "files.upload")}
        canDelete={hasPermission(user, "files.delete")}
      />
      <DeletedFilesTable files={deletedFiles as never} />
    </div>
  );
}