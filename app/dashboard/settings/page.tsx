"use client";

import { useState } from "react";
import { Building2, Shield, CreditCard, User, Key, Bell, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { OperatingStatesSection } from "@/components/settings/OperatingStatesSection";
import { SuperAdminGuard } from "@/components/auth/PermissionGuard";

const settingsMenu = [
  { name: "General", icon: Building2 },
  { name: "Operating States", icon: MapPin },
  { name: "Security", icon: Shield },
  { name: "Notifications", icon: Bell },
  { name: "Billing & Plans", icon: CreditCard },
  { name: "Team Management", icon: User },
  { name: "API & Webhooks", icon: Key },
];

export default function SettingsPage() {
  const [activeSetting, setActiveSetting] = useState("General");

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Platform Settings"
        description="Manage your enterprise account, security preferences, and team access."
        actions={
          <SuperAdminGuard>
            <Button variant="brand" size="sm" className="px-5">
              Save Changes
            </Button>
          </SuperAdminGuard>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        {/* Left Inner Navigation — horizontal scroll on mobile, vertical on lg */}
        <div className="flex overflow-x-auto gap-1 pb-1 lg:w-[220px] lg:flex-col lg:overflow-x-visible lg:pb-0 xl:w-[240px]">
          {settingsMenu.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveSetting(item.name)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors lg:w-full lg:gap-3 lg:px-4 lg:py-3",
                activeSetting === item.name
                  ? "border border-zinc-100 bg-white font-semibold text-zinc-900 shadow-sm"
                  : "font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <item.icon
                size={16}
                className={cn(
                  "shrink-0 lg:size-[18px]",
                  activeSetting === item.name ? "text-brand-gold" : "text-zinc-400"
                )}
              />
              <span className="whitespace-nowrap lg:whitespace-normal">{item.name}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Form Area */}
        <div className="flex-1 min-w-0">
          {activeSetting === "Operating States" ? <OperatingStatesSection /> : <SettingsSection />}
        </div>
      </div>
    </div>
  );
}
