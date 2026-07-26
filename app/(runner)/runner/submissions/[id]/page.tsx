"use client";

import { useParams } from "next/navigation";
import { RunnerSubmissionForm } from "@/components/catalog/RunnerSubmissionForm";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";
import type { ProductSubmission } from "@/lib/catalog";

interface MarketsResponse { markets: Array<{ publicId: string; name: string }> }
interface Category { publicId: string; name: string }

export default function RunnerSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const submission = useApiQuery<ProductSubmission>(["runner", "submission", id], `/runner/product-submissions/${id}`);
  const markets = useApiQuery<MarketsResponse>(["runner", "markets"], "/runner/markets");
  const categories = useApiQuery<Category[]>(["public", "categories"], "/public/categories");
  if (submission.isLoading || markets.isLoading || categories.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading submission" /></div>;
  if (submission.isError || !submission.data) return <p className="text-sm text-destructive">This submission could not be loaded.</p>;
  return <div><div className="mb-5 flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">{submission.data.basicTitle}</h1><p className="text-sm text-muted-foreground">{submission.data.publicId}</p></div><CatalogStatusBadge status={submission.data.status} /></div><RunnerSubmissionForm submission={submission.data} markets={markets.data?.markets || []} categories={categories.data || []} /></div>;
}
