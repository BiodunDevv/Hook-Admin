import { WifiOff } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";

/** Offline fallback served from the service worker's cache; a server component with a plain reload link so it needs no script. */
export default function OfflinePage() {
  return (
    <PublicShell
      eyebrow="No connection"
      title="You're offline"
      description="Check your connection and try again. Anything you already loaded stays available."
      width="md"
      centered
    >
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-card px-6 py-10 text-center shadow-sm ring-1 ring-foreground/10">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted">
          <WifiOff className="size-7 text-muted-foreground" />
        </span>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          We could not reach Hook. Once you are back online, this page will load normally.
        </p>
        {/* A plain anchor, deliberately not next/link — Link needs the client
            router (and its JS bundle) to work, which is exactly what this page
            can't assume is available. A full browser navigation always works. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-brand-gold px-6 text-[15px] font-bold text-zinc-950 transition hover:bg-brand-gold/85"
        >
          Try again
        </a>
      </div>
    </PublicShell>
  );
}
