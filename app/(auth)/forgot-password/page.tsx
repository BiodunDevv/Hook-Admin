"use client";

import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { HookLoader } from "@/components/shared/HookLoader";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[420px] items-center justify-center">
          <HookLoader size="page" label="Loading password recovery..." />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
