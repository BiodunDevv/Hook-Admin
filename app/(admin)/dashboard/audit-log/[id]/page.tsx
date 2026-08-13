import { PlatformDetailPage } from "@/components/platform/PlatformDetailPage";

export default function AuditDetailPage() {
  return <PlatformDetailPage title="Audit event details" endpoint="/admin/audit-logs" />;
}
