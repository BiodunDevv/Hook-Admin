"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Store } from "lucide-react";
import { apiGet } from "@/lib/api";

interface VendorRow {
  id: string;
  businessName: string;
  businessAddress?: string;
  tier: string;
  isApproved: boolean;
  isActive: boolean;
  owner?: { firstName?: string; lastName?: string; email?: string };
}

interface Page<T> { data: T[]; total: number; }

export function VendorsTable() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Page<VendorRow>>("/admin/vendors")
      .then((result) => setVendors(result.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load vendors"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-zinc-100 bg-zinc-50">
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Business Name</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Owner</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Location</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Tier</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">GMV</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Orders</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={7} className="px-5 py-8 text-center text-zinc-500">Loading vendors...</TableCell></TableRow>}
          {error && <TableRow><TableCell colSpan={7} className="px-5 py-8 text-center text-red-600">{error}</TableCell></TableRow>}
          {!loading && !error && vendors.length === 0 && <TableRow><TableCell colSpan={7} className="px-5 py-8 text-center text-zinc-500">No vendors found.</TableCell></TableRow>}
          {vendors.map((v) => {
            const owner = `${v.owner?.firstName || ""} ${v.owner?.lastName || ""}`.trim() || v.owner?.email || "Owner";
            return (
            <TableRow key={v.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
              <TableCell className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-zinc-400" />
                  <span className="font-medium text-zinc-900">{v.businessName}</span>
                </div>
              </TableCell>
              <TableCell className="px-5 py-4 text-zinc-600">{owner}</TableCell>
              <TableCell className="px-5 py-4 text-zinc-600">{v.businessAddress || "Not set"}</TableCell>
              <TableCell className="px-5 py-4">
                <StatusBadge status={v.tier} />
              </TableCell>
              <TableCell className="px-5 py-4 font-semibold text-zinc-900">₦0</TableCell>
              <TableCell className="px-5 py-4 text-zinc-600">0</TableCell>
              <TableCell className="px-5 py-4">
                <StatusBadge status={v.isApproved && v.isActive ? "Active" : v.isApproved ? "Inactive" : "Pending"} />
              </TableCell>
            </TableRow>
          );})}
        </TableBody>
      </Table>
    </div>
  );
}
