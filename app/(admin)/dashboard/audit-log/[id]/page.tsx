"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, Fingerprint, Globe, Monitor, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DefinitionGrid, type DefinitionItem } from "@/components/shared/DefinitionGrid";
import { DetailSection } from "@/components/shared/DetailSection";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { useApiQuery } from "@/lib/query";
import { entityMetaFor, dateTime, humanize } from "@/components/audit-log/audit-log-utils";
import type { AuditLogEvent } from "@/components/audit-log/audit-log-types";

const entityLinkBase: Record<string, string> = {
  marketassociate: "/dashboard/market-associates",
  staff: "/dashboard/staff",
  partner: "/dashboard/partners",
};

function diffKeys(before?: Record<string, unknown>, after?: Record<string, unknown>) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  keys.delete("_id");
  keys.delete("__v");
  keys.delete("history");
  return [...keys];
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useApiQuery<AuditLogEvent>(["admin", "audit-logs", params.id], `/admin/audit-logs/${params.id}`, Boolean(params.id));
  const event = query.data;
  const meta = event ? entityMetaFor(event.entityType) : null;
  const Icon = meta?.icon || Fingerprint;
  const changedKeys = event ? diffKeys(event.before, event.after) : [];
  const entityLink = event?.entityType && event.entityPublicId && entityLinkBase[event.entityType]
    ? `${entityLinkBase[event.entityType]}/${event.entityPublicId}`
    : null;

  const overviewItems: DefinitionItem[] = event ? [
    { label: "Action", value: humanize(event.action) },
    { label: "Entity", value: meta ? `${meta.label}${event.entityPublicId ? ` · ${event.entityPublicId}` : ""}` : "—" },
    { label: "Recorded at", value: dateTime(event.createdAt) },
    { label: "Audit ID", value: event.publicId || event.id || "—" },
    ...(event.reason ? [{ label: "Reason", value: event.reason, span: 2 as const }] : []),
  ] : [];
  const actorItems: DefinitionItem[] = event ? [
    { label: "Actor", value: event.actorName || "Unknown" },
    { label: "Actor email", value: event.actorEmail || "Not available" },
    { label: "Actor type", value: humanize(event.actorAccountType || event.actorType) },
    { label: "Actor ID", value: event.actorPublicId || event.actorId || "—" },
  ] : [];
  const requestItems: DefinitionItem[] = event ? [
    { label: "Request ID", value: event.requestId || "—" },
    { label: "IP address", value: event.ipAddress || "Not recorded" },
    { label: "User agent", value: event.userAgent || "Not recorded", span: 2 },
  ] : [];

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title={event ? humanize(event.action) : "Audit event"} description={event ? `Immutable record of an administrative change · ${dateTime(event.createdAt)}` : "Audit event"} actions={<Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading audit event" errorTitle="Audit event unavailable" emptyIcon={ClipboardList} onRetry={() => query.refetch()}>
        {event ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="space-y-4">
              <DetailSection title="Event overview" description="What happened and why.">
                <DefinitionGrid items={overviewItems} columns={2} />
              </DetailSection>
              {changedKeys.length ? (
                <DetailSection title="Changes" description="Fields recorded before and after this action.">
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Before</th><th className="w-6" /><th className="px-3 py-2 text-left">After</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {changedKeys.map((key) => (
                          <tr key={key}>
                            <td className="px-3 py-2 align-top font-medium text-foreground">{humanize(key)}</td>
                            <td className="max-w-40 truncate px-3 py-2 align-top text-muted-foreground">{displayValue(event.before?.[key])}</td>
                            <td className="px-1 py-2 align-top text-muted-foreground"><ArrowRight className="size-3.5" /></td>
                            <td className="max-w-40 truncate px-3 py-2 align-top text-foreground">{displayValue(event.after?.[key])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DetailSection>
              ) : null}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700"><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{meta?.label}{event.entityPublicId ? ` · ${event.entityPublicId}` : ""}</p>
                  <p className="text-xs text-muted-foreground">Recorded {dateTime(event.createdAt)}</p>
                </div>
                {entityLink ? <Link href={entityLink} className="shrink-0 text-xs font-medium text-brand-gold hover:underline">View record</Link> : null}
              </div>
              <DetailSection title="Actor" description="Who performed this action.">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><User className="size-3.5" /> Identity resolved at the time of this request</div>
                <DefinitionGrid items={actorItems} columns={1} />
              </DetailSection>
              <DetailSection title="Request context" description="Origin metadata captured for this request.">
                <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Globe className="size-3.5" /> Network origin</span>
                  <span className="flex items-center gap-1"><Monitor className="size-3.5" /> Client details</span>
                </div>
                <DefinitionGrid items={requestItems} columns={1} />
              </DetailSection>
            </div>
          </div>
        ) : null}
      </QueryState>
    </div>
  );
}
