import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";

export default function StaffPage() {
  return (
    <PlatformDirectoryPage
      title="Staff"
      description="Manage staff identities, live roles, and operational scope."
      endpoint="/admin/staff"
      detailBase="/dashboard/staff"
      permissionLabel="staff administration"
      fields={[
        { key: "firstName", label: "First name", required: true },
        { key: "lastName", label: "Last name", required: true },
        { key: "email", label: "Work email", type: "email", required: true },
        { key: "phone", label: "Phone", required: true },
        { key: "roleIds", label: "Role IDs (comma-separated)", type: "id-list", required: true },
        { key: "scopeType", label: "Operational scope", type: "select", required: true, options: [
          { value: "global", label: "Global" },
          { value: "multi_state", label: "Multiple states" },
          { value: "single_state", label: "Single state" },
          { value: "hub", label: "Dispatch Hub" },
        ] },
        { key: "stateIds", label: "State IDs (comma-separated)", type: "id-list" },
        { key: "hubIds", label: "Hub IDs (comma-separated)", type: "id-list" },
      ]}
      columns={[
        { key: "scopeType", label: "Scope" },
        { key: "stateIds", label: "States" },
        { key: "hubIds", label: "Hubs" },
      ]}
    />
  );
}
