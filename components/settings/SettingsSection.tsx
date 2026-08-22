"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Save } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiPatch, useApiQuery } from "@/lib/query";

export function SettingsSection() {
  const [platformName, setPlatformName] = useState("");
  const settingsQuery = useApiQuery<Record<string, unknown>>(["admin", "settings"], "/admin/settings");
  const saveSettingsMutation = useApiPatch<Record<string, unknown>, Record<string, unknown>>("/admin/settings", ["admin", "settings"]);

  useEffect(() => {
    if (settingsQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlatformName(String(settingsQuery.data.platformName || "Hook"));
    }
  }, [settingsQuery.data]);

  async function save() {
    await saveSettingsMutation.mutateAsync({ platformName: platformName.trim() || "Hook" });
  }

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="size-5 text-brand-gold" /> Workspace profile
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          The name shown across the admin dashboard and in operational communication.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="max-w-sm space-y-2">
          <Label htmlFor="platform-name">Platform name</Label>
          <Input
            id="platform-name"
            value={platformName}
            onChange={(event) => setPlatformName(event.target.value)}
            placeholder="Hook"
            disabled={settingsQuery.isLoading}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="brand"
            disabled={saveSettingsMutation.isPending || settingsQuery.isLoading}
            onClick={() => void save()}
          >
            {saveSettingsMutation.isPending ? <HookLoader size="button" /> : <><Save /> Save changes</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
