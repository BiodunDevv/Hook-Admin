"use client";

import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

const STATUS_TABS = ["All", "Active", "Completed"];

interface OrderFiltersProps {
  tab: string;
  onTabChange: (tab: string) => void;
}

export function OrderFilters({ tab, onTabChange }: OrderFiltersProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <SearchInput placeholder="Search by ID, customer..." className="w-52" />
        <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-zinc-600">
          <SlidersHorizontal size={14} />
          Filters
          <span className="rounded-full bg-brand-gold px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900">
            2
          </span>
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-400">Status:</span>
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              tab === t
                ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
