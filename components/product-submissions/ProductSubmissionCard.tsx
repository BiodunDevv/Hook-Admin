"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ImageOff, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { money, type ProductSubmission } from "@/lib/catalog";

export function ProductSubmissionCard({ submission }: { submission: ProductSubmission }) {
  const id = submission.publicId;
  const cover = submission.media?.[0]?.deliveryUrl || submission.media?.[0]?.secureUrl || submission.imageUrl;

  const waitingHours = submission.status === "submitted" || submission.status === "in_review"
    ? Math.max(0, Math.floor((Date.now() - new Date((submission as { submittedAt?: string; createdAt?: string }).submittedAt || (submission as { createdAt?: string }).createdAt || Date.now()).getTime()) / 3_600_000))
    : null;
  const late = waitingHours !== null && waitingHours >= 24;

  return (
    <Card className="group overflow-hidden rounded-xl shadow-none transition-shadow hover:shadow-md">
      <Link href={`/dashboard/product-submissions/${id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[16/8] overflow-hidden bg-muted">
          {cover ? (
            <Image src={cover} alt={submission.basicTitle} fill sizes="(max-width: 768px) 100vw, 33vw" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" unoptimized />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground"><ImageOff className="size-6" /></div>
          )}
          <div className="absolute left-3 top-3"><CatalogStatusBadge status={submission.status} /></div>
          {waitingHours !== null ? (
            <div className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${late ? "bg-red-600 text-white" : "bg-white/90 text-zinc-700"}`}>
              {waitingHours < 1 ? "New" : waitingHours < 48 ? `${waitingHours}h waiting` : `${Math.floor(waitingHours / 24)}d waiting`}
            </div>
          ) : null}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">{id}</div>
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="min-w-0">
          <Link href={`/dashboard/product-submissions/${id}`} className="block truncate text-base font-semibold text-foreground hover:underline">{submission.basicTitle}</Link>
          <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {submission.market?.name || "Assigned Market"}
            {submission.marketVendor?.businessName ? ` · ${submission.marketVendor.businessName}` : ""}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dashed pt-3 text-xs">
          <div className="min-w-0"><p className="text-muted-foreground">Observed price</p><p className="mt-1 truncate font-medium text-foreground">{money(submission.basePriceMinor, submission.currency)}</p></div>
          <div className="min-w-0">
            <p className="text-muted-foreground">Market Associate</p>
            <p className="mt-1 flex items-center gap-1 truncate font-medium text-foreground">
              <User className="size-3 shrink-0 text-muted-foreground" />
              {submission.marketAssociate?.name || submission.marketAssociate?.publicId || "Unassigned"}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/product-submissions/${id}`} className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold text-foreground hover:text-[#8a6900]">
          <span className="flex items-center gap-1.5"><ClipboardCheck className="size-3.5 text-[#b18b00]" /> Review submission</span><ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
