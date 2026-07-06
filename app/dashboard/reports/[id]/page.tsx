"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiQuery } from "@/lib/query";
import { cleanError } from "@/lib/admin-utils";

interface Report { id: string; type: string; status: string; createdAt: string; downloadUrl?: string | null; data?: Record<string, unknown>; }

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<Report>(["admin", "reports", id], `/admin/reports/${id}`, Boolean(id));
  const report = query.data;
  return (
    <div className="space-y-4 px-3 py-3 sm:px-5">
      <PageHeader title={report?.type ? `${report.type} report` : "Report Detail"} description={report?.id || "Generated report metadata"} actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      {query.error && <Card><CardContent className="p-4 text-sm text-red-600">{cleanError(query.error)}</CardContent></Card>}
      {report && <Card className="rounded-lg shadow-none"><CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2"><div><p className="text-muted-foreground">Status</p><StatusBadge status={report.status} /></div><div><p className="text-muted-foreground">Created</p><p>{new Date(report.createdAt).toLocaleString()}</p></div><div><p className="text-muted-foreground">Download</p><p>{report.downloadUrl || "Preparing metadata only"}</p></div><div><p className="text-muted-foreground">Payload</p><pre className="overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(report.data || {}, null, 2)}</pre></div></CardContent></Card>}
    </div>
  );
}
