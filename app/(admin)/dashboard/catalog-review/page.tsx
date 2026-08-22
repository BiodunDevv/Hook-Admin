"use client";

import Link from "next/link";
import { ClipboardCheck, Clock3, RotateCcw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogListState } from "@/components/catalog/CatalogListState";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useApiQuery } from "@/lib/query";
import type { CursorPage, ProductSubmission } from "@/lib/catalog";

interface Dashboard { pending: number; inReview: number; changesRequested: number; approvedToday: number }

export default function CatalogReviewPage() {
  const dashboard = useApiQuery<Dashboard>(["admin", "catalog-review", "dashboard"], "/admin/catalog/review/dashboard");
  const queue = useApiQuery<CursorPage<ProductSubmission>>(["admin", "catalog-review", "queue"], "/admin/catalog/review?limit=50");
  const stats = [
    ["Awaiting review", dashboard.data?.pending || 0, Clock3],
    ["In review", dashboard.data?.inReview || 0, ClipboardCheck],
    ["Changes requested", dashboard.data?.changesRequested || 0, RotateCcw],
    ["Approved today", dashboard.data?.approvedToday || 0, ShieldCheck],
  ] as const;
  return <div className="w-full space-y-5 px-4 py-5"><PageHeader title="Catalog Review" description="Verify Market Associate submissions before they enter the Commercial Catalog." />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <Card key={label} className="rounded-lg shadow-none"><CardContent className="flex items-center gap-3 p-4"><Icon className="size-4 text-muted-foreground" /><div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>
    <Card className="overflow-hidden rounded-lg shadow-none"><CatalogListState loading={queue.isLoading} error={queue.isError} empty={!queue.isLoading && !queue.data?.data.length} />
      {queue.data?.data.map((row) => <Link key={row.publicId} href={`/dashboard/catalog-review/${row.publicId}`} className="grid gap-3 border-b p-4 hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_180px_140px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.basicTitle}</p><p className="text-xs text-muted-foreground">{row.publicId}</p></div><p className="text-xs text-muted-foreground">{row.market?.name || "Assigned Market"}</p><CatalogStatusBadge status={row.status} /></Link>)}
    </Card>
  </div>;
}
