"use client";

import { useState } from "react";
import { AlertCircle, Bot, Check, MessageCircle, XCircle, User, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export interface NegotiationMessage {
  role: "user" | "bot";
  message: string;
  price?: number;
  timestamp: string;
}

export interface NegotiationDetail {
  id: string;
  status: string;
  offeredPrice: number;
  counterPrice: number;
  acceptedPrice?: number;
  costPrice: number;
  sellingPrice: number;
  minAcceptablePrice: number;
  messageHistory?: NegotiationMessage[];
  product?: { title?: string; images?: string[] };
  user?: { firstName?: string; lastName?: string; email?: string };
}

interface ChatInterfaceProps {
  negotiation?: NegotiationDetail;
}

function money(value?: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function customerName(negotiation?: NegotiationDetail) {
  return `${negotiation?.user?.firstName || ""} ${negotiation?.user?.lastName || ""}`.trim()
    || negotiation?.user?.email
    || "Customer";
}

function statusTone(status?: string) {
  if (status === "accepted") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "active")   return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "declined") return "border-red-200 bg-red-50 text-red-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export function ChatInterface({ negotiation }: ChatInterfaceProps) {
  const [takenOver, setTakenOver] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  if (!negotiation) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-card p-6 text-center">
        <div>
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-zinc-100">
            <MessageCircle size={18} className="text-zinc-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">No session selected</h3>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">
            Pick a session from the list to review the negotiation thread.
          </p>
        </div>
      </div>
    );
  }

  const messages = negotiation.messageHistory?.length
    ? negotiation.messageHistory
    : [
        {
          role: "user" as const,
          message: `Can Hook do ${money(negotiation.offeredPrice)} for this item?`,
          price: negotiation.offeredPrice,
          timestamp: new Date().toISOString(),
        },
        {
          role: "bot" as const,
          message: `Best I can do is ${money(negotiation.counterPrice)}. That's our final smart counter.`,
          price: negotiation.counterPrice,
          timestamp: new Date().toISOString(),
        },
      ];

  const selectedPrice = negotiation.acceptedPrice || negotiation.counterPrice || negotiation.offeredPrice;
  const belowFloor = selectedPrice < negotiation.minAcceptablePrice;
  const productImage = negotiation.product?.images?.[0];
  const isTerminal = negotiation.status === "accepted" || negotiation.status === "declined" || negotiation.status === "expired";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">

      {/* Header — compact single row */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
        {productImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImage}
            alt={negotiation.product?.title || "Product"}
            className="size-9 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-zinc-100">
            <MessageCircle size={15} className="text-zinc-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-bold text-zinc-900">
              {negotiation.product?.title || "Negotiation"}
            </h2>
            <Badge variant="outline" className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", statusTone(negotiation.status))}>
              {negotiation.status}
            </Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <User size={10} className="text-zinc-400" />
              {customerName(negotiation)}
            </span>
            <span>List: <b className="text-zinc-700">{money(negotiation.sellingPrice)}</b></span>
            <span>Floor: <b className="text-red-600">{money(negotiation.minAcceptablePrice)}</b></span>
            <span>
              {negotiation.acceptedPrice ? "Closed:" : "Counter:"}
              {" "}<b className="text-emerald-600">{money(selectedPrice)}</b>
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs">
          <LinkIcon size={12} /> Product
        </Button>
      </div>

      {/* Thread */}
      <ScrollArea className="flex-1 bg-zinc-50/50 px-4 py-3">
        <div className="flex flex-col gap-3 pb-2">
          {messages.map((msg, i) => {
            const isBot = msg.role === "bot";
            return (
              <div
                key={`${msg.timestamp}-${i}`}
                className={cn("flex items-end gap-2", isBot ? "self-end justify-end flex-row-reverse" : "self-start")}
              >
                <div className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px]",
                  isBot
                    ? "border border-brand-gold/30 bg-amber-50 text-brand-gold"
                    : "border border-border bg-white text-zinc-500",
                )}>
                  {isBot ? <Bot size={12} /> : <User size={12} />}
                </div>

                <div className={cn("flex max-w-[76%] flex-col gap-1", isBot ? "items-end" : "items-start")}>
                  <span className="text-[10px] text-zinc-400">
                    {isBot ? "Hook AI" : customerName(negotiation)}
                    {" · "}
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className={cn(
                    "rounded-xl px-3 py-2 text-xs leading-relaxed",
                    isBot
                      ? "rounded-tr-sm bg-zinc-900 text-white"
                      : "rounded-tl-sm border border-border bg-white text-zinc-800",
                  )}>
                    {msg.message}
                  </div>
                  {msg.price ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                      Offer: {money(msg.price)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {belowFloor && (
            <Alert className="mt-1 border-red-100 bg-red-50 py-2">
              <AlertCircle size={14} className="text-red-500" />
              <AlertDescription className="text-xs text-red-600">
                Offer is below negotiation floor. Admin review recommended.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </ScrollArea>

      {/* Admin Controls footer */}
      <PermissionGuard permission="ai_negotiation.view">
        <div className="shrink-0 border-t border-border bg-card px-4 py-3">
          {takenOver && !isTerminal ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type a custom counter offer message..."
                className="h-8 flex-1 rounded-lg border border-border bg-zinc-50 px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
              <Button
                size="sm"
                variant="brand"
                className="h-8 gap-1 px-3 text-xs"
                onClick={() => { setTakenOver(false); setCustomMessage(""); }}
              >
                <Check size={12} /> Send
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => setTakenOver(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-zinc-700">Admin Controls</p>
                <p className="text-[10px] text-zinc-400">Override, reject, or approve this session</p>
              </div>
              <div className="flex items-center gap-2">
                {!isTerminal && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTerminal}
                      className="h-7 gap-1 border-red-100 bg-red-50 px-2.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-100"
                    >
                      <XCircle size={12} /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTerminal}
                      className="h-7 gap-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700"
                      onClick={() => setTakenOver(true)}
                    >
                      <MessageCircle size={12} /> Take Over
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="brand"
                  disabled={isTerminal}
                  className="h-7 gap-1 px-2.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  <Check size={12} /> Approve
                </Button>
              </div>
            </div>
          )}
        </div>
      </PermissionGuard>
    </div>
  );
}
