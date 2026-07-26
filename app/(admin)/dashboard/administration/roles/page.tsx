import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";

export default function RolesPage() {
  return (
    <PlatformDirectoryPage
      title="Roles"
      description="Configure live staff permissions. Authorization changes take effect immediately."
      endpoint="/admin/roles"
      detailBase="/dashboard/administration/roles"
      permissionLabel="role administration"
      fields={[
        { key: "name", label: "Role name", required: true },
        { key: "key", label: "Role key", required: true },
        { key: "description", label: "Description", required: true },
        { key: "permissionKeys", label: "Permission keys (comma-separated)", type: "id-list", required: true },
        { key: "defaultScopeType", label: "Default scope: global, multi_state, single_state, hub, or self", required: true },
      ]}
      columns={[
        { key: "key", label: "Key" },
        { key: "description", label: "Description" },
        { key: "permissionKeys", label: "Permissions" },
      ]}
    />
  );
}
