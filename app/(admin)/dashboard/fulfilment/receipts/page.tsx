"use client";

import { useMemo, useState } from "react";
import { FileDown, Printer, ReceiptText, Tags } from "lucide-react";
import { CourierBadge, type CourierInfo } from "@/components/fulfilment/CourierBadge";
import { ReceiptSheet } from "@/components/fulfilment/ReceiptSheet";
import { ListRow, initialsOf } from "@/components/shared/ListRow";
import { MetricCard } from "@/components/shared/MetricCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiQuery } from "@/lib/query";

type Parcel = {
  id?: string;
  _id?: string;
  publicId?: string;
  orderId?: string;
  status?: string;
  sealedAt?: string;
  sealReference?: string;
  printCount?: number;
  hub?: { name?: string } | null;
  order?: { publicId?: string } | null;
  chosenCourier?: CourierInfo;
};

type Filter = "all" | "new" | "issued";

const when = (value?: string) =>
  value ? new Date(value).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : undefined;

/** Every sealed parcel's receipt in one place: preview, print or download. */
export default function ReceiptsPage() {
  const query = useApiQuery<Parcel[]>(
    ["admin", "fulfilment", "receipts"],
    "/admin/fulfilment/consolidations?status=SEALED&limit=200",
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string>();

  const parcels = useMemo(() => query.data || [], [query.data]);
  const counts = {
    all: parcels.length,
    new: parcels.filter((item) => !item.printCount).length,
    issued: parcels.filter((item) => item.printCount).length,
  };
  const needle = search.trim().toLowerCase();
  const rows = parcels.filter((item) => {
    if (filter === "new" && item.printCount) return false;
    if (filter === "issued" && !item.printCount) return false;
    return (
      !needle ||
      [item.order?.publicId, item.orderId, item.publicId, item.hub?.name, item.chosenCourier?.name].some((value) =>
        value?.toLowerCase().includes(needle),
      )
    );
  });

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        showBack={false}
        title="Hook receipts"
        description="Parcel labels for every sealed order. Preview, print or download a PDF to stick on the parcel."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Sealed parcels" value={counts.all} icon={Tags} />
        <MetricCard
          label="Not yet issued"
          value={counts.new}
          icon={ReceiptText}
          intent={counts.new ? "warning" : "neutral"}
          caption="No label printed or downloaded"
        />
        <MetricCard label="Issued" value={counts.issued} icon={Printer} intent="success" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="new">Not issued ({counts.new})</TabsTrigger>
            <TabsTrigger value="issued">Issued ({counts.issued})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order, parcel, hub, courier"
          className="h-9 sm:w-[300px]"
        />
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Sealed parcels</CardTitle>
          <Badge variant="outline">{rows.length} shown</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <QueryState
            loading={query.isLoading}
            error={query.error}
            empty={rows.length === 0}
            loadingLabel="Loading receipts"
            errorTitle="Receipts could not be loaded"
            emptyTitle="No sealed parcels"
            emptyDescription="A receipt appears here as soon as a parcel is sealed at the Hub."
            emptyIcon={ReceiptText}
            onRetry={() => query.refetch()}
          >
            {rows.map((item, index) => {
              const id = item.publicId || item.id || item._id || `parcel-${index}`;
              const orderRef = item.order?.publicId || item.orderId;
              return (
                <ListRow
                  key={id}
                  index={index + 1}
                  initials={initialsOf(item.hub?.name || "hub")}
                  title={<span className="truncate text-sm font-semibold text-zinc-950">{orderRef}</span>}
                  subject={<CourierBadge courier={item.chosenCourier} />}
                  meta={[id, item.hub?.name, item.sealedAt ? `Sealed ${when(item.sealedAt)}` : undefined]}
                  actions={
                    <>
                      <Badge variant={item.printCount ? "outline" : "secondary"}>
                        {item.printCount ? `Issued ${item.printCount}×` : "Not issued"}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => setOpen(orderRef)}>
                        <FileDown /> Preview
                      </Button>
                      <Button size="sm" onClick={() => setOpen(orderRef)}>
                        <Printer /> Print
                      </Button>
                    </>
                  }
                />
              );
            })}
          </QueryState>
        </CardContent>
      </Card>

      <ReceiptSheet orderRef={open} open={Boolean(open)} onOpenChange={(next) => (next ? undefined : setOpen(undefined))} />
    </div>
  );
}
