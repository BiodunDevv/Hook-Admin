import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function HubsPage() {
  return <PlatformDirectoryPage title="Dispatch Hubs" description="Configure Hook's state and city dispatch network." endpoint="/admin/hubs" detailBase="/dashboard/hubs" permissionLabel="Hub operations" fields={[
    { key: "name", label: "Hub name", required: true },
    { key: "stateId", label: "Operation state", type: "select", optionsEndpoint: "/admin/states", required: true },
    { key: "cityId", label: "Operation city", type: "select", optionsEndpoint: "/admin/cities", dependsOn: "stateId", dependsOnKey: "stateId", required: true },
    { key: "address", label: "Address", required: true },
  ]} columns={[{ key: "name", label: "Hub" }, { key: "stateId", label: "State" }, { key: "cityId", label: "City" }]} />;
}
