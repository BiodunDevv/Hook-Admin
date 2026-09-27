"use client";

import { useEffect } from "react";

/** Unregisters any root-scoped service worker left from before scoped registration, since it could serve Admin the offline page by mistake. */
export function AdminServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        const scopePath = new URL(registration.scope).pathname;
        if (scopePath === "/") registration.unregister();
      }
    });
  }, []);

  return null;
}
