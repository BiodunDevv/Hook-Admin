"use client";

import Link from "next/link";
import { Archive, Ban, Mail, MapPinned, MoreHorizontal, Pencil, Phone, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { MarketAssociateAction, MarketAssociateMember } from "./market-associate-types";

function initials(member: MarketAssociateMember) {
  const first = member.firstName?.[0] || "";
  const last = member.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "?";
}

function dateLabel(value?: string) {
  if (!value) return "Never signed in";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function availabilityColor(availability: string) {
  if (availability === "available") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (availability === "paused") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-zinc-200 bg-zinc-100 text-zinc-700";
}

export function MarketAssociateCard({ member, onAction, onResend }: { member: MarketAssociateMember; onAction: (member: MarketAssociateMember, action: MarketAssociateAction) => void; onResend: (member: MarketAssociateMember) => void }) {
  const id = member.publicId || member.id;
  const status = String(member.status || "unknown").toLowerCase();
  const availability = String(member.availability || "unavailable").toLowerCase();
  const name = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email || "Unnamed Market Associate";
  const lifecycleAction: MarketAssociateAction = status === "active" ? "suspend" : "reactivate";

  return (
    <Card className="rounded-xl shadow-none transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/dashboard/market-associates/${id}`} className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white bg-zinc-950 text-sm font-semibold text-amber-400 shadow-sm">{initials(member)}</span>
            <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{member.email || "No email"}</span></span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link href={`/dashboard/market-associates/${id}`}><Pencil /> View and edit</Link></DropdownMenuItem>
              {status === "invited" ? <><PermissionGuard permission="runners.manage"><DropdownMenuItem onSelect={() => onResend(member)}><Mail /> Resend invitation</DropdownMenuItem></PermissionGuard><PermissionGuard permission="runners.manage"><DropdownMenuItem variant="destructive" onSelect={() => onAction(member, "cancel-invitation")}><Archive /> Cancel invitation</DropdownMenuItem></PermissionGuard></> : null}
              {status === "active" || status === "suspended" ? <PermissionGuard permission="runners.manage"><DropdownMenuSeparator /><DropdownMenuItem variant={status === "active" ? "destructive" : "default"} onSelect={() => onAction(member, lifecycleAction)}><PowerIcon active={status === "active"} /> {status === "active" ? "Suspend account" : "Reactivate account"}</DropdownMenuItem></PermissionGuard> : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", availabilityColor(availability))}>{availability.charAt(0).toUpperCase() + availability.slice(1)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed pt-3 text-xs">
          <div><p className="text-muted-foreground">Operation states</p><p className="mt-1 font-medium text-foreground">{member.stateIds?.length || 0} assigned</p></div>
          <div className="flex items-center gap-1"><MapPinned className="size-3.5 text-muted-foreground" /><div><p className="text-muted-foreground">Active Markets</p><p className="mt-0.5 font-medium text-foreground">{member.activeMarketCount ?? 0}</p></div></div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed pt-3 text-xs text-muted-foreground">
          {member.phone ? <a href={`tel:${member.phone}`} className="flex min-w-0 items-center gap-1 truncate hover:text-foreground"><Phone className="size-3" />{member.phone}</a> : <span>No phone</span>}
          <span className="shrink-0">{dateLabel(member.lastLoginAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PowerIcon({ active }: { active: boolean }) {
  return active ? <Ban className="size-4" /> : <RotateCcw className="size-4" />;
}
