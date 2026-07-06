"use client";

import { MessageSquare, User, Bot } from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { cn } from "@/lib/utils";

export interface Session {
  id: string;
  status: string;
  statusColor: string;
  time: string;
  product: string;
  customer: string;
  amountLabel: string;
  amount: string;
  amountColor: string;
  img: string;
  hasIcon: boolean;
}

interface NegotiationSessionProps {
  sessions: Session[];
  activeSession: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-blue-500",
  accepted: "bg-emerald-500",
  declined: "bg-red-400",
  expired: "bg-zinc-400",
  withdrawn: "bg-zinc-300",
};

export function NegotiationSession({ sessions, activeSession, onSelect, isLoading }: NegotiationSessionProps) {
  return (
    <div className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:w-80 xl:w-90">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-brand-gold" />
          <span className="text-sm font-semibold text-zinc-900">Sessions</span>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
          {sessions.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <HookLoader size="inline" label="Loading sessions..." />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100">
              <MessageSquare size={18} className="text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-500">No sessions</p>
            <p className="text-xs text-zinc-400">No negotiations match this filter.</p>
          </div>
        )}

        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={cn(
              "relative w-full border-b border-border px-4 py-3 text-left transition-colors",
              activeSession === session.id
                ? "bg-zinc-50"
                : "hover:bg-zinc-50/60",
            )}
          >
            {activeSession === session.id && (
              <span className="absolute bottom-0 left-0 top-0 w-0.5 rounded-r bg-brand-gold" />
            )}

            {/* Row 1: product + status pill */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", STATUS_DOT[session.status] ?? "bg-zinc-300")} />
                <span className="truncate text-sm font-semibold text-zinc-900 leading-tight">
                  {session.product}
                </span>
              </div>
              <span className={cn(
                "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                session.statusColor,
              )}>
                {session.status}
              </span>
            </div>

            {/* Row 2: thumbnail + customer + amount */}
            <div className="flex items-center gap-2.5">
              {session.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.img}
                  alt={session.product}
                  className="size-9 shrink-0 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-zinc-100 text-zinc-400">
                  <MessageSquare size={14} />
                </div>
              )}

              <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
                    <User size={10} className="text-zinc-400 shrink-0" />
                    {session.customer}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">{session.time}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-zinc-400">{session.amountLabel}</p>
                  <p className={cn("text-xs font-bold", session.amountColor)}>{session.amount}</p>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
