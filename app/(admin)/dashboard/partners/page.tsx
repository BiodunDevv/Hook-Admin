import { PlatformDirectoryPage } from "@/components/platform/PlatformDirectoryPage";
export default function PartnersPage() {
  return <PlatformDirectoryPage title="Hook Partners" description="Manage authenticated Hook Partner locations and account status." endpoint="/admin/partners" detailBase="/dashboard/partners" permissionLabel="Partner operations" fields={[
    { key: "name", label: "Partner location", required: true }, { key: "firstName", label: "Contact first name", required: true },
    { key: "lastName", label: "Contact last name", required: true }, { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone", required: true },
    { key: "stateId", label: "Operation state", type: "select", optionsEndpoint: "/admin/states", required: true },
    { key: "cityId", label: "Operation city", type: "select", optionsEndpoint: "/admin/cities", dependsOn: "stateId", dependsOnKey: "stateId", required: true },
    { key: "address", label: "Address", required: true },
  ]} columns={[{ key: "name", label: "Partner" }, { key: "stateId", label: "State" }, { key: "cityId", label: "City" }]} />;
}
