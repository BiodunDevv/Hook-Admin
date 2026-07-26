"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Power, PackageSearch, Upload, ShieldAlert, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { cleanError, money } from "@/lib/admin-utils";

interface RecentUpload {
  id: string;
  title: string;
  image?: string | null;
  status: string;
  sellingPrice: number;
  createdAt: string;
}

interface FieldAgent {
  id: string;
  assignedMarket: string;
  isActive: boolean;
  coverageArea?: { lat?: number; lng?: number; radiusKm?: number };
  stats?: { productsUploaded?: number; pendingApproval?: number; approvedToday?: number };
  agent?: { email?: string; firstName?: string; lastName?: string; phone?: string };
  recentUploads?: RecentUpload[];
}

export default function RunnerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<FieldAgent>(["admin", "runners", id], `/admin/runners/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(
    `/admin/runners/${id}/toggle`,
    ["admin", "runners"],
    { successMessage: "Runner status updated" },
  );
  const agent = query.data;
  const name = `${agent?.agent?.firstName || ""} ${agent?.agent?.lastName || ""}`.trim() || agent?.agent?.email || "Runner";

  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader
        title={name}
        description={agent?.assignedMarket || "Runner profile"}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>
            {agent && (
              <Button variant="outline" size="sm" onClick={() => toggle.mutate(undefined)}>
                <Power size={15} /> {agent.isActive ? "Deactivate" : "Activate"}
              </Button>
            )}
          </>
        }
      />

      {query.isLoading && (
        <div className="flex items-center justify-center py-16">
          <HookLoader size="page" label="Loading Runner..." />
        </div>
      )}

      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}

      {agent && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard icon={Upload} tone="blue" label="Total Uploaded" value={agent.stats?.productsUploaded ?? 0} caption="All-time listings" />
            <KpiCard icon={ShieldAlert} tone="amber" label="Pending QA" value={agent.stats?.pendingApproval ?? 0} caption="Awaiting review" />
            <KpiCard icon={CheckCircle2} tone="green" label="Approved Today" value={agent.stats?.approvedToday ?? 0} caption="Cleared listings" />
            <KpiCard icon={MapPin} tone="zinc" label="Market" value={agent.assignedMarket} caption={agent.coverageArea?.radiusKm ? `${agent.coverageArea.radiusKm}km coverage` : "Assigned zone"} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Profile */}
            <Card className="rounded-lg border-zinc-200 py-0 shadow-card">
              <CardContent className="space-y-4 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">Status</span>
                  <StatusBadge status={agent.isActive ? "active" : "inactive"} />
                </div>
                <div>
                  <p className="text-zinc-500">Contact</p>
                  <p className="mt-1 font-medium text-zinc-900">{agent.agent?.email}</p>
                  {agent.agent?.phone && (
                    <a href={`tel:${agent.agent.phone}`} className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900">
                      <Phone size={11} /> {agent.agent.phone}
                    </a>
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-zinc-500"><MapPin size={13} /> Assigned market</p>
                  <p className="mt-1 font-medium text-zinc-900">{agent.assignedMarket}</p>
                  {agent.coverageArea?.lat && (
                    <p className="text-xs text-zinc-400">
                      {agent.coverageArea.lat.toFixed(4)}, {agent.coverageArea.lng?.toFixed(4)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent uploads */}
            <Card className="rounded-lg border-zinc-200 py-0 shadow-card lg:col-span-2">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-900">Recent Uploads</h3>
                {!agent.recentUploads?.length ? (
                  <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-400">
                    No uploads from this Runner yet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-zinc-200">
                    {agent.recentUploads.map((upload) => (
                      <Link
                        key={upload.id}
                        href={`/dashboard/products/${upload.id}`}
                        className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2.5 transition-colors last:border-0 hover:bg-zinc-50"
                      >
                        {upload.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={upload.image} alt={upload.title} className="size-9 shrink-0 rounded-md border border-zinc-200 object-cover" />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                            <PackageSearch size={14} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">{upload.title}</p>
                          <p className="text-xs text-zinc-400">{new Date(upload.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-zinc-700">{money(upload.sellingPrice)}</span>
                        <StatusBadge status={upload.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
