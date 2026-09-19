import type { ReactNode } from "react";
import { HookLogo } from "@/components/shared/HookLogo";
import { cn } from "@/lib/utils";

const WIDTHS = { md: "max-w-md", lg: "max-w-lg", "2xl": "max-w-2xl", "3xl": "max-w-3xl" } as const;

export const PUBLIC_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/returns", label: "Returns" },
  { href: "/delete-account", label: "Delete account" },
];

/**
 * The frame for every customer-facing page that is not part of the admin
 * dashboard (legal pages, account deletion, invitations, activation). A dark
 * brand panel on the left and the content on the right, using the whole
 * screen on desktop and stacking on phones. Keeping it in one place is what
 * keeps those pages looking like one product.
 */
export function PublicShell({
  eyebrow,
  title,
  description,
  aside,
  children,
  width = "2xl",
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Extra content under the description in the brand panel (steps, contents list…). */
  aside?: ReactNode;
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  /** Vertically centre the content on tall screens: for short forms. */
  centered?: boolean;
}) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-[minmax(340px,5fr)_7fr]">
      <aside className="flex flex-col justify-between gap-10 bg-zinc-950 px-6 py-10 text-white sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:px-14 lg:py-14">
        <div className="space-y-10">
          <HookLogo className="text-3xl" />
          <div className="space-y-4">
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">{eyebrow}</p> : null}
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
            {description ? <p className="max-w-md text-base leading-7 text-zinc-400">{description}</p> : null}
          </div>
          {aside}
        </div>
        <nav aria-label="Legal and account" className="space-y-3 text-xs text-zinc-500">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.href}>
                <a className="font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline" href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
          <p>&copy; {new Date().getFullYear()} Hook</p>
        </nav>
      </aside>

      <main className={cn("bg-muted/30 px-4 py-10 sm:px-8 lg:px-14 lg:py-14", centered && "lg:flex lg:min-h-screen lg:items-center")}>
        <div className={cn("mx-auto w-full", WIDTHS[width])}>{children}</div>
      </main>
    </div>
  );
}
