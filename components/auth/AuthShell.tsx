"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FloatingPaths } from "@/components/floating-paths";
import { HookLogo } from "@/components/shared/HookLogo";
import { HookLoader } from "@/components/shared/HookLoader";
import { useAccountSession } from "@/lib/query";
import { dashboardPath } from "@/lib/auth-routing";

const copy = {
  "/auth/login": {
    eyebrow: "Hook operations",
    title: "One secure workspace for every Hook team.",
    description:
      "Staff, Market Associates, and Hook Partners are automatically taken to the workspace assigned to their account.",
    footer: "Hook identity and access",
  },
  "/forgot-password": {
    eyebrow: "Account recovery",
    title: "Recover access without slowing operations down.",
    description:
      "Request a one time password for your verified Hook account and continue securely.",
    footer: "OTP protected password recovery",
  },
  "/reset-password": {
    eyebrow: "Password reset",
    title: "Set a fresh Hook password with OTP verification.",
    description:
      "Use the code sent to your email to restore access and invalidate old admin sessions.",
    footer: "Hook admin reset workflow",
  },
};

export function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAccountSession();
  const content = copy[pathname as keyof typeof copy] || copy["/auth/login"];

  useEffect(() => {
    if (session.data) {
      router.replace(dashboardPath(session.data));
    }
  }, [router, session.data]);

  if (session.isLoading || session.isPending || session.data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <HookLoader size="page" label="Checking your session..." />
      </div>
    );
  }

  return (
    <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(480px,0.95fr)_minmax(520px,1.05fr)]">
      {/* Brand panel — desktop only */}
      <section className="relative hidden min-h-[100dvh] overflow-hidden bg-zinc-950 text-white lg:block">
        <div className="absolute inset-x-0 bottom-0 h-[48%] text-brand-gold/25">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Warm gold wash anchoring the brand side */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,color-mix(in_oklch,var(--color-brand-gold)_16%,transparent),transparent_70%)]" />

        <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between p-10">
          <HookLogo className="text-4xl text-white" />

          <div className="max-w-xl pb-16">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-brand-gold">
              {content.eyebrow}
            </p>
            <h1 className="mt-5 text-[2rem] font-semibold leading-[1.12] tracking-tight text-balance">
              {content.title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-zinc-400">
              {content.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="size-1.5 rounded-full bg-brand-gold" />
            {content.footer}
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex min-h-[100dvh] items-center justify-center overflow-y-auto px-6 py-10 md:px-8">
        {children}
      </section>
    </main>
  );
}
