"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HookLoader } from "@/components/shared/HookLoader";
import { type AdminUser } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

export function PortalGuard({
  type,
  children,
}: {
  type: "runner" | "partner";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useApiQuery<AdminUser>(
    ["portal-session", type],
    "/auth/profile",
  );
  const valid = session.data?.accountType === type;

  useEffect(() => {
    if (session.isSuccess && session.data && !valid) {
      router.replace(session.data.accountType === "staff" ? "/dashboard" : `/${type}/login`);
    } else if (session.isError || (session.isSuccess && !session.data)) {
      router.replace(`/${type}/login?next=${encodeURIComponent(pathname)}`);
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
