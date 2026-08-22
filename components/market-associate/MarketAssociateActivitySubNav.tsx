"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs: Array<[string, string]> = [
  ["Assigned markets", "/market-associate/markets"],
  ["Availability checks", "/market-associate/availability"],
];

export function MarketAssociateActivitySubNav() {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex gap-1 border-b">
      {tabs.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className={`border-b-2 px-3 pb-2 text-sm font-medium ${pathname.startsWith(href) ? "border-[#FFC809] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
