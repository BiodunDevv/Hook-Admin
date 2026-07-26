import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function CitiesPage() { return <PlatformDirectoryPage title="Operation Cities" description="Manage cities inside configured states." endpoint="/admin/cities" detailBase="/dashboard/administration/cities" permissionLabel="city administration" fields={[
  { key: "name", label: "City name", required: true }, { key: "code", label: "City code", required: true },
  { key: "stateId", label: "Operation state", type: "select", optionsEndpoint: "/admin/states", required: true },
]} columns={[{ key: "name", label: "City" }, { key: "code", label: "Code" }, { key: "stateId", label: "State" }]} />; }
