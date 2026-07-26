"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2 } from "lucide-react";
import { useApiPatch, useApiQuery } from "@/lib/query";

export function SettingsSection() {
  const [settings, setSettings] = useState({
    platformName: "",
    supportEmail: "",
    workspaceUrl: "admin.hook.app",
    currency: "NGN",
    timezone: "Africa/Lagos",
  });
  const [status, setStatus] = useState("");
  const settingsQuery = useApiQuery<Record<string, unknown>>(["admin", "settings"], "/admin/settings");
  const saveSettingsMutation = useApiPatch<Record<string, unknown>, Record<string, unknown>>("/admin/settings", ["admin", "settings"]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (settingsQuery.data) {
        const data = settingsQuery.data;
        setSettings((current) => ({
          ...current,
          platformName: String(data.platformName || "Hook"),
          supportEmail: String(data.supportEmail || "support@hook.local"),
          currency: String(data.currency || "NGN"),
          timezone: String(data.timezone || "Africa/Lagos"),
        }));
      }
      if (settingsQuery.error) {
        setStatus(settingsQuery.error instanceof Error ? settingsQuery.error.message.replace(/^\d+:\s*/, "") : "Failed to load settings");
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [settingsQuery.data, settingsQuery.error]);

  async function saveSettings() {
    setStatus("Saving...");
    try {
      const data = await saveSettingsMutation.mutateAsync(settings);
      setSettings((current) => ({ ...current, ...data }));
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save settings");
    }
  }

  return (
    <Card className="flex-1 border-zinc-200 shadow-sm">
      <CardContent className="p-8">
        <div className="mb-8">
          <h3 className="mb-1 text-lg font-bold text-zinc-900">Workspace Profile</h3>
          <p className="text-sm text-zinc-500">Update your company details and regional settings.</p>
        </div>

        {/* Logo Upload Section */}
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400">
            <Building2 size={32} strokeWidth={1.5} />
          </div>
          <div>
            <div className="mb-2 flex gap-3">
              <Button variant="outline" size="sm" className="font-semibold">Upload Logo</Button>
              <Button size="sm" className="bg-red-50 font-semibold text-red-600 hover:bg-red-100">Remove</Button>
            </div>
            <p className="text-xs text-zinc-500">Recommended size: 256x256px. Max file size: 2MB.</p>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="company-name" className="text-sm font-medium text-zinc-900">Company Name</Label>
            <Input id="company-name" value={settings.platformName} onChange={(event) => setSettings({ ...settings, platformName: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="support-email" className="text-sm font-medium text-zinc-900">Support Email</Label>
            <Input id="support-email" type="email" value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} />
          </div>
        </div>

        <div className="mb-10 space-y-1.5">
          <Label htmlFor="workspace-url" className="text-sm font-medium text-zinc-900">Workspace URL</Label>
          <div className="flex overflow-hidden rounded-lg border border-zinc-200 transition-colors focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-100">
            <span className="flex items-center border-r border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-500">
              https://
            </span>
            <input
              id="workspace-url"
              type="text"
              value={settings.workspaceUrl}
              onChange={(event) => setSettings({ ...settings, workspaceUrl: event.target.value })}
              className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
            />
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Localization Section */}
        <div>
          <h3 className="mb-1 text-base font-bold text-zinc-900">Localization</h3>
          <p className="mb-6 text-sm text-zinc-500">Set default language and currency for your workspace.</p>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-sm font-medium text-zinc-900">Default Currency</Label>
              <Input id="currency" className="bg-zinc-50" value={settings.currency} onChange={(event) => setSettings({ ...settings, currency: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-sm font-medium text-zinc-900">Timezone</Label>
              <Input id="timezone" className="bg-zinc-50" value={settings.timezone} onChange={(event) => setSettings({ ...settings, timezone: event.target.value })} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button type="button" variant="brand" onClick={saveSettings}>Save Settings</Button>
            {status && <span className="text-sm text-zinc-500">{status}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
