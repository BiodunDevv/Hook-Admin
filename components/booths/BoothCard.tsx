"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, Eye, MapPin, Power, Store, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { apiPatch } from "@/lib/api";
import { StateChip } from "@/components/operations/StateDropdown";

export interface BoothRow {
  id: string;
  name: string;
  description?: string;
  boothType: "phygital" | "micro_hub" | string;
  location?: { address?: string; lat?: number; lng?: number; stateCode?: string; stateName?: string };
  operatingHours?: { open?: string; close?: string; days?: string };
  previewImageUrl?: string;
  isActive: boolean;
  fieldAgent?: {
    id: string;
    assignedMarket?: string;
    agent?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  } | null;
}

interface BoothCardProps {
  booth: BoothRow;
  onRefresh: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  phygital: "Phygital",
  micro_hub: "Micro Hub",
};

function attendantName(booth: BoothRow) {
  const user = booth.fieldAgent?.agent;
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "";
}

export function BoothCard({ booth, onRefresh }: BoothCardProps) {
  const [busy, setBusy] = useState(false);
  const attendant = attendantName(booth);

  async function handleToggle() {
    setBusy(true);
    try {
      await apiPatch(`/admin/booths/${booth.id}/status`);
      toast.success(booth.isActive ? `"${booth.name}" taken offline` : `"${booth.name}" is now live`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed to update booth");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl border-zinc-200 py-0 shadow-card">
      {/* Image header */}
      <div className="relative aspect-video bg-zinc-100">
        {booth.previewImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={booth.previewImageUrl} alt={booth.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-300">
            <Store size={32} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">{booth.name}</h3>
              <p className="flex items-center gap-1 truncate text-xs text-white/80">
                <MapPin size={10} className="shrink-0" /> {booth.location?.address || "No address"}
              </p>
            </div>
            <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              booth.isActive ? "bg-emerald-500/90 text-white" : "bg-zinc-500/90 text-white"
            }`}>
              <span className={`size-1.5 rounded-full ${booth.isActive ? "bg-white animate-pulse" : "bg-zinc-200"}`} />
              {booth.isActive ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              booth.boothType === "phygital"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            {TYPE_LABEL[booth.boothType] || booth.boothType}
          </Badge>
          {booth.operatingHours?.open && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock size={10} />
              {booth.operatingHours.open}–{booth.operatingHours.close}
              {booth.operatingHours.days ? ` · ${booth.operatingHours.days}` : ""}
            </span>
          )}
          <StateChip name={booth.location?.stateName} />
        </div>

        {booth.description && (
          <p className="line-clamp-2 text-xs leading-5 text-zinc-500">{booth.description}</p>
        )}

        {/* Attendant */}
        <div className="flex items-center gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
          {attendant ? (
            <>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                {attendant.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-800">{attendant}</p>
                <p className="truncate text-[10px] text-zinc-400">
                  Attendant{booth.fieldAgent?.assignedMarket ? ` · ${booth.fieldAgent.assignedMarket}` : ""}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-400">
                <UserX size={12} />
              </span>
              <p className="text-xs text-zinc-400">No attendant assigned</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
            <Link href={`/dashboard/booths/${booth.id}`}>
              <Eye size={13} /> View Details
            </Link>
          </Button>
          <PermissionGuard permission="booths.edit">
            <Button variant="outline" size="sm" disabled={busy} onClick={handleToggle} className="gap-1.5">
              <Power size={13} className={booth.isActive ? "text-red-500" : "text-emerald-500"} />
              {booth.isActive ? "Take Offline" : "Go Live"}
            </Button>
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}
