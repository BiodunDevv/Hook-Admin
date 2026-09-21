"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Coins, CreditCard, CalendarClock, FileText, Mail, Boxes, Smartphone, ShoppingCart, Megaphone, Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { CatalogAvailabilitySection } from "@/components/settings/CatalogAvailabilitySection";
import { PaymentProvidersSection } from "@/components/settings/PaymentProvidersSection";
import { EmailConfigurationSection } from "@/components/settings/EmailConfigurationSection";
import { HookCreditSection } from "@/components/settings/HookCreditSection";
import { InventorySettingsSection } from "@/components/settings/InventorySettingsSection";
import { LegalContentSection } from "@/components/settings/LegalContentSection";
import { PodSettingsSection } from "@/components/settings/PodSettingsSection";
import { CheckoutSettingsSection } from "@/components/settings/CheckoutSettingsSection";
import { BannersSection } from "@/components/settings/BannersSection";
import { AppUpdatesSection } from "@/components/settings/AppUpdatesSection";
import { useAdminSession } from "@/lib/query";
import { hasPermission } from "@/lib/permissions";
import { HookLoader } from "@/components/shared/HookLoader";

const settingsGroups = [
  {
    label: "Workspace",
    items: [
      { slug: "general", name: "General", description: "Name and contact details", icon: Building2 },
      { slug: "email-configuration", name: "Email", description: "Sender and templates", icon: Mail },
      { slug: "legal-content", name: "Legal content", description: "Terms, privacy, returns", icon: FileText },
    ],
  },
  {
    label: "Commerce",
    items: [
      { slug: "checkout", name: "Checkout", description: "Minimum order value", icon: ShoppingCart },
      { slug: "pay-on-delivery", name: "Pay on Delivery & VAT", description: "Fee, surcharge, limits, VAT", icon: Truck },
      { slug: "payment-providers", name: "Payments", description: "Providers and defaults", icon: CreditCard },
      { slug: "hook-credit", name: "Hook credit", description: "Earning, spending, referrals", icon: Coins },
    ],
  },
  {
    label: "Catalog",
    items: [
      { slug: "catalog-availability", name: "Availability", description: "How often stock is rechecked", icon: CalendarClock },
      { slug: "inventory", name: "Inventory", description: "Low-stock warnings", icon: Boxes },
    ],
  },
  {
    label: "App",
    items: [
      { slug: "banners", name: "Banners", description: "Marquee messages", icon: Megaphone },
      { slug: "app-updates", name: "App updates", description: "Releases and minimum build", icon: Smartphone },
    ],
  },
] as const;

const settingsMenu = settingsGroups.reduce<Array<(typeof settingsGroups)[number]["items"][number]>>((all, group) => [...all, ...group.items], []);
const DEFAULT_SECTION = settingsMenu[0].slug;

/** Panels with a dedicated section; anything else falls back to SettingsSection. */
const SETTINGS_PANELS: Record<string, () => React.ReactElement> = {
  checkout: () => <CheckoutSettingsSection />,
  "pay-on-delivery": () => <PodSettingsSection />,
  banners: () => <BannersSection />,
  "catalog-availability": () => <CatalogAvailabilitySection />,
  inventory: () => <InventorySettingsSection />,
  "hook-credit": () => <HookCreditSection />,
  "payment-providers": () => <PaymentProvidersSection />,
  "email-configuration": () => <EmailConfigurationSection />,
  "legal-content": () => <LegalContentSection />,
  "app-updates": () => <AppUpdatesSection />,
};

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAdminSession();
  const visibleMenu = settingsMenu.filter((item) => hasPermission(session.data, item.slug === "app-updates" ? "app_releases.view" : "settings.view"));
  const visibleSlugs = new Set<string>(visibleMenu.map((item) => item.slug));
  const requestedSection = searchParams.get("section");
  const activeSection = visibleMenu.some((item) => item.slug === requestedSection)
    ? (requestedSection as string)
    : (visibleMenu[0]?.slug ?? DEFAULT_SECTION);

  function selectSection(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", slug);
    router.replace(`/dashboard/settings?${params.toString()}`);
  }

  if (session.isLoading) return <HookLoader />;
  if (!visibleMenu.length) return <p role="alert">You do not have permission to view settings.</p>;

  return (
    <div className="flex w-full flex-col gap-5 px-4 py-5 lg:h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="shrink-0"><PageHeader
        title="Platform Settings"
        description="Workspace, commerce, catalog and app behaviour, grouped by what you are trying to change."
      /></div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-8">
        {/* Grouped navigation: sticky column on desktop, scrolling chips on mobile */}
        <nav aria-label="Settings sections" className="lg:w-[250px] lg:shrink-0 lg:overflow-y-auto lg:overscroll-contain lg:pb-6 lg:pr-1 [scrollbar-width:thin]">
          <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
            {settingsGroups.map((group) => {
              const items = group.items.filter((item) => visibleSlugs.has(item.slug));
              if (!items.length) return null;
              return (
                <div key={group.label} className="flex gap-1 lg:flex-col">
                  <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 lg:block">{group.label}</p>
                  {items.map((item) => (
                    <button
                      key={item.slug}
                      aria-current={activeSection === item.slug ? "page" : undefined}
                      onClick={() => selectSection(item.slug)}
                      className={cn(
                        "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        activeSection === item.slug ? "bg-zinc-900 font-semibold text-white shadow-sm" : "font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                      )}
                    >
                      <item.icon size={16} className={cn("shrink-0", activeSection === item.slug ? "text-brand-gold" : "text-zinc-400")} />
                      <span className="min-w-0">
                        <span className="block whitespace-nowrap lg:whitespace-normal">{item.name}</span>
                        <span className={cn("hidden text-[11px] font-normal lg:block", activeSection === item.slug ? "text-zinc-300" : "text-zinc-400")}>{item.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Section content */}
        <div className="min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pb-6 lg:pr-1 [scrollbar-width:thin]">
          {SETTINGS_PANELS[activeSection]?.() ?? <SettingsSection />}
        </div>
      </div>
    </div>
  );
}
