"use client";

import { useEffect, useState } from "react";
import { Boxes, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

export function InventorySettingsSection() {
  const query = useApiQuery<{ lowStockThreshold: number }>(
    ["commerce", "inventory-settings"],
    "/admin/commerce/inventory-settings",
  );
  const [threshold, setThreshold] = useState("5");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep the editable draft aligned with the server response.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.data) setThreshold(String(query.data.lowStockThreshold ?? 5));
  }, [query.data]);

  async function save() {
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    const value = Number(threshold);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return toast.error("Threshold must be a whole number between 0 and 100");
    }
    setSaving(true);
    try {
      await apiPatch("/admin/commerce/inventory-settings", {
        lowStockThreshold: value,
        reason: reason.trim(),
      });
      toast.success("Inventory settings updated");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update inventory settings",
      );
    } finally {
      setSaving(false);
    }
  }

  if (query.isLoading)
    return (
      <div className="grid min-h-60 place-items-center">
        <HookLoader label="Loading inventory settings" />
      </div>
    );
  if (query.isError)
    return (
      <QueryState
        error={query.error}
        errorTitle="Inventory settings could not load"
        onRetry={() => void query.refetch()}
      />
    );

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Boxes className="size-5 text-brand-gold" /> Inventory
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Controls when customers see a low-stock warning on a product.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="low-stock-threshold">Low stock threshold</Label>
          <Input
            id="low-stock-threshold"
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
          />
          <p className="text-xs leading-5 text-zinc-500">
            Customers see &ldquo;Only N left&rdquo; once a product&apos;s available stock drops to this
            number or below. Set to 0 to never show the warning.
          </p>
        </div>

        <div className="grid gap-4 rounded-lg border bg-zinc-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="inventory-reason">Audit reason</Label>
            <Input
              id="inventory-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is the threshold changing?"
            />
          </div>
          <Button variant="brand" disabled={saving} onClick={() => void save()}>
            {saving ? <HookLoader size="button" /> : <><Save /> Save threshold</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
