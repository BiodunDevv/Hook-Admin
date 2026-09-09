"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js. Mounted only from AppTabBarShell — the shell
 * Admin never renders — so this is the actual enforcement point for "Admin
 * doesn't get PWA behavior," not the manifest file (which Next can't scope
 * per route group).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing (unsupported browser, blocked storage, etc.)
      // shouldn't be user-visible — the app works fine without it, it just
      // loses offline/install support.
    });
  }, []);

  return null;
}
