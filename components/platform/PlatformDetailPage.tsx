"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";

export function PlatformDetailPage({ title, endpoint }: { title: string; endpoint: string }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useApiQuery<Record<string, unknown>>(["platform-detail", endpoint, params.id], `${endpoint}/${params.id}`);
  return (
    <div className="p-2 md:p-4">
      <Button variant="ghost" onClick={() => router.back()}><ArrowLeft /> Back</Button>
      <Card className="mt-3 rounded-lg shadow-none">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          {query.isLoading ? <div className="flex min-h-52 items-center justify-center"><HookLoader /></div> : query.isError ? (
            <p className="text-sm text-destructive">The record could not be loaded.</p>
          ) : (
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {Object.entries(query.data || {}).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) => (
                <div key={key} className="border-b pb-3"><dt className="text-xs font-medium uppercase text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="mt-1 text-sm">{String(value ?? "—")}</dd></div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
