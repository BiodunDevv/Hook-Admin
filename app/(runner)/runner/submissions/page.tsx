"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CatalogListState } from "@/components/catalog/CatalogListState";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { useApiQuery } from "@/lib/query";
import type { CursorPage, ProductSubmission } from "@/lib/catalog";

export default function RunnerSubmissionsPage() {
  const query = useApiQuery<CursorPage<ProductSubmission>>(["runner", "submissions"], "/runner/product-submissions?limit=50");
  const rows = query.data?.data || [];
  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold">Product submissions</h1><p className="text-sm text-muted-foreground">Draft, submit, and respond to Catalog Review.</p></div><Button asChild className="bg-[#FFC809] text-black hover:bg-[#f0bb00]"><Link href="/runner/submissions/new"><Plus /> New</Link></Button></div>
      <Card className="overflow-hidden rounded-lg shadow-none">
        <CatalogListState loading={query.isLoading} error={query.isError} empty={!query.isLoading && !rows.length} />
        {rows.map((row) => <Link key={row.publicId} href={`/runner/submissions/${row.publicId}`} className="flex items-center justify-between gap-3 border-b p-4 transition-colors last:border-0 hover:bg-muted/40"><div className="min-w-0"><p className="truncate text-sm font-medium">{row.basicTitle}</p><p className="mt-1 text-xs text-muted-foreground">{row.publicId} · Updated {new Date(row.updatedAt).toLocaleDateString()}</p></div><CatalogStatusBadge status={row.status} /></Link>)}
      </Card>
    </div>
  );
}
