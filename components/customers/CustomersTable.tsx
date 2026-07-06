"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, AlertCircle } from "lucide-react";
import { useApiQuery } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";

interface CustomerRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface Page<T> { data: T[]; total: number; }

export function CustomersTable() {
  const { data, isLoading, error } = useApiQuery<Page<CustomerRow>>(["admin", "customers"], "/admin/customers");
  const customers = data?.data || [];
  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-zinc-200 bg-white">
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Customer</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Contact Details</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Segments</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Lifetime Value (LTV)</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Last Active</TableHead>
            <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-100">
          {isLoading && <TableRow><TableCell colSpan={6} className="px-6 py-8"><HookLoader label="Loading customers..." /></TableCell></TableRow>}
          {errorMessage && <TableRow><TableCell colSpan={6} className="px-6 py-8 text-center text-red-600">{errorMessage}</TableCell></TableRow>}
          {!isLoading && !errorMessage && customers.length === 0 && <TableRow><TableCell colSpan={6} className="px-6 py-8 text-center text-zinc-500">No customers found.</TableCell></TableRow>}
          {customers.map((customer) => {
            const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email;
            const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
            const isSuspended = !customer.isActive;
            return (
            <TableRow key={customer.id} className="transition-colors hover:bg-zinc-50">
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {customer.avatarUrl && <AvatarImage src={customer.avatarUrl} alt={name} className="object-cover" />}
                    <AvatarFallback className="bg-zinc-100 text-sm font-semibold text-zinc-600">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="mb-0.5 font-semibold leading-tight text-zinc-900">{name}</p>
                    <p className="text-[12px] text-zinc-400">{customer.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex flex-col gap-1.5 text-[13px] text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-zinc-400" />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zinc-400" />
                    {customer.phone || "No phone"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex max-w-[180px] flex-wrap gap-2">
                  <span className="inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">Shopper</span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <p className="mb-0.5 font-bold text-zinc-900">₦0</p>
                <p className="text-[12px] text-zinc-400">0 Orders</p>
              </TableCell>
              <TableCell className="px-4 py-3 text-[13px] text-zinc-600">{customer.lastLoginAt ? "Recently" : "Never"}</TableCell>
              <TableCell className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium ${isSuspended ? "text-red-700 border-red-200 bg-red-50" : "text-emerald-700 border-emerald-200"}`}
                >
                  {isSuspended && <AlertCircle size={12} className="text-red-500" />}
                  {isSuspended ? "Suspended" : "Active"}
                </span>
              </TableCell>
            </TableRow>
          );})}
        </TableBody>
      </Table>
    </div>
  );
}
