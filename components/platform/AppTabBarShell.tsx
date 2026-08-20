"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Camera,
  Package,
  Store,
  User,
  LayoutDashboard,
  Search,
  ShoppingCart,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { HookLogo } from "@/components/shared/HookLogo";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { MessagesBell } from "@/components/partner/MessagesBell";
import { ShoppingForIndicator } from "@/components/partner/ShoppingForIndicator";
import { Button } from "@/components/ui/button";
import { clearSession, logoutAccount } from "@/lib/api";
import { PortalGuard } from "@/components/platform/PortalGuard";
import { APP_TAB_BAR_CONTENT_INSET, APP_TAB_BAR_HEIGHT, APP_TAB_BAR_BOTTOM_GAP } from "@/lib/tab-bar-layout";

type PortalType = "runner" | "partner";

type TabConfig = {
  label: string;
  icon: LucideIcon;
  href: string;
  match?: (pathname: string) => boolean;
};

const runnerTabs: TabConfig[] = [
  { label: "Home", icon: Home, href: "/runner/dashboard" },
  { label: "Capture", icon: Camera, href: "/runner/submissions" },
  { label: "Orders", icon: Package, href: "/runner/fulfilments" },
  {
    label: "Activity",
    icon: Store,
    href: "/runner/markets",
    match: (pathname) => pathname.startsWith("/runner/markets") || pathname.startsWith("/runner/availability"),
  },
  {
    label: "Profile",
    icon: User,
    href: "/runner/profile",
    match: (pathname) => pathname.startsWith("/runner/profile") || pathname.startsWith("/runner/security"),
  },
];

const partnerTabs: TabConfig[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/partner/dashboard" },
  { label: "Browse", icon: Search, href: "/partner/browse" },
  { label: "Basket", icon: ShoppingCart, href: "/partner/basket" },
  { label: "Orders", icon: Package, href: "/partner/orders" },
  {
    label: "Profile",
    icon: User,
    href: "/partner/profile",
    match: (pathname) =>
      pathname.startsWith("/partner/profile")
      || pathname.startsWith("/partner/security")
      || pathname.startsWith("/partner/location")
      || pathname.startsWith("/partner/customers")
      || pathname.startsWith("/partner/fulfilment"),
  },
];

function isTabActive(tab: TabConfig, pathname: string) {
  if (tab.match) return tab.match(pathname);
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function AppTabBarShell({
  type,
  children,
}: {
  type: PortalType;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${type}`;

  if (pathname === `${base}/activate`) return <>{children}</>;

  /**
   * A negotiation is a focused, full-screen conversation — like a chat detail
   * screen on mobile, it shouldn't compete with a bottom tab bar for space.
   * Header stays (for logout/back-navigation context) but the tabs don't.
   */
  const isNegotiationDetail = type === "partner" && /^\/partner\/messages\/[^/]+$/.test(pathname);

  async function logout() {
    try {
      await logoutAccount();
    } catch {
      clearSession();
    }
    router.replace("/auth/login");
  }

  const tabs = type === "runner" ? runnerTabs : partnerTabs;

  return (
    <PortalGuard type={type}>
      <div className="min-h-screen bg-[#F5F5F5]">
        {/* Header shares the page background so the app reads as one continuous surface. */}
        <header className="sticky top-0 z-40 bg-[#F5F5F5]/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between gap-3 px-5">
            <div className="flex min-w-0 items-center gap-3">
              <HookLogo className="shrink-0 text-xl" />
              {type === "partner" && <ShoppingForIndicator />}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {type === "partner" && <MessagesBell />}
              <NotificationBell scope={type} />
              <Button variant="ghost" size="icon" onClick={logout} title="Log out">
                <LogOut />
              </Button>
            </div>
          </div>
        </header>

        <main
          className="mx-auto w-full max-w-2xl px-5 pt-2"
          style={{ paddingBottom: isNegotiationDetail ? 24 : APP_TAB_BAR_CONTENT_INSET }}
        >
          {children}
        </main>

        {!isNegotiationDetail && (
          <nav
            className="fixed inset-x-0 z-50 flex justify-center px-3"
            style={{ bottom: APP_TAB_BAR_BOTTOM_GAP }}
          >
            <div
              className="relative flex w-full max-w-lg items-center gap-1 rounded-[31px] border border-black/5 bg-white px-1 shadow-[0_3px_14px_rgba(0,0,0,0.16)]"
              style={{ height: APP_TAB_BAR_HEIGHT }}
            >
              {tabs.map((tab) => {
                const active = isTabActive(tab, pathname);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
                  >
                    {active && (
                      <motion.div
                        layoutId={`${type}-tab-pill`}
                        className="absolute inset-1 -z-10 rounded-[25px] bg-[#FFC809]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.4 : 2}
                      className={active ? "text-black" : "text-[#B2B2B5]"}
                    />
                    <span
                      className={`text-[10px] font-semibold ${active ? "text-black" : "text-[#B2B2B5]"}`}
                    >
                      {tab.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </PortalGuard>
  );
}
