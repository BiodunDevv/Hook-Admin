"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, MessageSquareWarning, Play, X } from "lucide-react";
import { apiPost } from "@/lib/api";
import { money, type ProductSubmission } from "@/lib/catalog";
import { useApiQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";

type Decision = "request-changes" | "approve" | "reject";

export default function CatalogReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const query = useApiQuery<ProductSubmission>(["admin", "catalog-review", id], `/admin/catalog/review/${id}`);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const item = query.data;

  async function startReview() {
    if (!item) return;
    setPending(true);
    try { await apiPost(`/admin/catalog/review/${id}/start`, { version: item.version }); toast.success("Review started"); await query.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Review could not be started"); }
    finally { setPending(false); }
  }
  async function decide() {
    if (!decision || !item) return;
    setPending(true);
    try {
      await apiPost(`/admin/catalog/review/${id}/${decision}`, { version: item.version, reason, fields: [] });
      toast.success(decision === "approve" ? "Submission approved" : decision === "reject" ? "Submission rejected" : "Changes requested");
      setDecision(null);
      router.push("/dashboard/catalog-review");
    } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Decision could not be saved"); }
    finally { setPending(false); }
  }
  return <div className="space-y-5 pb-10"><PageHeader title={item?.basicTitle || "Catalog submission"} description={item ? `${item.publicId} · Immutable Runner capture` : "Review Runner-captured catalog evidence"} actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft /> Back</Button>{item ? <CatalogStatusBadge status={item.status} /> : null}</>} />
    <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading submission" errorTitle="Submission unavailable" onRetry={() => query.refetch()}>
    {item ? <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
      <div className="space-y-4"><DetailSection title="Submitted evidence" description="Runner-captured media used to validate product identity and condition."><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{item.media?.map((asset) => <div key={asset.publicId} className="relative aspect-square overflow-hidden rounded-md bg-muted ring-1 ring-border">{asset.deliveryUrl || asset.secureUrl ? <Image src={asset.deliveryUrl || asset.secureUrl || ""} alt={item.basicTitle} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" unoptimized /> : <div className="grid size-full place-items-center text-xs text-muted-foreground">Media unavailable</div>}</div>)}</div>{!item.media?.length ? <p className="text-sm text-muted-foreground">No rendered media available.</p> : null}</DetailSection>
        <DetailSection title="Capture details" description="Observed commercial facts submitted from the assigned Market."><DefinitionGrid items={[{ label: "Observed price", value: money(item.basePriceMinor, item.currency) }, { label: "Availability", value: item.availabilityStatus }, { label: "Market", value: item.market?.name || item.marketId }, { label: "Suggested category", value: item.category?.name || item.categorySuggestionId }, { label: "Runner notes", value: item.notes || "No notes supplied", span: 2 }]} /></DetailSection>
      </div>
      <DetailSection className="xl:sticky xl:top-20" title="Review decision" description="Every transition is version-checked and written to the audit log."><div className="space-y-2">
        {item.status === "submitted" ? <Button className="w-full" onClick={startReview} disabled={pending}>{pending ? <HookLoader size="button" /> : <><Play /> Start review</>}</Button> : null}
        {item.status === "in_review" ? <><Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setDecision("approve")}><Check /> Approve</Button><Button variant="outline" className="w-full" onClick={() => setDecision("request-changes")}><MessageSquareWarning /> Request changes</Button><Button variant="outline" className="w-full text-destructive" onClick={() => setDecision("reject")}><X /> Reject</Button></> : null}
        <p className="pt-2 text-xs leading-5 text-muted-foreground">Approval creates one Commercial Product draft. It does not publish the product.</p>
      </div></DetailSection>
    </div> : null}
    </QueryState>
    <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}><DialogContent><DialogHeader><DialogTitle className="capitalize">{decision?.replace("-", " ")}</DialogTitle><DialogDescription>Give a clear operational reason. This decision is audited.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason and actionable feedback" /><DialogFooter><Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button><Button disabled={pending || reason.trim().length < 5} onClick={decide}>{pending ? <HookLoader size="button" /> : "Confirm decision"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
