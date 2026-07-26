import { Suspense } from "react";
import { AccountActivationForm } from "@/components/platform/AccountActivationForm";
import { HookLoader } from "@/components/shared/HookLoader";

export default function PartnerActivationPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center"><HookLoader /></main>}>
      <AccountActivationForm accountType="partner" />
    </Suspense>
  );
}
