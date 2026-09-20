"use client";

import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Cell, Line, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Overview = {
  range: number;
  generatedAt: string;
  kpis: {
    revenue: Delta; orders: Delta; averageOrder: Delta; delivered: Delta; customers: Delta;
    inFulfilment: { value: number }; lastHourOrders: { value: number };
  };
  series: Array<{ date: string; orders: number; revenueMinor: number }>;
  statuses: Array<{ status: string; count: number }>;
  paymentMethods: Array<{ method: string; count: number; revenueMinor: number }>;
  topStates: Array<{ name: string; orders: number; revenueMinor: number }>;
  pipeline: Record<string, number>;
  attention: Array<{ key: string; label: string; count: number; href: string; tone: "danger" | "warning" }>;
  recentOrders: Array<{ publicId: string; status: string; paymentMethod?: string; totalMinor?: number; createdAt: string; customer?: string; state?: string }>;
};
type Delta = { value: number; previous: number; changePct: number };

const GOLD = "#F5B800";
const INK = "var(--foreground)";
const PALETTE = ["#111827", "#F5B800", "#16A34A", "#2563EB", "#9333EA", "#EA580C", "#64748B", "#DB2777"];

export const naira = (minor: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(minor / 100);
const compact = (minor: number) =>
  `₦${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(minor / 100)}`;
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const day = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

function Panel({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`gap-0 rounded-lg py-0 shadow-card ${className || ""}`}>
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

const Empty = ({ text }: { text: string }) => <p className="grid h-40 place-items-center text-sm text-muted-foreground">{text}</p>;

/** Revenue (area) and order count (line) on one timeline. */
export function RevenueChart({ data }: { data: Overview["series"] }) {
  const config = { revenue: { label: "Revenue", color: GOLD }, orders: { label: "Orders", color: INK } } satisfies ChartConfig;
  const rows = data.map((row) => ({ date: row.date, revenue: row.revenueMinor, orders: row.orders }));
  return (
    <Panel title="Revenue and orders" description="Paid orders per day">
      <ChartContainer config={config} className="h-[280px] w-full">
        <ComposedChart data={rows} margin={{ left: 0, right: 4, top: 8 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GOLD} stopOpacity={0.45} />
              <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={day} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis yAxisId="rev" tickFormatter={compact} tickLine={false} axisLine={false} width={52} />
          <YAxis yAxisId="ord" orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => day(String(value))} formatter={(value, name) => (
            <span className="flex w-full justify-between gap-4">
              <span className="text-muted-foreground">{name === "revenue" ? "Revenue" : "Orders"}</span>
              <span className="font-mono font-medium tabular-nums">{name === "revenue" ? naira(Number(value)) : Number(value)}</span>
            </span>
          )} />} />
          <Area yAxisId="rev" dataKey="revenue" type="monotone" stroke={GOLD} strokeWidth={2} fill="url(#rev)" isAnimationActive />
          <Line yAxisId="ord" dataKey="orders" type="monotone" stroke={INK} strokeWidth={2} dot={false} />
          <ChartLegend content={<ChartLegendContent />} />
        </ComposedChart>
      </ChartContainer>
    </Panel>
  );
}

function Donut({ data, empty }: { data: Array<{ name: string; value: number; fill: string }>; empty: string }) {
  const total = data.reduce((sum, row) => sum + row.value, 0);
  if (!total) return <Empty text={empty} />;
  const config = Object.fromEntries(data.map((row) => [row.name, { label: row.name, color: row.fill }])) as ChartConfig;
  return (
    <ChartContainer config={config} className="mx-auto h-[210px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} strokeWidth={0}>
          {data.map((row) => <Cell key={row.name} fill={row.fill} />)}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}

export function StatusChart({ data }: { data: Overview["statuses"] }) {
  const top = data.slice(0, 6);
  const rest = data.slice(6).reduce((sum, row) => sum + row.count, 0);
  const rows = [...top.map((row) => ({ name: label(row.status), value: row.count })), ...(rest ? [{ name: "Other", value: rest }] : [])]
    .map((row, index) => ({ ...row, fill: PALETTE[index % PALETTE.length] }));
  return <Panel title="Order status" description="Every order placed in this period"><Donut data={rows} empty="No orders in this period" /></Panel>;
}

export function PaymentChart({ data }: { data: Overview["paymentMethods"] }) {
  const rows = data.map((row, index) => ({ name: row.method === "PAY_AT_HANDOVER" ? "Pay at handover" : "Prepaid", value: row.count, fill: PALETTE[index % 2 === 0 ? 0 : 1] }));
  return <Panel title="Payment method" description="Share of paid orders"><Donut data={rows} empty="No paid orders in this period" /></Panel>;
}

/** Where orders currently sit, stage by stage. */
export function PipelineChart({ pipeline }: { pipeline: Overview["pipeline"] }) {
  const rows = [
    { stage: "Sourcing", count: pipeline.sourcing },
    { stage: "At hub", count: pipeline.inbound },
    { stage: "QC", count: pipeline.awaitingQc },
    { stage: "Consolidate", count: (pipeline.readyToConsolidate || 0) + (pipeline.consolidating || 0) },
    { stage: "Ready to book", count: pipeline.readyToBook },
    { stage: "Booked", count: pipeline.booked },
    { stage: "In transit", count: pipeline.inTransit },
    { stage: "Exceptions", count: pipeline.exceptions },
  ].map((row) => ({ ...row, count: row.count || 0 }));
  const config = { count: { label: "Orders", color: GOLD } } satisfies ChartConfig;
  return (
    <Panel title="Fulfilment pipeline" description="Live count at each stage">
      <ChartContainer config={config} className="h-[260px] w-full">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} width={92} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" radius={4}>
            {rows.map((row) => <Cell key={row.stage} fill={row.stage === "Exceptions" ? "#DC2626" : GOLD} />)}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Panel>
  );
}

export function TopStatesChart({ data }: { data: Overview["topStates"] }) {
  const config = { orders: { label: "Orders", color: INK } } satisfies ChartConfig;
  return (
    <Panel title="Top delivery States" description="Orders by destination">
      {data.length ? (
        <ChartContainer config={config} className="h-[260px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={92} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => (
              <span className="flex w-full justify-between gap-4">
                <span>{Number(value)} orders</span>
                <span className="font-mono text-muted-foreground">{naira(Number(item.payload?.revenueMinor || 0))}</span>
              </span>
            )} />} />
            <Bar dataKey="orders" radius={4} fill={INK} />
          </BarChart>
        </ChartContainer>
      ) : <Empty text="No delivery data yet" />}
    </Panel>
  );
}
