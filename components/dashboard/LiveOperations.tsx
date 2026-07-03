 "use client";

import { useEffect, useState } from "react";
import { Truck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { apiGet } from "@/lib/api";

interface Delivery {
  id: string;
  status: string;
  driver?: { firstName?: string; lastName?: string; email?: string };
  deliveryLocation?: { address?: string };
  pickupLocation?: { name?: string; address?: string };
}

export default function LiveOperations() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Delivery[]>("/admin/dispatch/active")
      .then(setDeliveries)
      .catch(() => setDeliveries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="shadow-card border-zinc-200">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="font-semibold text-zinc-900">Live Operations</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-zinc-500">
            View Map
          </Button>
        </div>
        <p className="mt-0.5 text-sm text-zinc-400">
          {deliveries.length} active deliveries right now
        </p>

        <ScrollArea className="mt-4 h-[260px]">
          <ul className="space-y-3 pr-2">
            {loading && <li className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 text-sm text-zinc-500">Loading deliveries...</li>}
            {!loading && deliveries.length === 0 && <li className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3 text-sm text-zinc-500">No active deliveries.</li>}
            {deliveries.map((d) => {
              const driver = `${d.driver?.firstName || ""} ${d.driver?.lastName || ""}`.trim() || d.driver?.email || "Unassigned";
              return (
              <li
                key={d.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900">
                    {d.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-600">
                  <Truck size={14} className="text-zinc-400" />
                  {driver}
                  <span className="text-zinc-300">•</span>
                  <span className="text-zinc-400">Live job</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>{d.pickupLocation?.name || d.pickupLocation?.address || "Pickup"}</span>
                  <ArrowRight size={12} />
                  <span>{d.deliveryLocation?.address || "Delivery"}</span>
                </div>
              </li>
            );})}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
