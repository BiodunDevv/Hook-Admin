"use client";

import { LegalContentView } from "@/components/legal/LegalContentView";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

type LegalContent = {
  title: string;
  bodyHtml: string;
  version: number;
  effectiveDate: string | null;
};

export default function ReturnsPage() {
  const query = useApiQuery<LegalContent>(["public", "legal", "returns"], "/public/legal/returns");
  if (query.isLoading) {
    return <div className="grid min-h-screen place-items-center"><HookLoader label="Loading Returns Policy" /></div>;
  }
  return (
    <LegalContentView
      title={query.data?.title || "Returns Policy"}
      bodyHtml={query.data?.bodyHtml || "<p>The Returns Policy is currently unavailable.</p>"}
      effectiveDate={query.data?.effectiveDate}
    />
  );
}
