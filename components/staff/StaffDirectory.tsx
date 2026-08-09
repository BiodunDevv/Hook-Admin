"use client";

import { Headset, Shield, ShieldCheck, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { StaffAction, StaffMember } from "./staff-types";
import { StaffCard } from "./StaffCard";

function groupFor(member: StaffMember) {
  const keys = (member.roleKeys || member.roles?.map((role) => role.key) || []).map((key) => key.toUpperCase());
  if (keys.includes("SUPER_ADMIN")) return { key: "super", title: "Super Admins", icon: ShieldCheck, tone: "text-amber-700" };
  if (keys.some((key) => key.includes("MANAGER") || key.includes("LEAD") || key.includes("OFFICER"))) return { key: "operations", title: "Operations and management", icon: Shield, tone: "text-blue-700" };
  if (keys.some((key) => key.includes("SUPPORT"))) return { key: "support", title: "Support staff", icon: Headset, tone: "text-violet-700" };
  return { key: "other", title: "Other staff", icon: UserCog, tone: "text-zinc-700" };
}

export function StaffDirectory({ staff, currentUserId, onAction, onResend }: { staff: StaffMember[]; currentUserId?: string; onAction: (member: StaffMember, action: StaffAction) => void; onResend: (member: StaffMember) => void }) {
  const groups = new Map<string, { title: string; icon: typeof UserCog; tone: string; members: StaffMember[] }>();
  staff.forEach((member) => {
    const group = groupFor(member);
    const existing = groups.get(group.key);
    if (existing) existing.members.push(member);
    else groups.set(group.key, { title: group.title, icon: group.icon, tone: group.tone, members: [member] });
  });
  const order = ["super", "operations", "support", "other"];
  if (!staff.length) return <EmptyState icon={UserCog} title="No staff members found" description="Adjust the filters or create the first staff invitation." />;
  return <div className="space-y-7">{order.map((key) => { const group = groups.get(key); if (!group) return null; const Icon = group.icon; return <section key={key}><div className="mb-3 flex items-center gap-2"><Icon className={`size-4 ${group.tone}`} /><h2 className="text-sm font-semibold text-foreground">{group.title}</h2><Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{group.members.length}</Badge></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.members.map((member) => <StaffCard key={member.id} member={member} currentUserId={currentUserId} onAction={onAction} onResend={onResend} />)}</div></section>; })}</div>;
}
