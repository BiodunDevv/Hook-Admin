import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";

export default function MarketsPage() {
  return <PlatformDirectoryPage title="Markets" description="Manage the physical markets in Hook operating states." endpoint="/admin/markets" detailBase="/dashboard/markets" permissionLabel="market operations" fields={[
    { key: "name", label: "Market name", required: true }, { key: "stateId", label: "Operation State ID", required: true },
    { key: "cityId", label: "Operation City ID", required: true }, { key: "address", label: "Address", required: true },
  ]} columns={[{ key: "name", label: "Market" }, { key: "stateId", label: "State" }, { key: "hubId", label: "Preferred Hub" }]} />;
}
