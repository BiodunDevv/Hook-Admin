"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/lib/query";

/** Negotiation entry point: just a badge linking to the full messages page, with no dropdown preview. */
export function MessagesBell() {
  const query = useApiQuery<{ count: number }>(
    ["partner", "negotiations", "active-count"],
    "/partner/negotiations/active-count",
  );
  const count = query.data?.count ?? 0;

  return (
    <Button variant="ghost" size="icon" className="relative" asChild title="Messages">
      <Link href="/partner/messages">
        <MessagesSquare />
        {count > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-[#FFC809] px-1 text-[10px] font-black leading-none text-black ring-2 ring-[#F5F5F5]">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
