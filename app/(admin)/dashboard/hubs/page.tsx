import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function HubsPage() {
  return (
    <PlatformDirectoryPage
      title="Dispatch Hubs"
      description="Configure Hook's state and city dispatch network."
      endpoint="/admin/hubs"
      detailBase="/dashboard/hubs"
      permissionLabel="Hub operations"
      managePermission="hubs.manage"
      lifecyclePermission="hubs.manage"
      lifecyclePaths={{ activate: "activate", deactivate: "deactivate" }}
      assignment={{
        label: "Assign Markets",
        permission: "hubs.assign_markets",
        pathSuffix: "assign-markets",
        payloadKey: "marketIds",
        field: { key: "marketIds", label: "Markets", type: "multi-select", optionsEndpoint: "/admin/markets" },
      }}
      fields={[
        { key: "name", label: "Hub name", required: true },
        {
          key: "stateId",
          label: "Operation state",
          type: "select",
          optionsEndpoint: "/admin/states",
          required: true,
        },
        {
          key: "cityId",
          label: "Operation city",
          type: "select",
          optionsEndpoint: "/admin/cities",
          dependsOn: "stateId",
          dependsOnKey: "stateId",
          required: true,
        },
        { key: "address", label: "Address", required: true },
      ]}
      columns={[
        { key: "name", label: "Hub" },
        { key: "stateId", label: "State" },
        { key: "cityId", label: "City" },
      ]}
    />
  );
}
