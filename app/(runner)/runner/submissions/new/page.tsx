"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RunnerSubmissionForm } from "@/components/catalog/RunnerSubmissionForm";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileHeader } from "@/components/mobile/MobileUI";
import { useApiQuery } from "@/lib/query";

interface MarketsResponse {
  markets: Array<{ publicId: string; name: string }>;
}
interface Category {
  publicId: string;
  name: string;
}

export default function NewRunnerSubmissionPage() {
  const router = useRouter();
  const markets = useApiQuery<MarketsResponse>(["runner", "markets"], "/runner/markets");
  const categories = useApiQuery<Category[]>(["public", "categories"], "/public/categories");

  if (markets.isLoading || categories.isLoading)
    return (
      <div className="grid min-h-80 place-items-center">
        <HookLoader label="Preparing capture form" />
      </div>
    );
  if (markets.isError || categories.isError)
    return <p className="text-sm text-destructive">The capture form could not be prepared.</p>;

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#8F8F8F]"
      >
        <ArrowLeft size={15} /> Captures
      </button>
      <MobileHeader
        title="New capture"
        subtitle="Photograph and record exactly what is available in your Market."
      />
      <RunnerSubmissionForm markets={markets.data?.markets || []} categories={categories.data || []} />
    </div>
  );
}
