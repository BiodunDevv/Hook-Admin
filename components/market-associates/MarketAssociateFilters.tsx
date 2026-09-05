"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MarketAssociateFiltersValue {
  search: string;
  status: string;
  availability: string;
}

export function MarketAssociateFilters({ value, onChange }: { value: MarketAssociateFiltersValue; onChange: (next: MarketAssociateFiltersValue) => void }) {
  const hasFilters = Boolean(value.search || value.status !== "all" || value.availability !== "all");
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-none lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search name, email, phone, or Market Associate ID" className="h-9 pl-9" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value.status} onValueChange={(status) => onChange({ ...value, status })}>
          <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue placeholder="All status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="disabled">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={value.availability} onValueChange={(availability) => onChange({ ...value, availability })}>
          <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="All availability" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All availability</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters ? <Button variant="ghost" size="sm" onClick={() => onChange({ search: "", status: "all", availability: "all" })}><X /> Clear</Button> : <span className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex"><Filter className="size-3.5" /> Refine directory</span>}
      </div>
    </div>
  );
}
