"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Navigation, ArrowRight } from "lucide-react";
import { useApiQuery } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";
import { StateChip } from "@/components/operations/StateDropdown";
import { queryString } from "@/lib/admin-utils";

interface DriverRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isActive: boolean;
  operationalStateCode?: string;
  operationalStateName?: string;
}

interface DriversResponse {
  data?: DriverRow[];
  total?: number;
  stats?: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  "On Delivery": "text-amber-600 bg-amber-50 border-amber-200",
  "Picking Up": "text-blue-600 bg-blue-50 border-blue-200",
  "Quality Check": "text-purple-600 bg-purple-50 border-purple-200",
  Idle: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

interface DriversTableProps {
  activeTab: string;
  stateCode: string;
  onTabChange: (tab: string) => void;
}

export function DriversTable({ activeTab, stateCode, onTabChange }: DriversTableProps) {
  const path = `/admin/dispatch/drivers${queryString({ stateCode })}`;
  const { data, isLoading, error } = useApiQuery<DriverRow[] | DriversResponse>(["admin", "drivers", stateCode], path);
  const drivers = Array.isArray(data) ? data : data?.data || [];
  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";

  const filtered = drivers.filter((d) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return d.isActive;
    if (activeTab === "idle") return !d.isActive;
    return true;
  });

  return (
    <div className="flex w-full shrink-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-card lg:w-80 xl:w-96">
      <div className="border-b border-zinc-200 p-4">
        <div className="flex rounded-lg bg-zinc-50 p-1">
          {["all", "active", "idle"].map((t) => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                activeTab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              {t === "all" ? "All Fleet" : t}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {isLoading && <div className="rounded-lg border border-zinc-100 p-3"><HookLoader label="Loading drivers..." /></div>}
          {errorMessage && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">{errorMessage}</div>}
          {!isLoading && !errorMessage && filtered.length === 0 && <div className="rounded-lg border border-zinc-100 p-3 text-sm text-zinc-500">No drivers found.</div>}
          {filtered.map((d) => {
            const name = `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.email;
            const status = d.isActive ? "Idle" : "Offline";
            return (
            <div
              key={d.id}
              className="cursor-pointer rounded-lg border border-zinc-100 p-3 transition-colors hover:bg-zinc-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900">{name}</span>
                <span className="text-[11px] text-zinc-400">{d.id.slice(0, 8)}</span>
              </div>
              <Badge
                variant="outline"
                className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_COLORS[status] || "text-zinc-600 bg-zinc-50 border-zinc-200")}
              >
                {status}
              </Badge>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                <Navigation size={11} />
                <span>{d.operationalStateName || "Fleet pool"}</span>
                <ArrowRight size={10} className="text-zinc-300" />
                <span>Available jobs</span>
              </div>
              <div className="mt-2"><StateChip name={d.operationalStateName} /></div>
            </div>
          );})}
        </div>
      </ScrollArea>
    </div>
  );
}
