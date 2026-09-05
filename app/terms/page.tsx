"use client";

import { LegalContentView } from "@/components/legal/LegalContentView";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

type LegalContent = {
  type: "terms" | "privacy";
  title: string;
  bodyHtml: string;
  effectiveDate: string | null;
};

export default function TermsPage() {
  const query = useApiQuery<LegalContent>(["public", "legal", "terms"], "/public/legal/terms");

  if (query.isLoading) {
    return <div className="grid min-h-screen place-items-center"><HookLoader label="Loading Terms of Service" /></div>;
  }

  return (
    <LegalContentView
      title={query.data?.title || "Terms of Service"}
      effectiveDate={query.data?.effectiveDate}
      bodyHtml={query.data?.bodyHtml || ""}
    />
  );
}
