"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HookLoader } from "@/components/shared/HookLoader";
import { dashboardPath } from "@/lib/auth-routing";
import { useAccountSession } from "@/lib/query";

export function PortalGuard({
  type,
  children,
}: {
  type: "runner" | "partner";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAccountSession();
  const valid = session.data?.accountType === type;

  useEffect(() => {
    if (session.isSuccess && session.data && !valid) {
      router.replace(dashboardPath(session.data));
    } else if (session.isError || (session.isSuccess && !session.data)) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session.data, session.isError, session.isSuccess, type, valid]);

  if (session.isLoading || session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <HookLoader size="page" label={`Checking ${type} session...`} />
      </div>
    );
  }

  if (!valid) return null;
  return children;
}
