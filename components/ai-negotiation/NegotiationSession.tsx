"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, User } from "lucide-react";
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
}

export function NegotiationSession({ sessions, activeSession, onSelect }: NegotiationSessionProps) {
  return (
    <div className="flex w-full shrink-0 flex-col rounded-2xl border border-zinc-200 bg-white shadow-card lg:w-[340px] xl:w-[380px]">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 p-5">
        <h3 className="text-lg font-bold text-zinc-900">Recent Sessions</h3>
        <button className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-200">
          All time
        </button>
      </div>

      <ScrollArea className="flex-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              "relative cursor-pointer border-b border-zinc-100 p-5 transition-colors",
              activeSession === session.id ? "bg-zinc-50" : "hover:bg-zinc-50",
            )}
          >
            {activeSession === session.id && (
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-brand-gold" />
            )}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">{session.id}</span>
                <Badge
                  variant="outline"
                  className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", session.statusColor)}
                >
                  {session.status}
                </Badge>
              </div>
              <span className="text-[12px] font-medium text-zinc-400">{session.time}</span>
            </div>

            <div className="flex items-center gap-3">
              {session.img ? (
                <img
                  src={session.img}
                  alt={session.product}
                  className="h-12 w-12 shrink-0 rounded-lg border border-zinc-200 bg-zinc-100 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-400">
                  <MessageSquare size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 truncate text-sm font-semibold leading-tight text-zinc-900">
                  {session.product}
                </h4>
                <div className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                  <User size={12} className="text-zinc-400" /> {session.customer}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="mb-0.5 text-[11px] font-medium text-zinc-500">{session.amountLabel}</p>
                <p className={cn("text-sm font-bold", session.amountColor)}>{session.amount}</p>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
