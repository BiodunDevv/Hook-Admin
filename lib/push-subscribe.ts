"use client";

import { useEffect, useState } from "react";
import { apiPost } from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// pushManager.subscribe wants the VAPID key as a raw Uint8Array, not the base64url string it's issued as.
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

/**
 * Subscribes this browser to Web Push once notification permission is
 * granted, via the service worker each portal registers for its own routes
 * (ServiceWorkerRegistration, scoped per portal). Safe to call repeatedly —
 * it no-ops once a live subscription already exists.
 */
function currentPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  return Notification.permission;
}

export function usePushSubscription(endpointPrefix: "admin" | "market-associate" | "partner") {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(currentPermission);

  useEffect(() => {
    if (permission !== "granted" || !VAPID_PUBLIC_KEY) return;
    void subscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return;
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
    await apiPost(`/${endpointPrefix}/push/subscribe`, { endpoint: json.endpoint, keys: json.keys }).catch(() => undefined);
  }

  async function enable() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await subscribe();
  }

  return { permission, enable };
}
