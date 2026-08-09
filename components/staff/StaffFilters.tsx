"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface StaffFiltersValue {
  search: string;
  role: string;
  status: string;
  scope: string;
}

export function StaffFilters({ value, onChange }: { value: StaffFiltersValue; onChange: (next: StaffFiltersValue) => void }) {
  const hasFilters = Boolean(value.search || value.role !== "all" || value.status !== "all" || value.scope !== "all");
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-none lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search name, email, phone, or Staff ID" className="h-9 pl-9" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value.role} onValueChange={(role) => onChange({ ...value, role })}>
          <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="OPERATIONS_LEAD">Operations Lead</SelectItem>
            <SelectItem value="STATE_OPERATIONS_MANAGER">State Operations</SelectItem>
            <SelectItem value="CUSTOMER_SUPPORT_OFFICER">Customer Support</SelectItem>
            <SelectItem value="FINANCE_OFFICER">Finance</SelectItem>
            <SelectItem value="MANAGEMENT_VIEWER">Management Viewer</SelectItem>
          </SelectContent>
        </Select>
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
        <Select value={value.scope} onValueChange={(scope) => onChange({ ...value, scope })}>
          <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue placeholder="All scopes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scopes</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="multi_state">Multi-state</SelectItem>
            <SelectItem value="single_state">Single state</SelectItem>
            <SelectItem value="hub">Dispatch Hub</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters ? <Button variant="ghost" size="sm" onClick={() => onChange({ search: "", role: "all", status: "all", scope: "all" })}><X /> Clear</Button> : <span className="hidden items-center gap-1 text-xs text-muted-foreground xl:flex"><Filter className="size-3.5" /> Refine directory</span>}
      </div>
    </div>
  );
}
