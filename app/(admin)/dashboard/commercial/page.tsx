"use client";

import Link from "next/link";
import { CirclePause, CirclePercent, FilePenLine, PackageCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogListState } from "@/components/catalog/CatalogListState";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useApiQuery } from "@/lib/query";
import { money, type CommercialProduct, type CursorPage } from "@/lib/catalog";

interface Dashboard {
  awaitingCommercial: number;
  drafts: number;
  awaitingPricing: number;
  awaitingNegotiationConfiguration: number;
  published: number;
  paused: number;
  availabilityUnconfirmed: number;
  averageMarginMinor: number;
}

export default function CommercialCatalogPage() {
  const dashboard = useApiQuery<Dashboard>(["admin", "commercial", "dashboard"], "/admin/commercial/dashboard");
  const products = useApiQuery<CursorPage<CommercialProduct>>(["admin", "commercial", "products"], "/admin/commercial/products?limit=50");
  const stats = [
    ["Drafts", dashboard.data?.drafts || 0, FilePenLine],
    ["Published", dashboard.data?.published || 0, PackageCheck],
    ["Paused", dashboard.data?.paused || 0, CirclePause],
    ["Average margin", money(dashboard.data?.averageMarginMinor), CirclePercent],
  ] as const;
  return <div className="w-full space-y-5 px-4 py-5"><PageHeader title="Commercial Catalog" description="Complete customer content, approve pricing, configure negotiation, and publish." />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon]) => <Card key={label} className="rounded-lg shadow-none"><CardContent className="flex items-center gap-3 p-4"><Icon className="size-4 text-muted-foreground" /><div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>
    <Card className="overflow-hidden rounded-lg shadow-none"><CatalogListState loading={products.isLoading} error={products.isError} empty={!products.isLoading && !products.data?.data.length} />
      {products.data?.data.map((product) => <Link key={product.publicId} href={`/dashboard/commercial/${product.publicId}`} className="grid gap-3 border-b p-4 hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_150px_140px_120px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-medium">{product.title}</p><p className="text-xs text-muted-foreground">{product.publicId}</p></div><p className="text-sm font-medium">{money(product.pricing?.effectivePriceMinor)}</p><CatalogStatusBadge status={product.status} /><p className="text-right text-xs text-muted-foreground">{product.pricing ? `${product.pricing.marginPercentage}% margin` : "Pricing needed"}</p></Link>)}
    </Card>
  </div>;
}
