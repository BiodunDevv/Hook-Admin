"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { useState } from "react";

export function PlatformDetailPage({ title, endpoint, invitationAction = false }: { title: string; endpoint: string; invitationAction?: boolean }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const query = useApiQuery<Record<string, unknown>>(["platform-detail", endpoint, params.id], `${endpoint}/${params.id}`);
  async function resendInvitation() {
    setSending(true);
    try {
      await apiPost(`${endpoint}/${params.id}/resend-invitation`, {});
      toast.success("A new activation link has been sent");
      query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to resend invitation");
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="p-2 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft /> Back</Button>
        {invitationAction && query.data?.status === "invited" ? (
          <Button variant="outline" disabled={sending} onClick={resendInvitation}>
            {sending ? <HookLoader size="button" /> : <><Mail /> Resend invitation</>}
          </Button>
        ) : null}
      </div>
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
