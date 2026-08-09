"use client";

import { RunnerSubmissionForm } from "@/components/catalog/RunnerSubmissionForm";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

interface MarketsResponse { markets: Array<{ publicId: string; name: string }> }
interface Category { publicId: string; name: string }

export default function NewRunnerSubmissionPage() {
  const markets = useApiQuery<MarketsResponse>(["runner", "markets"], "/runner/markets");
  const categories = useApiQuery<Category[]>(["public", "categories"], "/public/categories");
  if (markets.isLoading || categories.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Preparing capture form" /></div>;
  if (markets.isError || categories.isError) return <p className="text-sm text-destructive">The capture form could not be prepared.</p>;
  return <div><h1 className="mb-1 text-2xl font-semibold">New product submission</h1><p className="mb-5 text-sm text-muted-foreground">Capture exactly what is available in your assigned Market.</p><RunnerSubmissionForm markets={markets.data?.markets || []} categories={categories.data || []} /></div>;
}
