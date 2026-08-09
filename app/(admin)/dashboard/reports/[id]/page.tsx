"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/lib/query";

interface Report { id: string; type: string; status: string; createdAt: string; downloadUrl?: string | null; data?: Record<string, unknown>; }

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery<Report>(["admin", "reports", id], `/admin/reports/${id}`, Boolean(id));
  const report = query.data;
  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title={report?.type ? `${report.type} report` : "Report Detail"} description={report?.id || "Generated report metadata"} actions={<Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading report" onRetry={() => query.refetch()}>
        {report ? <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]"><DetailSection title="Report metadata" description="Generation status and output availability."><DefinitionGrid columns={1} items={[{ label: "Status", value: <StatusBadge status={report.status} /> }, { label: "Created", value: new Date(report.createdAt).toLocaleString("en-NG") }, { label: "Download", value: report.downloadUrl ? <a className="text-primary underline underline-offset-4" href={report.downloadUrl}>Download generated report</a> : "Preparing metadata only" }]} /></DetailSection><DetailSection title="Report payload" description="Structured data captured for this generated report."><pre className="max-h-[560px] overflow-auto rounded-md bg-muted p-4 text-xs leading-5">{JSON.stringify(report.data || {}, null, 2)}</pre></DetailSection></div> : null}
      </QueryState>
    </div>
  );
}
