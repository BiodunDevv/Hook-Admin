"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureAccountSession } from "@/lib/api";
import { dashboardPath } from "@/lib/auth-routing";

/** Entry point: routes straight to the right dashboard by session, or to sign-in. No splash, no wait. */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await ensureAccountSession();
        if (active) router.replace(session ? dashboardPath(session) : "/auth/login");
      } catch {
        if (active) router.replace("/auth/login");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return <div className="min-h-[100dvh] bg-background" aria-busy="true" />;
}
