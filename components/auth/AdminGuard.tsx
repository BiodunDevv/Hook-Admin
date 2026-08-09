"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dashboardPath, isStaffUser } from "@/lib/auth-routing";
import { useAccountSession } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAccountSession();
  const valid = isStaffUser(session.data);

  useEffect(() => {
    if (session.isSuccess && session.data && !valid) {
      router.replace(dashboardPath(session.data));
    } else if (session.isError || (session.isSuccess && !session.data)) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session.data, session.isError, session.isSuccess, valid]);

  if (session.isLoading || session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <HookLoader size="page" label="Checking admin session..." />
      </div>
    );
  }

  if (!valid) return null;

  return children;
}
