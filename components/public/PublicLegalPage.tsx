"use client";

import { useMemo } from "react";
import { PublicShell } from "@/components/public/PublicShell";

/**
 * A published legal document (terms, privacy, returns) in the public frame.
 * The brand panel carries a contents list built from the document's own
 * headings, so long policies stay navigable.
 */
export function PublicLegalPage({
  title,
  bodyHtml,
  effectiveDate,
}: {
  title: string;
  bodyHtml: string;
  effectiveDate?: string | null;
}) {
  const { html, headings } = useMemo(() => {
    const found: Array<{ id: string; title: string }> = [];
    const withIds = bodyHtml.replace(/<h2>([\s\S]*?)<\/h2>/gi, (_match, inner: string) => {
      const id = `section-${found.length + 1}`;
      found.push({ id, title: inner.replace(/<[^>]+>/g, "").trim() });
      return `<h2 id="${id}">${inner}</h2>`;
    });
    return { html: withIds, headings: found };
  }, [bodyHtml]);

  const effective = effectiveDate
    ? new Date(effectiveDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <PublicShell
      eyebrow="Legal"
      title={title}
      description={effective ? `Effective ${effective}` : undefined}
      width="3xl"
      aside={
        headings.length > 1 ? (
          <nav aria-label="Contents" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contents</p>
            <ol className="space-y-1.5 border-l border-white/10">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a className="-ml-px block border-l border-transparent py-1 pl-4 text-sm text-zinc-400 transition hover:border-brand-gold hover:text-white" href={`#${heading.id}`}>
                    {heading.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null
      }
    >
      <article className="rounded-2xl bg-card px-6 py-8 shadow-sm ring-1 ring-foreground/10 sm:px-10 sm:py-10">
        {html ? (
          <div
            className="legal-content space-y-4 text-[15px] leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-brand-gold [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:scroll-mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">This document has not been published yet.</p>
        )}
      </article>
    </PublicShell>
  );
}
