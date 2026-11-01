import {
  Banknote,
  Boxes,
  Building2,
  ClipboardList,
  KeyRound,
  Landmark,
  MapPin,
  Megaphone,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Tag,
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
  account: { icon: KeyRound, label: "Account" },
  order: { icon: ShoppingCart, label: "Order" },
  payment: { icon: Banknote, label: "Payment" },
  refund_request: { icon: Banknote, label: "Refund" },
  category: { icon: Tag, label: "Category" },
  coupon: { icon: Tag, label: "Coupon" },
  banner: { icon: Megaphone, label: "Banner" },
  broadcast: { icon: Megaphone, label: "Broadcast" },
  commerce_settings: { icon: Settings, label: "Commerce Settings" },
  operation_state: { icon: Landmark, label: "Operation State" },
};

export function entityMetaFor(entityType: string) {
  return entityMeta[entityType] || { icon: ClipboardList, label: humanize(entityType) };
}

export function actionIntent(action: string): "success" | "warning" | "danger" | "neutral" {
  const value = action.toLowerCase();
  if (/(failed|suspend|cancel|archiv|reject|ended|disabled|delete|remov|revoke|declin)/.test(value)) return "danger";
  if (/(creat|activ|resent|restor|approv|sign_in|enabled|publish|confirm)/.test(value)) return "success";
  if (/(updat|paus|repair|chang|edit|reorder|assign)/.test(value)) return "warning";
  return "neutral";
}

export const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

export type AuditRange = (typeof RANGE_OPTIONS)[number]["value"];

/** ISO start of the chosen range, or undefined for "all time". */
export function rangeStart(range: AuditRange): string | undefined {
  if (range === "all") return undefined;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  return start.toISOString();
}
