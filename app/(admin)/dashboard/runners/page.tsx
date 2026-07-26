import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function RunnersPage() {
  return <PlatformDirectoryPage title="Runners" description="Manage Runner identities, availability, scope, and Market assignments." endpoint="/admin/runners" detailBase="/dashboard/runners" permissionLabel="Runner operations" fields={[
    { key: "firstName", label: "First name", required: true }, { key: "lastName", label: "Last name", required: true },
    { key: "email", label: "Email", type: "email", required: true }, { key: "phone", label: "Phone", required: true },
    { key: "stateIds", label: "State IDs (comma-separated)", type: "id-list", required: true },
  ]} columns={[{ key: "publicId", label: "Runner" }, { key: "availability", label: "Availability" }]} />;
}
