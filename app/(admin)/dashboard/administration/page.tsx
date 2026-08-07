import Link from "next/link";
import { Hash, Map, MapPin, Shield, ScrollText, Users, Waypoints, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

const links = [
  ["Staff", "/dashboard/staff", Users], ["Roles and permissions", "/dashboard/administration/roles", Shield],
  ["Operation States", "/dashboard/administration/states", Map], ["Operation Cities", "/dashboard/administration/cities", MapPin],
  ["Service Zones", "/dashboard/administration/zones", Waypoints], ["Delivery Coverage & Fees", "/dashboard/administration/delivery", Truck], ["Audit Logs", "/dashboard/administration/audit-logs", ScrollText],
  ["Public ID counters", "/dashboard/administration/public-ids", Hash],
] as const;

export default function AdministrationPage() {
  return <div className="p-2 md:p-4"><PageHeader title="Administration" description="Identity, access, geography, and platform governance." />
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{links.map(([label, href, Icon]) => <Link key={href} href={href}><Card className="rounded-lg shadow-none transition-colors hover:bg-muted/40"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-md bg-hook/20"><Icon size={18} /></span><span className="font-medium">{label}</span></CardContent></Card></Link>)}</div>
  </div>;
}
