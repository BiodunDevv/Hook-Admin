"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApiQuery } from "@/lib/query";

export interface OperationalStateRow {
  id: string;
  code: string;
  name: string;
  isEnabled: boolean;
}

interface StateDropdownProps {
  value: string;
  onChange: (value: string) => void;
  mode?: "filter" | "form";
  className?: string;
}

export function useOperationalStates(activeOnly = true) {
  const path = `/admin/operations/states${activeOnly ? "?active=true" : ""}`;
  return useApiQuery<OperationalStateRow[]>(["admin", "operations", "states", activeOnly], path);
}

export function StateDropdown({ value, onChange, mode = "filter", className }: StateDropdownProps) {
  const states = useOperationalStates(true);
  const rows = states.data || [];
  const selected = rows.find((state) => state.code === value);
  const label = value === "all" || !value ? "All states" : selected?.name || value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className || "justify-between gap-2 text-zinc-700"}>
          <MapPin size={14} />
          <span className="truncate">{label}</span>
          {value && value !== "all" && (
            <span className="rounded-full bg-brand-gold px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900">1</span>
          )}
          <ChevronDown size={13} className="text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-60 overflow-y-auto">
        <DropdownMenuLabel>Operating state</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value || (mode === "filter" ? "all" : "")} onValueChange={onChange}>
          {mode === "filter" && <DropdownMenuRadioItem value="all">All states</DropdownMenuRadioItem>}
          {rows.map((state) => (
            <DropdownMenuRadioItem key={state.code} value={state.code}>
              {state.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StateChip({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <MapPin size={11} />
      {name}
    </span>
  );
}
