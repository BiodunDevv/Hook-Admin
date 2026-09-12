"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, scoped to the given portal path only.
 *
 * A service worker's scope is NOT "whichever component called .register()" —
 * it's the URL prefix it's allowed to control, and by default that's the
 * directory the script file lives in. Since sw.js is served from the origin
 * root, an unscoped register("/sw.js") controls the ENTIRE origin, including
 * /dashboard — which is exactly how Admin ended up seeing the offline
 * fallback page after visiting a Market Associate or Partner route in the
 * same browser: the worker had installed with root scope and started
 * intercepting every navigation on the site, forever, until unregistered.
 *
 * Passing `scope` limits control to that one subtree, so Admin is never
 * touched by this worker regardless of what else has been visited in the
 * same browser profile.
 */
export function ServiceWorkerRegistration({ scope }: { scope: string }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope }).catch(() => {
      // Registration failing (unsupported browser, blocked storage, etc.)
      // shouldn't be user-visible — the app works fine without it, it just
      // loses offline/install support.
    });
  }, [scope]);

  return null;
}
