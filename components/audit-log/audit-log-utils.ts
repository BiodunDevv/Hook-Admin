import {
  Boxes,
  Building2,
  ClipboardList,
  Landmark,
  MapPin,
  Package,
  Shield,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export function humanize(value?: string) {
  return String(value || "Not set").replaceAll("_", " ").replaceAll(".", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function dateTime(value?: string) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function dayLabel(value?: string) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const entityMeta: Record<string, { icon: LucideIcon; label: string }> = {
  marketassociate: { icon: Users, label: "Market Associate" },
  marketassociate_assignment: { icon: Store, label: "Market Assignment" },
  staff: { icon: UserCog, label: "Staff" },
  partner: { icon: Building2, label: "Hook Partner" },
  role: { icon: Shield, label: "Role" },
  state: { icon: Landmark, label: "Operation State" },
  city: { icon: MapPin, label: "City" },
  zone: { icon: MapPin, label: "Zone" },
  hub: { icon: Boxes, label: "Dispatch Hub" },
  market: { icon: Store, label: "Market" },
  product: { icon: Package, label: "Product" },
  public_id_counter: { icon: ClipboardList, label: "ID Counter" },
};

export function entityMetaFor(entityType: string) {
  return entityMeta[entityType] || { icon: ClipboardList, label: humanize(entityType) };
}

export function actionIntent(action: string): "success" | "warning" | "danger" | "neutral" {
  const value = action.toLowerCase();
  if (value.includes("created") || value.includes("active") || value.includes("resent") || value.includes("restored")) return "success";
  if (value.includes("suspended") || value.includes("cancelled") || value.includes("archived") || value.includes("rejected") || value.includes("ended") || value.includes("disabled")) return "danger";
  if (value.includes("updated") || value.includes("paused") || value.includes("repaired")) return "warning";
  return "neutral";
}
