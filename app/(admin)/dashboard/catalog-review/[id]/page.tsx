"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Check, MessageSquareWarning, Play, X } from "lucide-react";
import { apiPost } from "@/lib/api";
import { money, type ProductSubmission } from "@/lib/catalog";
import { useApiQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";

type Decision = "request-changes" | "approve" | "reject";

export default function CatalogReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const query = useApiQuery<ProductSubmission>(["admin", "catalog-review", id], `/admin/catalog/review/${id}`);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><HookLoader label="Loading submission" /></div>;
  if (query.isError || !query.data) return <p className="p-4 text-sm text-destructive">Submission not found or outside your scope.</p>;
  const item = query.data;

  async function startReview() {
    setPending(true);
    try { await apiPost(`/admin/catalog/review/${id}/start`, { version: item.version }); toast.success("Review started"); await query.refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Review could not be started"); }
    finally { setPending(false); }
  }
  async function decide() {
    if (!decision) return;
    setPending(true);
    try {
      await apiPost(`/admin/catalog/review/${id}/${decision}`, { version: item.version, reason, fields: [] });
      toast.success(decision === "approve" ? "Submission approved" : decision === "reject" ? "Submission rejected" : "Changes requested");
      setDecision(null);
      router.push("/dashboard/catalog-review");
    } catch (error) { toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Decision could not be saved"); }
    finally { setPending(false); }
  }
  return <div className="p-2 md:p-4"><PageHeader title={item.basicTitle} description={`${item.publicId} · Immutable Runner capture`} actions={<CatalogStatusBadge status={item.status} />} />
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
      <div className="space-y-4"><Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Submitted evidence</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{item.media?.map((asset) => <div key={asset.publicId} className="relative aspect-square overflow-hidden rounded-md bg-muted">{asset.deliveryUrl || asset.secureUrl ? <Image src={asset.deliveryUrl || asset.secureUrl || ""} alt={item.basicTitle} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" unoptimized /> : null}</div>)}</div>{!item.media?.length ? <p className="text-sm text-muted-foreground">No rendered media available.</p> : null}</CardContent></Card>
        <Card className="rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Capture details</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Observed price" value={money(item.basePriceMinor, item.currency)} /><Info label="Availability" value={item.availabilityStatus} /><Info label="Market" value={item.market?.name || item.marketId} /><Info label="Suggested category" value={item.category?.name || item.categorySuggestionId} /><div className="sm:col-span-2"><Info label="Runner notes" value={item.notes || "No notes supplied"} /></div></CardContent></Card>
      </div>
      <Card className="h-fit rounded-lg shadow-none"><CardHeader><CardTitle className="text-base">Review actions</CardTitle></CardHeader><CardContent className="space-y-2">
        {item.status === "submitted" ? <Button className="w-full" onClick={startReview} disabled={pending}>{pending ? <HookLoader size="button" /> : <><Play /> Start review</>}</Button> : null}
        {item.status === "in_review" ? <><Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setDecision("approve")}><Check /> Approve</Button><Button variant="outline" className="w-full" onClick={() => setDecision("request-changes")}><MessageSquareWarning /> Request changes</Button><Button variant="outline" className="w-full text-destructive" onClick={() => setDecision("reject")}><X /> Reject</Button></> : null}
        <p className="pt-2 text-xs leading-5 text-muted-foreground">Approval creates one Commercial Product draft. It does not publish the product.</p>
      </CardContent></Card>
    </div>
    <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}><DialogContent><DialogHeader><DialogTitle className="capitalize">{decision?.replace("-", " ")}</DialogTitle><DialogDescription>Give a clear operational reason. This decision is audited.</DialogDescription></DialogHeader><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason and actionable feedback" /><DialogFooter><Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button><Button disabled={pending || reason.trim().length < 5} onClick={decide}>{pending ? <HookLoader size="button" /> : "Confirm decision"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase text-muted-foreground">{label}</p><p className="mt-1 capitalize">{value}</p></div>;
}
