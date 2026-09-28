"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { usePushSubscription } from "@/lib/push-subscribe";

const DISMISSED_KEY_PREFIX = "hook.push-banner.dismissed.v1";

const COPY: Record<"admin" | "market-associate" | "partner", string> = {
  admin: "Turn on notifications so you never miss something that needs your attention",
  "market-associate": "Turn on notifications so you never miss an assignment",
  partner: "Turn on notifications so you never miss an order",
};

function wasDismissed(portal: string) {
  return typeof window !== "undefined" && window.localStorage.getItem(`${DISMISSED_KEY_PREFIX}:${portal}`) === "1";
}

/** A light, dismissible ask to enable notifications — shown only while permission is still undecided. */
export function PushPermissionBanner({ portal }: { portal: "admin" | "market-associate" | "partner" }) {
  const { permission, enable } = usePushSubscription(portal);
  const [dismissed, setDismissed] = useState(() => wasDismissed(portal));

  if (permission !== "default" || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    window.localStorage.setItem(`${DISMISSED_KEY_PREFIX}:${portal}`, "1");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-[#FFF3C4] px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white">
        <Bell size={16} className="text-[#9a7400]" />
      </span>
      <p className="flex-1 text-[13px] font-semibold text-black">{COPY[portal]}</p>
      <button
        type="button"
        onClick={() => void enable()}
        className="shrink-0 rounded-full bg-black px-3.5 py-2 text-[12px] font-bold text-white"
      >
        Enable
      </button>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-black/40 hover:text-black/70">
        <X size={16} />
      </button>
    </div>
  );
}
