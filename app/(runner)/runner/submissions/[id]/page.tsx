"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RunnerSubmissionForm } from "@/components/catalog/RunnerSubmissionForm";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";
import type { ProductSubmission } from "@/lib/catalog";
import type { SizingGuide } from "@/lib/sizing-guide";

interface MarketsResponse { markets: Array<{ publicId: string; name: string }> }
interface Category { publicId: string; name: string; sizingGuide?: SizingGuide | null }

const statusDescription: Record<string, string> = {
  draft: "Still a draft. Save your progress or submit when it's ready for review.",
  submitted: "Waiting in the queue for Catalog Review to pick it up.",
  in_review: "Catalog Review is actively checking this submission.",
  changes_requested: "Catalog Review asked for changes — see the feedback below.",
  approved: "Approved and promoted to the live catalog.",
  rejected: "This submission was not approved.",
};

export default function RunnerSubmissionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const submission = useApiQuery<ProductSubmission>(["runner", "submission", id], `/runner/product-submissions/${id}`);
  const markets = useApiQuery<MarketsResponse>(["runner", "markets"], "/runner/markets");
  const categories = useApiQuery<Category[]>(["public", "categories"], "/public/categories");
  if (submission.isLoading || markets.isLoading || categories.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading submission" /></div>;
  if (submission.isError || !submission.data) return <p className="text-sm text-destructive">This submission could not be loaded.</p>;
  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#8F8F8F]"
      >
        <ArrowLeft size={15} /> Captures
      </button>
      <div className="mb-5 px-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-[22px] font-bold leading-tight tracking-tight text-black">
            {submission.data.basicTitle || "Untitled submission"}
          </h1>
          <CatalogStatusBadge status={submission.data.status} />
        </div>
        <p className="mt-1.5 text-[13px] leading-5 text-[#8F8F8F]">
          {statusDescription[submission.data.status] || submission.data.publicId}
        </p>
      </div>
      <RunnerSubmissionForm submission={submission.data} markets={markets.data?.markets || []} categories={categories.data || []} />
    </div>
  );
}
