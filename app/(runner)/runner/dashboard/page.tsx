"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, MapPinned, PackageCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

interface Dashboard {
  assignedMarkets: number;
  drafts: number;
  submitted: number;
  changesRequested: number;
  approved: number;
  recentPublished: Array<{ publicId: string; title: string; publishedAt: string }>;
}

export default function RunnerDashboardPage() {
  const query = useApiQuery<Dashboard>(["runner", "catalog-dashboard"], "/runner/dashboard");

  if (query.isLoading) {
    return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading Runner dashboard" /></div>;
  }
  if (query.isError || !query.data) {
    return <p className="text-sm text-destructive">Your Runner dashboard could not be loaded.</p>;
  }

  const stats = [
    ["Assigned Markets", query.data.assignedMarkets, MapPinned],
    ["Drafts", query.data.drafts, ClipboardList],
    ["In review", query.data.submitted, PackageCheck],
    ["Changes requested", query.data.changesRequested, RotateCcw],
  ] as const;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Runner dashboard</h1>
          <p className="text-sm text-muted-foreground">Capture verified products from your assigned Markets.</p>
        </div>
        <Button asChild className="bg-[#FFC809] text-black hover:bg-[#f0bb00]"><Link href="/runner/submissions/new">New submission</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <Card key={label} className="rounded-lg shadow-none">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-md bg-amber-50"><Icon className="size-4" /></span>
              <div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recently published</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/runner/submissions">View submissions <ArrowRight /></Link></Button>
        </CardHeader>
        <CardContent>
          {query.data.recentPublished.length ? query.data.recentPublished.map((item) => (
            <div key={item.publicId} className="flex items-center justify-between border-t py-3 first:border-0">
              <div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.publicId}</p></div>
              <PackageCheck className="size-4 text-emerald-600" />
            </div>
          )) : <p className="py-6 text-center text-sm text-muted-foreground">Approved products will appear here after Commercial publishes them.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
