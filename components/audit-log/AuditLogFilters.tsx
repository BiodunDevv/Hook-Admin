"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RANGE_OPTIONS, entityMetaFor, type AuditRange } from "./audit-log-utils";

export interface AuditLogFiltersValue {
  search: string;
  entityType: string;
  range: AuditRange;
}

export const emptyAuditFilters: AuditLogFiltersValue = { search: "", entityType: "all", range: "all" };

export function AuditLogFilters({
  value,
  onChange,
  entityTypes,
}: {
  value: AuditLogFiltersValue;
  onChange: (next: AuditLogFiltersValue) => void;
  entityTypes: Array<{ value: string; count: number }>;
}) {
  const hasFilters = Boolean(value.search || value.entityType !== "all" || value.range !== "all");
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-none lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search action, entity ID, actor, or reason" className="h-9 pl-9" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value.entityType} onValueChange={(entityType) => onChange({ ...value, entityType })}>
          <SelectTrigger className="h-9 w-full sm:w-52"><SelectValue placeholder="All entities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((option) => (
              <SelectItem key={option.value} value={option.value}>{entityMetaFor(option.value).label} ({option.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.range} onValueChange={(range) => onChange({ ...value, range: range as AuditRange })}>
          <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="All time" /></SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(emptyAuditFilters)}><X /> Clear</Button>
        ) : (
          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex"><Filter className="size-3.5" /> Showing everything</span>
        )}
      </div>
    </div>
  );
}
