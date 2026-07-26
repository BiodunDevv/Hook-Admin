import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function StatesPage() { return <PlatformDirectoryPage title="Operation States" description="Manage state-level Hook configuration." endpoint="/admin/states" detailBase="/dashboard/administration/states" permissionLabel="state administration" fields={[
  { key: "name", label: "State name", required: true }, { key: "code", label: "State code", required: true },
]} columns={[{ key: "name", label: "State" }, { key: "code", label: "Code" }, { key: "deliveryPromiseHours", label: "Promise hours" }]} />; }
