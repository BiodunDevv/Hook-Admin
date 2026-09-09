import { WifiOff } from "lucide-react";
import { HookLogo } from "@/components/shared/HookLogo";

/**
 * Served straight from the service worker's cache on a failed navigation —
 * see public/sw.js. Deliberately a server component with no client-side
 * interactivity: this page needs to work with zero network access, and
 * hydration JS is content-hashed per build, so precaching a specific script
 * bundle here would break on the next deploy anyway. A plain anchor retry
 * (browser-native reload, no onClick) means it renders and works from the
 * cached HTML alone, no script required.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-[#F5F5F5] px-6 text-center">
      <HookLogo className="text-3xl" />
      <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
        <WifiOff className="size-7 text-zinc-400" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold text-zinc-950">You&apos;re offline</h1>
        <p className="max-w-xs text-sm leading-6 text-zinc-500">
          Check your connection and try again. Anything you already loaded stays available.
        </p>
      </div>
      {/* A plain anchor, deliberately not next/link — Link needs the client
          router (and its JS bundle) to work, which is exactly what this page
          can't assume is available. A full browser navigation always works. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full bg-[#FFC809] px-6 text-[15px] font-bold text-black transition hover:bg-[#f0bb00]"
      >
        Try again
      </a>
    </main>
  );
}
