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
import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";

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

interface CustomersTableProps {
  customers: CustomerRow[];
  isLoading?: boolean;
  error?: unknown;
}

export function CustomersTable({ customers, isLoading = false, error }: CustomersTableProps) {
  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";

  return (
    <div>
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="border-b border-zinc-200 bg-white">
            <TableHead className="w-10 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:w-14 sm:px-5">#</TableHead>
            <TableHead className="w-[30%] px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:px-5">Customer</TableHead>
            <TableHead className="w-[34%] px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:px-5">Contact</TableHead>
            <TableHead className="w-[17%] px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:px-5">Last active</TableHead>
            <TableHead className="w-[15%] px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:px-5">Status</TableHead>
            <TableHead className="w-12 px-2 sm:px-4" />
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-100">
          {isLoading && <TableRow><TableCell colSpan={6} className="px-6 py-8"><HookLoader label="Loading customers..." /></TableCell></TableRow>}
          {errorMessage && <TableRow><TableCell colSpan={6} className="px-6 py-8 text-center text-red-600">{errorMessage}</TableCell></TableRow>}
          {!isLoading && !errorMessage && customers.length === 0 && <TableRow><TableCell colSpan={6} className="px-6 py-8 text-center text-zinc-500">No customers found.</TableCell></TableRow>}
          {customers.map((customer, index) => {
            const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email;
            const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
            const isSuspended = !customer.isActive;
            return (
            <TableRow key={customer.id} className="transition-colors hover:bg-zinc-50">
              <TableCell className="px-3 py-3 text-center text-sm tabular-nums text-zinc-500 sm:px-5">{index + 1}</TableCell>
              <TableCell className="px-3 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {customer.avatarUrl && <AvatarImage src={customer.avatarUrl} alt={name} className="object-cover" />}
                    <AvatarFallback className="bg-zinc-100 text-sm font-semibold text-zinc-600">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/dashboard/customers/${customer.id}`} className="block truncate font-semibold leading-tight text-zinc-900 hover:underline">{name}</Link>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400">{customer.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-3 py-3 sm:px-5">
                <div className="flex flex-col gap-1.5 text-[13px] text-zinc-600">
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail size={14} className="text-zinc-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Phone size={14} className="text-zinc-400" />
                    {customer.phone || "No phone"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-3 py-3 text-[13px] text-zinc-600 sm:px-5">{customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleDateString("en-NG") : "Never"}</TableCell>
              <TableCell className="px-3 py-3 sm:px-5"><StatusBadge status={isSuspended ? "suspended" : "active"} /></TableCell>
              <TableCell className="px-2 py-3 text-right sm:px-4"><Link href={`/dashboard/customers/${customer.id}`} className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label={`View ${name}`}><ArrowUpRight size={16} /></Link></TableCell>
            </TableRow>
          );})}
        </TableBody>
      </Table>
    </div>
  );
}
