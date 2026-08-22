"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AuditLogFiltersValue {
  search: string;
  entityType: string;
}

const ENTITY_OPTIONS = [
  { value: "all", label: "All entities" },
  { value: "marketassociate", label: "Market Associates" },
  { value: "marketassociate_assignment", label: "Market Assignments" },
  { value: "staff", label: "Staff" },
  { value: "partner", label: "Hook Partners" },
  { value: "role", label: "Roles" },
  { value: "state", label: "Operation States" },
  { value: "city", label: "Cities" },
  { value: "zone", label: "Zones" },
  { value: "hub", label: "Dispatch Hubs" },
  { value: "market", label: "Markets" },
  { value: "product", label: "Products" },
];

export function AuditLogFilters({ value, onChange }: { value: AuditLogFiltersValue; onChange: (next: AuditLogFiltersValue) => void }) {
  const hasFilters = Boolean(value.search || value.entityType !== "all");
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-none lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search action, entity ID, actor, or reason" className="h-9 pl-9" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value.entityType} onValueChange={(entityType) => onChange({ ...value, entityType })}>
          <SelectTrigger className="h-9 w-full sm:w-48"><SelectValue placeholder="All entities" /></SelectTrigger>
          <SelectContent>
            {ENTITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters ? <Button variant="ghost" size="sm" onClick={() => onChange({ search: "", entityType: "all" })}><X /> Clear</Button> : <span className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex"><Filter className="size-3.5" /> Refine history</span>}
      </div>
    </div>
  );
}
