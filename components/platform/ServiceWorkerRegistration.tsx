"use client";

import { useEffect } from "react";

/** Registers public/sw.js scoped to one portal path only, so it never controls Admin the way an unscoped register() would. */
export function ServiceWorkerRegistration({ scope }: { scope: string }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A worker left over from a production/PWA test must never control Next's regenerated dev chunks.
      void Promise.all([
        navigator.serviceWorker.getRegistrations().then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) => new URL(registration.scope).origin === window.location.origin)
              .map((registration) => registration.unregister()),
          )),
        "caches" in window
          ? caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("hook-shell-")).map((key) => caches.delete(key))))
          : Promise.resolve([]),
      ]);
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope, updateViaCache: "none" }).then((registration) => {
      void registration.update();
    }).catch(() => {
    });
  }, [scope]);

  return null;
}
