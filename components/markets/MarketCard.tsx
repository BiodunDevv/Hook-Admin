"use client";

import Link from "next/link";
import { ArrowRight, Building2, MapPin, MoreHorizontal, Pencil, Power, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MarketImage } from "./MarketImage";
import type { MarketRecord } from "./market-types";

export function MarketCard({
  market,
  canManage,
  onEdit,
  onLifecycle,
  onAssignHub,
}: {
  market: MarketRecord;
  canManage: boolean;
  onEdit: (market: MarketRecord) => void;
  onLifecycle: (market: MarketRecord) => void;
  onAssignHub: (market: MarketRecord) => void;
}) {
  const id = market.publicId || market.id;
  const location = [market.cityName || market.city?.name, market.stateName || market.state?.name].filter(Boolean).join(", ");

  return (
    <Card className="group overflow-hidden rounded-xl shadow-none transition-shadow hover:shadow-md">
      <Link href={`/dashboard/markets/${id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[16/8] overflow-hidden bg-muted">
          <MarketImage src={market.imageUrl} alt={`${market.name} market`} className="size-full transition-transform duration-300 group-hover:scale-[1.03]" />
          <div className="absolute left-3 top-3"><StatusBadge status={String(market.status || "unknown")} /></div>
          <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">{market.publicId || market.id}</div>
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/dashboard/markets/${id}`} className="block truncate text-base font-semibold text-foreground hover:underline">{market.name}</Link>
            <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" />{location || market.address}</p>
          </div>
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${market.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <PermissionGuard permission="markets.manage"><DropdownMenuItem onSelect={() => onEdit(market)}><Pencil /> Edit market</DropdownMenuItem></PermissionGuard>
                <PermissionGuard permission="markets.manage"><DropdownMenuItem onSelect={() => onLifecycle(market)}><Power /> {market.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem></PermissionGuard>
                <PermissionGuard permission="markets.assign_hub"><DropdownMenuItem onSelect={() => onAssignHub(market)}><Building2 /> Assign Dispatch Hub</DropdownMenuItem></PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed pt-3 text-xs">
          <div className="min-w-0"><p className="text-muted-foreground">Dispatch Hub</p><p className="mt-1 truncate font-medium text-foreground">{market.hubName || "Not assigned"}</p></div>
          <div className="min-w-0"><p className="text-muted-foreground">Address</p><p className="mt-1 truncate font-medium text-foreground">{market.address}</p></div>
        </div>
        <Link href={`/dashboard/markets/${id}`} className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold text-foreground hover:text-[#8a6900]">
          <span className="flex items-center gap-1.5"><Store className="size-3.5 text-[#b18b00]" /> View market workspace</span><ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
