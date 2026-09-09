import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/decor-icon";

interface AuthCardProps {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
  /** Renders a "Back to login" affordance under the form. */
  backHref?: string;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Framed auth panel: hairline rules with corner marks, in the efferd auth-2
 * idiom but carrying Hook's own logo and gold accent.
 */
export function AuthCard({
  title,
  description,
  children,
  backHref,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "relative flex w-full max-w-sm flex-col p-6 md:p-8",
        className,
      )}
    >
      {/* Gold glow bleeding out of the top-left corner mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 -left-6 size-64 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--color-brand-gold)_38%,transparent),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--color-brand-gold)_26%,transparent),transparent_70%)]"
      />

      {/* Hairline frame */}
      <div className="absolute -inset-y-6 -left-px w-px bg-border" />
      <div className="absolute -inset-y-6 -right-px w-px bg-border" />
      <div className="absolute -inset-x-6 -top-px h-px bg-border" />
      <div className="absolute -inset-x-6 -bottom-px h-px bg-border" />
      <DecorIcon position="top-left" />
      <DecorIcon position="bottom-right" />

      <div className="relative flex w-full flex-col gap-8 animate-in fade-in-50 duration-500">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground text-pretty">
            {description}
          </p>
        </div>

        {children}

        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        )}

        {footer}
      </div>
    </div>
  );
}
