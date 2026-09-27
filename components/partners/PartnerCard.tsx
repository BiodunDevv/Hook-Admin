"use client";

import Link from "next/link";
import { Archive, Ban, KeyRound, Mail, MapPin, MoreHorizontal, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useIsSuperAdmin } from "@/hooks/use-permission";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Partner, PartnerAction } from "./partner-types";

function initials(partner: Partner) {
  return partner.name?.slice(0, 2).toUpperCase() || "?";
}

function dateLabel(value?: string) {
  if (!value) return "Never signed in";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function PartnerCard({
  partner,
  stateName,
  cityName,
  marketName,
  onAction,
  onResend,
}: {
  partner: Partner;
  stateName?: string;
  cityName?: string;
  marketName?: string;
  onAction: (partner: Partner, action: PartnerAction) => void;
  onResend: (partner: Partner) => void;
}) {
  const id = partner.publicId || partner.id;
  const status = String(partner.status || "unknown").toLowerCase();
  const contact = `${partner.firstName || ""} ${partner.lastName || ""}`.trim();
  const lifecycleAction: PartnerAction = status === "active" ? "suspend" : "reactivate";
  const superAdmin = useIsSuperAdmin();
  const archived = status === "disabled";

  return (
    <Card className="rounded-xl shadow-none transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/dashboard/partners/${id}`} className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white bg-zinc-950 text-sm font-semibold text-amber-400 shadow-sm">{initials(partner)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{partner.name}</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">{contact || partner.email || "No contact recorded"}</span>
            </span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${partner.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link href={`/dashboard/partners/${id}`}><Pencil /> View and edit</Link></DropdownMenuItem>
              {status === "invited" ? <><PermissionGuard permission="partners.manage"><DropdownMenuItem onSelect={() => onResend(partner)}><Mail /> Resend invitation</DropdownMenuItem></PermissionGuard><PermissionGuard permission="partners.manage"><DropdownMenuItem variant="destructive" onSelect={() => onAction(partner, "cancel-invitation")}><Archive /> Cancel invitation</DropdownMenuItem></PermissionGuard></> : null}
              {status === "active" || status === "suspended" ? <PermissionGuard permission="partners.manage"><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onAction(partner, lifecycleAction)}><PowerIcon active={status === "active"} /> {status === "active" ? "Suspend location" : "Reactivate location"}</DropdownMenuItem></PermissionGuard> : null}
              {status === "active" || status === "suspended" ? <PermissionGuard permission="partners.manage"><DropdownMenuItem onSelect={() => onAction(partner, "revoke-sessions")}><KeyRound /> Revoke sessions</DropdownMenuItem></PermissionGuard> : null}
              {status === "active" || status === "suspended" ? <PermissionGuard permission="partners.manage"><DropdownMenuItem variant="destructive" onSelect={() => onAction(partner, "archive")}><Archive /> Archive location</DropdownMenuItem></PermissionGuard> : null}
              {archived ? <PermissionGuard permission="partners.manage"><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onAction(partner, "restore")}><RotateCcw /> Restore location</DropdownMenuItem></PermissionGuard> : null}
              {archived && superAdmin ? <DropdownMenuItem variant="destructive" onSelect={() => onAction(partner, "delete")}><Trash2 /> Delete permanently</DropdownMenuItem> : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
        </div>
        <div className="mt-4 flex items-start gap-1.5 border-t border-dashed pt-3 text-xs">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0"><p className="truncate font-medium text-foreground">{marketName || cityName || partner.marketId || "Market not set"}{stateName ? `, ${stateName}` : ""}</p><p className="mt-0.5 truncate text-muted-foreground">{partner.address || "No address recorded"}</p></div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed pt-3 text-xs text-muted-foreground">
          {partner.phone ? <a href={`tel:${partner.phone}`} className="flex min-w-0 items-center gap-1 truncate hover:text-foreground"><Phone className="size-3" />{partner.phone}</a> : <span>No phone</span>}
          <span className="shrink-0">{dateLabel(partner.lastLoginAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PowerIcon({ active }: { active: boolean }) {
  return active ? <Ban className="size-4" /> : <RotateCcw className="size-4" />;
}
