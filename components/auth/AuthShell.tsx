"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { FloatingPaths } from "@/components/floating-paths";
import { HookLoader } from "@/components/shared/HookLoader";
import { useAdminSession } from "@/lib/query";

const copy = {
  "/login": {
    eyebrow: "Admin operations",
    title: "Secure marketplace control for Hook teams.",
    description:
      "Sign in to manage orders, vendors, dispatch, financials, and AI negotiation activity from one protected console.",
    footer: "Hook admin security layer",
  },
  "/forgot-password": {
    eyebrow: "Account recovery",
    title: "Recover access without slowing operations down.",
    description:
      "Request a one time password for a verified admin account and continue the reset flow securely.",
    footer: "OTP protected password recovery",
  },
  "/reset-password": {
    eyebrow: "Password reset",
    title: "Set a fresh admin password with OTP verification.",
    description:
      "Use the code sent to your email to restore access and invalidate old admin sessions.",
    footer: "Hook admin reset workflow",
  },
};

export function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminSession();
  const content = copy[pathname as keyof typeof copy] || copy["/login"];

  useEffect(() => {
    if (session.data) {
      router.replace("/dashboard");
    }
  }, [router, session.data]);

  if (session.isLoading || session.isPending || session.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <HookLoader size="page" label="Checking admin session..." />
      </div>
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(480px,0.95fr)_minmax(520px,1.05fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-zinc-950 text-white lg:block">
        <div className="absolute inset-x-0 bottom-0 h-[48%] text-brand-gold/30">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col justify-between p-6">
          <Logo tone="light" className="text-5xl" />

          <div className="max-w-xl pb-16">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-brand-gold">
              {content.eyebrow}
            </p>
            <h1 className="mt-5 text-3xl font-semibold leading-[1.08] tracking-tight">
              {content.title}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-zinc-300">
              {content.description}
            </p>
          </div>

          <p className="text-sm text-zinc-500">{content.footer}</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white px-4 py-4">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
