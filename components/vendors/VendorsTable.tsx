"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Power,
  Store,
  StoreIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { StateChip } from "@/components/operations/StateDropdown";
import { money } from "@/lib/admin-utils";
import { useApiQuery } from "@/lib/query";
import { apiPatch } from "@/lib/api";

export interface VendorRow {
  id: string;
  businessName: string;
  businessEmail?: string;
  businessAddress?: string;
  stateCode?: string;
  stateName?: string;
  tier: string;
  isApproved: boolean;
  isActive: boolean;
  owner?: { firstName?: string; lastName?: string; email?: string };
  metrics?: { gmv?: number; orders?: number; products?: number };
}

interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

interface VendorsTableProps {
  queryKey: readonly unknown[];
  path: string;
  onPageChange: (page: number) => void;
}

function vendorStatus(vendor: VendorRow) {
  if (!vendor.isApproved) return "Pending";
  if (!vendor.isActive) return "Inactive";
  return "Active";
}

export function VendorsTable({ queryKey, path, onPageChange }: VendorsTableProps) {
  const { data, isLoading, isFetching, error, refetch } = useApiQuery<Page<VendorRow>>(queryKey, path);
  const [selectedVendor, setSelectedVendor] = useState<VendorRow | null>(null);
  const vendors = data?.data || [];
  const meta = {
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
  };
  const errorMessage = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";
  const start = vendors.length ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = vendors.length ? start + vendors.length - 1 : 0;

  async function runVendorAction(action: "approve" | "toggle") {
    if (!selectedVendor) return;
    try {
      await apiPatch(`/admin/vendors/${selectedVendor.id}/${action === "approve" ? "approve" : "toggle"}`);
      toast.success(action === "approve" ? "Vendor approved." : "Vendor status updated.");
      setSelectedVendor(null);
      refetch();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message.replace(/^\d+:\s*/, "") : "Vendor action failed");
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-zinc-100 bg-zinc-50">
              {["No", "Business", "Owner", "Location", "Tier", "GMV", "Orders", "Status", ""].map((header) => (
                <TableHead key={header} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="px-3 py-12 whitespace-normal sm:px-5">
                  <div className="mx-auto flex max-w-sm items-center justify-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
                    <HookLoader label="Loading vendors..." />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {errorMessage && (
              <TableRow>
                <TableCell colSpan={9} className="px-3 py-12 whitespace-normal sm:px-5">
                  <div className="mx-auto w-full max-w-xl rounded-lg border border-red-200 bg-red-50 p-5 text-center">
                    <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-white text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <p className="font-semibold text-red-700">Vendors could not be loaded</p>
                    <p className="mx-auto mt-1 max-w-md whitespace-normal break-words text-sm leading-6 text-red-600">{errorMessage}</p>
                    <Button variant="outline" size="sm" className="mt-4 bg-white" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !errorMessage && vendors.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="px-3 py-14 whitespace-normal sm:px-5 sm:py-16">
                  <div className="mx-auto flex min-h-56 w-full max-w-2xl flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-8 text-center sm:px-8">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm sm:size-16">
                      <StoreIcon size={26} />
                    </div>
                    <p className="text-base font-semibold text-zinc-900 sm:text-lg">No vendors found for this view</p>
                    <p className="mx-auto mt-2 max-w-xl whitespace-normal break-words text-sm leading-6 text-zinc-500 sm:text-base">
                      Try another search, adjust the vendor filters, or onboard a vendor when you are ready.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {vendors.map((vendor, index) => {
              const owner = `${vendor.owner?.firstName || ""} ${vendor.owner?.lastName || ""}`.trim() || vendor.owner?.email || "Owner";

              return (
                <TableRow key={vendor.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                  <TableCell className="px-4 py-3 text-xs font-semibold text-zinc-400">{start + index}</TableCell>
                  <TableCell className="min-w-64 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                        <Store size={16} />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/dashboard/vendors/${vendor.id}`} className="block truncate font-medium text-zinc-900 hover:underline">
                          {vendor.businessName}
                        </Link>
                        <p className="truncate text-xs text-zinc-400">{vendor.businessEmail || vendor.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-zinc-600">{owner}</TableCell>
                  <TableCell className="max-w-64 px-4 py-3 text-zinc-600">
                    <div className="flex min-w-48 flex-col gap-1">
                      <StateChip name={vendor.stateName} />
                      <span className="truncate">{vendor.businessAddress || "Not set"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={vendor.tier} />
                  </TableCell>
                  <TableCell className="px-4 py-3 font-semibold text-zinc-900">{money(vendor.metrics?.gmv || 0)}</TableCell>
                  <TableCell className="px-4 py-3 text-zinc-600">{Number(vendor.metrics?.orders || 0).toLocaleString()}</TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={vendorStatus(vendor)} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon-sm" onClick={() => setSelectedVendor(vendor)} aria-label={`Open actions for ${vendor.businessName}`}>
                      <MoreHorizontal size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-2.5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {start} to {end} of {meta.total} vendors {isFetching && !isLoading ? "· refreshing" : ""}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-3" disabled={meta.page <= 1 || isFetching} onClick={() => onPageChange(meta.page - 1)}>
            <ChevronLeft size={14} />
          </Button>
          <Button size="sm" className="h-8 min-w-8 bg-zinc-900 px-2 text-white hover:bg-zinc-800">
            {meta.page}
          </Button>
          <span className="px-1">/ {meta.totalPages}</span>
          <Button variant="outline" size="sm" className="h-8 px-3" disabled={meta.page >= meta.totalPages || isFetching} onClick={() => onPageChange(meta.page + 1)}>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent className="max-w-sm gap-4 rounded-lg p-5">
          <DialogHeader>
            <DialogTitle>Vendor actions</DialogTitle>
            <DialogDescription>{selectedVendor?.businessName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/dashboard/vendors/${selectedVendor?.id}`}>
                <Eye size={15} /> View details
              </Link>
            </Button>
            {selectedVendor && !selectedVendor.isApproved && (
              <Button variant="outline" className="justify-start text-emerald-700" onClick={() => runVendorAction("approve")}>
                <Check size={15} /> Approve vendor
              </Button>
            )}
            <Button variant="outline" className="justify-start text-zinc-700" onClick={() => runVendorAction("toggle")}>
              <Power size={15} /> {selectedVendor?.isActive ? "Deactivate vendor" : "Activate vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
