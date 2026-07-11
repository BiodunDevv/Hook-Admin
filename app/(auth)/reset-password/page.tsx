"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { HookLoader } from "@/components/shared/HookLoader";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[420px] items-center justify-center">
          <HookLoader size="page" label="Loading reset..." />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
