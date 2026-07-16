"use client";

import { CreditCard, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { HookLoader } from "@/components/shared/HookLoader";
import { Card, CardContent } from "@/components/ui/card";
import { useApiQuery } from "@/lib/query";
import { number } from "@/lib/admin-utils";
type Analytics={counts:Record<string,number>;paymentSelection:{payNow:number;payOnDelivery:number};totalSessions:number};
export default function CheckoutAnalyticsPage(){const {data,isLoading}=useApiQuery<Analytics>(["admin","checkout-analytics"],"/admin/analytics/checkout");return <div className="p-2 sm:p-4"><PageHeader title="Checkout Analytics" description="Measure payment choice, completion, abandonment, and delivery outcomes without collecting sensitive card data."/>{isLoading?<Card><CardContent className="p-12"><HookLoader label="Loading checkout analytics..."/></CardContent></Card>:<><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><KpiCard icon={ShoppingCart} tone="blue" label="Sessions" value={number(data?.totalSessions)} caption="Tracked checkout sessions"/><KpiCard icon={CreditCard} tone="green" label="Pay Now" value={number(data?.paymentSelection.payNow)} caption="Payment selections"/><KpiCard icon={MousePointerClick} tone="amber" label="Pay on Delivery" value={number(data?.paymentSelection.payOnDelivery)} caption="Payment selections"/><KpiCard icon={TrendingUp} tone="purple" label="Completed" value={number(data?.counts.payment_completed)} caption={`${number(data?.counts.checkout_abandoned)} abandoned`}/></div><Card className="mt-4 rounded-lg shadow-card"><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(data?.counts||{}).map(([key,value])=><div key={key} className="rounded-md border bg-zinc-50 p-3"><p className="text-xs capitalize text-zinc-500">{key.replaceAll("_"," ")}</p><p className="mt-1 text-xl font-semibold">{number(value)}</p></div>)}</CardContent></Card></>}</div>}
