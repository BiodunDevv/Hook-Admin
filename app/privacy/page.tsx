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

export default function PrivacyPage() {
  const query = useApiQuery<LegalContent>(["public", "legal", "privacy"], "/public/legal/privacy");

  if (query.isLoading) {
    return <div className="grid min-h-screen place-items-center"><HookLoader label="Loading Privacy Policy" /></div>;
  }

  return (
    <LegalContentView
      title={query.data?.title || "Privacy Policy"}
      effectiveDate={query.data?.effectiveDate}
      bodyHtml={query.data?.bodyHtml || ""}
    />
  );
}
