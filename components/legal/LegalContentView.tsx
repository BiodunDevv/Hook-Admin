import { HookLogo } from "@/components/shared/HookLogo";

export function LegalContentView({
  title,
  effectiveDate,
  bodyHtml,
}: {
  title: string;
  effectiveDate?: string | null;
  bodyHtml: string;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-zinc-950 px-6 py-10 text-center text-white sm:px-10">
        <HookLogo className="text-2xl" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {effectiveDate ? (
          <p className="mt-2 text-sm text-zinc-400">
            Effective {new Date(effectiveDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        ) : null}
      </div>
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10">
        {bodyHtml ? (
          <div
            className="legal-content space-y-4 text-sm leading-7 text-muted-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_a]:font-medium [&_a]:text-brand-gold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">This document has not been published yet.</p>
        )}
      </div>
    </div>
  );
}
