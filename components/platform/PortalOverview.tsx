"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

export function PortalOverview({ type, view }: { type: "runner" | "partner"; view: "dashboard" | "profile" | "markets" | "location" | "security" }) {
  const endpoint = view === "markets" ? "/runner/markets" : view === "location" ? "/partner/location" : `/${type}/profile`;
  const query = useApiQuery<Record<string, unknown>>([type, view], endpoint);
  return <div className="pb-20"><h1 className="text-2xl font-semibold capitalize">{view}</h1><p className="mt-1 text-sm text-muted-foreground">{type === "runner" ? "Runner operations foundation" : "Hook Partner account foundation"}</p>
    <Card className="mt-5 rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Account information</CardTitle></CardHeader><CardContent>{query.isLoading ? <HookLoader /> : query.isError ? <p className="text-sm text-destructive">Unable to load this account.</p> : <pre className="overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(query.data, null, 2)}</pre>}</CardContent></Card>
  </div>;
}
