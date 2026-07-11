"use client";

import Link from "next/link";
import { AlertCircle, Check, Edit2, MapPin, PackageSearch, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HookLoader } from "@/components/shared/HookLoader";
import { money } from "@/lib/admin-utils";

export interface QueueItem {
  id: string;
  title: string;
  image?: string | null;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  sizes: string[];
  colors: string[];
  createdAt: string;
  market: string;
  agentName: string;
  source: string;
  flagged: boolean;
  flagReason?: string | null;
}

interface AgentReviewCardProps {
  item: QueueItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy?: boolean;
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function AgentReviewCard({ item, onApprove, onReject, busy }: AgentReviewCardProps) {
  const markup = item.sellingPrice - item.costPrice;
  const variantNote = [
    item.sizes.length
      ? `Sizes: ${item.sizes.join(", ")}`
      : item.colors.length
      ? `Colors: ${item.colors.join(", ")}`
      : null,
    `Qty: ${item.quantity}`,
  ].filter(Boolean).join(" | ");

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl border-zinc-200 py-0 shadow-card">
      {/* Image header */}
      <div className="relative aspect-[16/10] bg-zinc-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-300">
            <PackageSearch size={32} />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-zinc-800 shadow-sm">
          <Tag size={10} className="text-brand-gold" /> {item.category}
        </span>
        {item.flagged && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            <AlertCircle size={11} /> Flagged
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Title + time */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-snug text-zinc-900">{item.title}</h3>
          <span className="shrink-0 text-[11px] text-zinc-400">{relativeTime(item.createdAt)}</span>
        </div>

        {/* Market • agent */}
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin size={12} className="shrink-0 text-zinc-400" />
          <span className="font-medium">{item.market}</span>
          <span className="text-zinc-300">•</span>
          <span>{item.agentName}</span>
        </p>

        {/* System flag alert */}
        {item.flagged && item.flagReason && (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-xs leading-5 text-red-600">
              <b>System Flag:</b> {item.flagReason}
            </p>
          </div>
        )}

        {/* Price breakdown */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm">
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-zinc-500">Market Cost Price</span>
            <span className="font-semibold text-zinc-900">{money(item.costPrice)}</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-zinc-500">Hook Mark-up</span>
            <span className="font-semibold text-emerald-600">+{money(markup)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-zinc-200 pt-1.5">
            <span className="text-xs font-semibold text-zinc-700">Selling Price</span>
            <span className="text-base font-bold text-zinc-900">{money(item.sellingPrice)}</span>
          </div>
        </div>

        {/* Variants note */}
        <p className="rounded-md border border-zinc-100 px-2.5 py-1.5 text-xs text-zinc-500">{variantNote}</p>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onApprove(item.id)}
            className="flex-1 gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {busy ? <HookLoader size="button" label="Working..." /> : <><Check size={15} /> Approve Listing</>}
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/dashboard/products/${item.id}`}>
              <Edit2 size={13} /> Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={busy}
            onClick={() => onReject(item.id)}
            title="Reject listing"
            className="shrink-0 border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
          >
            <X size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
