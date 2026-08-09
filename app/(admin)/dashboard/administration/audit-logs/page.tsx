import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function AuditLogsPage() { return <PlatformDirectoryPage title="Audit Logs" description="Append-only security and operational change history." endpoint="/admin/audit-logs" detailBase="/dashboard/administration/audit-logs" permissionLabel="audit access" fields={[]} columns={[
  { key: "action", label: "Action" }, { key: "entityType", label: "Entity" }, { key: "actorPublicId", label: "Actor" }, { key: "createdAt", label: "Created" },
]} />; }
