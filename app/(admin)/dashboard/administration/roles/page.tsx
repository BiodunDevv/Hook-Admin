import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";

export default function RolesPage() {
  return (
    <PlatformDirectoryPage
      title="Roles"
      description="Configure live staff permissions. Authorization changes take effect immediately."
      endpoint="/admin/roles"
      detailBase="/dashboard/administration/roles"
      permissionLabel="role administration"
      managePermission="roles.manage"
      fields={[
        { key: "name", label: "Role name", required: true },
        { key: "key", label: "Role key", required: true },
        { key: "description", label: "Description", required: true },
        {
          key: "permissionKeys",
          label: "Permissions",
          type: "multi-select",
          optionsEndpoint: "/admin/permissions",
          optionValueKey: "key",
          optionLabelKey: "key",
          required: true,
        },
        {
          key: "defaultScopeType",
          label: "Default scope",
          type: "select",
          options: [
            { value: "global", label: "Global" },
            { value: "multi_state", label: "Multiple states" },
            { value: "single_state", label: "Single state" },
            { value: "hub", label: "Dispatch Hub" },
            { value: "self", label: "Self" },
          ],
          required: true,
        },
      ]}
      columns={[
        { key: "key", label: "Key" },
        { key: "description", label: "Description" },
        { key: "permissionKeys", label: "Permissions" },
      ]}
    />
  );
}
