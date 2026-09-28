"use client";

import { useMemo, useState } from "react";
import { Bell, BellOff, Check, ShoppingBag, Package, Wallet, Truck, Sparkles, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/lib/query";
import { apiPatch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';

interface NotificationItem {
  data?: { href?: string; negotiationId?: string };
  id: string;
  title?: string;
  body?: string;
  message?: string;
  type?: string;
  createdAt?: string;
  isRead?: boolean;
}

interface NotificationsResponse {
  data: NotificationItem[];
  unread: number;
  total: number;
}

function relativeTime(value?: string) {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function notificationIcon(type?: string) {
  if (!type) return Sparkles;
  if (type.includes("order") || type.includes("assign")) return ShoppingBag;
  if (type.includes("payment") || type.includes("refund")) return Wallet;
  if (type.includes("deliver") || type.includes("shipment") || type.includes("handoff")) return Truck;
  if (type.includes("product") || type.includes("submission") || type.includes("catalog")) return Package;
  return Sparkles;
}

const NOTIFICATIONS_PATH_PREFIX: Record<string, string> = {
  admin: "admin",
  marketassociate: "market-associate",
  partner: "partner",
};

export function NotificationBell({ scope }: { scope: "admin" | "marketassociate" | "partner" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const endpoint = `/${NOTIFICATIONS_PATH_PREFIX[scope]}/notifications`;
  const queryKey = scope === "admin" ? (["notifications"] as const) : ([scope, "notifications"] as const);
  const queryClient = useQueryClient();
  const { data } = useApiQuery<NotificationsResponse>(queryKey, endpoint);
  const notifications = useMemo(() => data?.data ?? [], [data]);
  const unreadCount = data?.unread ?? 0;

  // Desktop-notification delivery (including while this tab isn't focused) is
  // handled by the service worker's own `push` handler once subscribed — see
  // PushPermissionBanner / lib/push-subscribe.ts — so this component only
  // needs to render the in-app list; it doesn't also pop up a duplicate here.

  async function markRead(id: string) {
    try {
      await apiPatch(`${endpoint}/${id}/read`, {});
      await queryClient.invalidateQueries({ queryKey });
    } catch {
      /* best-effort */
    }
  }

  async function markAllRead() {
    try {
      await apiPatch(`${endpoint}/read-all`, {});
      await queryClient.invalidateQueries({ queryKey });
    } catch {
      /* best-effort */
    }
  }

  function openNotification(notification: NotificationItem) {
    if (!notification.isRead) void markRead(notification.id);
    setOpen(false);
    const href = notification.data?.href
      || (notification.type === "negotiation_started" && notification.data?.negotiationId
        ? `/dashboard/ai-negotiation/${encodeURIComponent(notification.data.negotiationId)}`
        : undefined);
    if (href) router.push(href);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="relative border-border"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </Button>
      {/* The sheet's own absolutely-positioned close button is turned off (showCloseButton=false) so ours can sit in normal flex flow next to "Mark all read" instead of floating on top of it. */}
      <SheetContent side="right" showCloseButton={false} className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b px-4 py-3.5">
          <SheetTitle className="flex items-center gap-2 text-base">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                {unreadCount} new
              </span>
            )}
          </SheetTitle>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Mark all read
              </button>
            )}
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <BellOff size={22} className="text-zinc-300" />
              <p className="text-sm font-medium text-zinc-500">No notifications yet</p>
              <p className="text-xs text-zinc-400">You&apos;re all caught up</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcon(notification.type);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={`flex w-full items-start gap-3 rounded-lg px-2.5 py-3 text-left transition ${notification.isRead ? "opacity-60" : "bg-amber-50/60 hover:bg-amber-50"}`}
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#FFF3CC]">
                    <Icon size={14} className="text-[#9a7400]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {notification.title ?? notification.message ?? "Notification"}
                    </span>
                    {notification.body && (
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{notification.body}</span>
                    )}
                    {notification.createdAt && (
                      <span className="mt-1 block text-[11px] text-muted-foreground">{relativeTime(notification.createdAt)}</span>
                    )}
                  </span>
                  {!notification.isRead && <Check size={13} className="mt-1 shrink-0 text-muted-foreground/40" />}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
