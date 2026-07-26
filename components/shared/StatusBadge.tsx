import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColorMap: Record<string, string> = {
  // Order statuses
  Delivered: "bg-emerald-50 text-emerald-600 border-emerald-200",
  "In Transit": "bg-blue-50 text-blue-600 border-blue-200",
  Processing: "bg-zinc-100 text-zinc-500 border-zinc-200",
  Negotiating: "bg-purple-50 text-purple-600 border-purple-200",
  Pending: "bg-amber-50 text-amber-600 border-amber-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",

  // Payment statuses
  PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  UNPAID: "bg-red-50 text-red-600 border-red-200",

  // Delivery statuses
  "ON ROUTE": "bg-blue-50 text-blue-600 border-blue-200",
  "PICKING UP": "bg-amber-50 text-amber-600 border-amber-200",
  DELAYED: "bg-red-50 text-red-600 border-red-200",
  "QUALITY CHECK": "bg-purple-50 text-purple-600 border-purple-200",

  // Legacy partner tiers retained for historical records
  Platinum: "bg-indigo-50 text-indigo-600 border-indigo-200",
  Gold: "bg-amber-50 text-amber-600 border-amber-200",
  Silver: "bg-zinc-100 text-zinc-500 border-zinc-200",

  // Runner and legacy logistics statuses
  Active: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Inactive: "bg-zinc-100 text-zinc-500 border-zinc-200",
  Online: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Offline: "bg-zinc-100 text-zinc-500 border-zinc-200",
  "On Delivery": "bg-blue-50 text-blue-600 border-blue-200",
  Available: "bg-emerald-50 text-emerald-600 border-emerald-200",
  "On Break": "bg-amber-50 text-amber-600 border-amber-200",

  // Legacy location statuses
  "Fully Operational": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Low Stock": "bg-amber-50 text-amber-600 border-amber-200",
  Maintenance: "bg-red-50 text-red-600 border-red-200",

  // Product/stock
  "In Stock": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Low Stock Alert": "bg-amber-50 text-amber-600 border-amber-200",
  "Out of Stock": "bg-red-50 text-red-600 border-red-200",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass =
    statusColorMap[status] ?? "bg-zinc-100 text-zinc-500 border-zinc-200";

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {status}
    </Badge>
  );
}
