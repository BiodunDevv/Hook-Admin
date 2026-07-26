import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function ZonesPage() { return <PlatformDirectoryPage title="Service Zones" description="Manage delivery eligibility boundaries and future logistics rules." endpoint="/admin/zones" detailBase="/dashboard/administration/zones" permissionLabel="zone administration" fields={[
  { key: "name", label: "Zone name", required: true }, { key: "code", label: "Zone code", required: true },
  { key: "stateId", label: "Operation state", type: "select", optionsEndpoint: "/admin/states", required: true },
  { key: "cityId", label: "Operation city", type: "select", optionsEndpoint: "/admin/cities", dependsOn: "stateId", dependsOnKey: "stateId", required: true },
]} columns={[{ key: "name", label: "Zone" }, { key: "cityId", label: "City" }, { key: "deliveryEligible", label: "Delivery eligible" }]} />; }
