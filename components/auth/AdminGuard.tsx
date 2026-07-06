"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminSession } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAdminSession();

  useEffect(() => {
    if (session.isError || (session.isSuccess && !session.data)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session.data, session.isError, session.isSuccess]);

  if (session.isLoading || session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <HookLoader size="page" label="Checking admin session..." />
      </div>
    );
  }

  if (!session.data) return null;

  return children;
}
