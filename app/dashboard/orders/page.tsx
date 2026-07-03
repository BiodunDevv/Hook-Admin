"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";

export default function OrdersPage() {
  const [tab, setTab] = useState("All");

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Orders"
        description="Manage and track all customer orders in real-time."
        actions={
          <>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Download size={15} /> <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button variant="brand" size="sm" className="flex items-center gap-1.5">
              <Plus size={16} /> Create Order
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card">
        <OrderFilters tab={tab} onTabChange={setTab} />
        <div className="overflow-x-auto">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
}
