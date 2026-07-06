"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { HookLoader } from "@/components/shared/HookLoader";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSuccess() {
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Card className="w-full max-w-sm rounded-2xl border-zinc-200 shadow-card">
        <CardContent className="p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-gold text-2xl font-bold text-zinc-900">
              H
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">Hook Admin</h1>
            <p className="mt-1 text-sm text-zinc-500">Sign in to manage your marketplace</p>
          </div>
          <LoginForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <HookLoader size="page" label="Loading login..." />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
