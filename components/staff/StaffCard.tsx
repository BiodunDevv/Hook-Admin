"use client";

import Link from "next/link";
import { Archive, Ban, KeyRound, Mail, MoreHorizontal, Pencil, Phone, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { StaffAction, StaffMember, StaffRole } from "./staff-types";

function initials(member: StaffMember) {
  const first = member.firstName?.[0] || "";
  const last = member.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "?";
}

function dateLabel(value?: string) {
  if (!value) return "Never signed in";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function roleColor(key: string) {
  if (key.includes("SUPER")) return "border-amber-200 bg-amber-50 text-amber-800";
  if (key.includes("FINANCE")) return "border-blue-200 bg-blue-50 text-blue-800";
  if (key.includes("SUPPORT")) return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-zinc-200 bg-zinc-100 text-zinc-700";
}

function roleName(role: StaffRole) {
  return role.name || role.key.replaceAll("_", " ");
}

export function StaffCard({ member, currentUserId, onAction, onResend }: { member: StaffMember; currentUserId?: string; onAction: (member: StaffMember, action: StaffAction) => void; onResend: (member: StaffMember) => void }) {
  const id = member.publicId || member.id;
  const accountId = member.account?.publicId || member.account?.id;
  const isSelf = Boolean(currentUserId && [member.id, member.publicId, accountId].filter(Boolean).includes(currentUserId));
  const status = String(member.status || "unknown").toLowerCase();
  const name = `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email || "Unnamed staff";
  const roles = member.roles || [];
  const isProtected = roles.some((role) => role.key === "SUPER_ADMIN");
  const canLifecycle = !isSelf && !isProtected;
  const lifecycleAction: StaffAction = status === "active" ? "suspend" : status === "disabled" ? "restore" : "reactivate";

  return (
    <Card className="rounded-xl shadow-none transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/dashboard/staff/${id}`} className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white bg-zinc-950 text-sm font-semibold text-amber-400 shadow-sm">{initials(member)}</span>
            <span className="min-w-0"><span className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">{name}{isSelf ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">You</span> : null}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{member.email || "No email"}</span></span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link href={`/dashboard/staff/${id}`}><Pencil /> View and edit</Link></DropdownMenuItem>
              {status === "invited" ? <><PermissionGuard permission="staff.create"><DropdownMenuItem onSelect={() => onResend(member)}><Mail /> Resend invitation</DropdownMenuItem></PermissionGuard><PermissionGuard permission="staff.suspend"><DropdownMenuItem variant="destructive" onSelect={() => onAction(member, "cancel-invitation")}><Archive /> Cancel invitation</DropdownMenuItem></PermissionGuard></> : null}
              {canLifecycle ? <PermissionGuard permission="staff.suspend"><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onAction(member, lifecycleAction)}><PowerIcon active={status === "active"} /> {status === "active" ? "Suspend account" : status === "disabled" ? "Restore account" : "Reactivate account"}</DropdownMenuItem></PermissionGuard> : null}
              {!isSelf && status !== "invited" && status !== "disabled" ? <PermissionGuard permission="staff.revoke_sessions"><DropdownMenuItem onSelect={() => onAction(member, "revoke-sessions")}><KeyRound /> Revoke sessions</DropdownMenuItem></PermissionGuard> : null}
              {!isSelf && status !== "invited" && status !== "disabled" ? <PermissionGuard permission="staff.suspend"><DropdownMenuItem variant="destructive" onSelect={() => onAction(member, "archive")}><Archive /> Archive account</DropdownMenuItem></PermissionGuard> : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {roles.slice(0, 2).map((role) => <span key={role.id} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", roleColor(role.key))}><ShieldCheck className="size-3" />{roleName(role)}</span>)}
          {roles.length > 2 ? <span className="text-[11px] text-muted-foreground">+{roles.length - 2} roles</span> : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed pt-3 text-xs">
          <div><p className="text-muted-foreground">Scope</p><p className="mt-1 font-medium text-foreground">{String(member.scopeType || "self").replaceAll("_", " ")}</p></div>
          <div><p className="text-muted-foreground">Permissions</p><p className="mt-1 font-medium text-foreground">{member.permissions?.length || 0} inherited</p></div>
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
