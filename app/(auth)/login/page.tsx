"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { HookLoader } from "@/components/shared/HookLoader";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSuccess() {
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  }

  return <LoginForm onSuccess={handleSuccess} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[420px] items-center justify-center">
          <HookLoader size="page" label="Loading login..." />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
