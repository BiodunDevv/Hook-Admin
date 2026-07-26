"use client";

import { MapPin, Power } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HookLoader } from "@/components/shared/HookLoader";
import { StateChip, useOperationalStates } from "@/components/operations/StateDropdown";
import { apiPatch } from "@/lib/api";

export function OperatingStatesSection() {
  const states = useOperationalStates(false);
  const rows = states.data || [];
  const activeCount = rows.filter((row) => row.isEnabled).length;

  async function toggle(code: string, isEnabled: boolean) {
    try {
      await apiPatch(`/admin/operations/states/${code}`, { isEnabled: !isEnabled });
      toast.success(!isEnabled ? "State enabled for operations" : "State disabled for operations");
      states.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update state");
    }
  }

  return (
    <Card className="flex-1 border-zinc-200 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Operating States</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
              Choose the Nigerian states where Hook operates markets, runners, dispatch hubs, and customer delivery.
            </p>
          </div>
          <StateChip name={`${activeCount} active`} />
        </div>

        {states.isLoading && (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 py-12">
            <HookLoader label="Loading operating states..." />
          </div>
        )}

        {!states.isLoading && (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((state) => (
              <div key={state.code} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-zinc-900">
                    <MapPin size={14} className="text-zinc-400" />
                    {state.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{state.code} · Nigeria</p>
                </div>
                <Button
                  type="button"
                  variant={state.isEnabled ? "outline" : "brand"}
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => toggle(state.code, state.isEnabled)}
                >
                  <Power size={13} />
                  {state.isEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
