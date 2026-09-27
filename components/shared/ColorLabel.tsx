import { colorName, colorSwatch, isColorCode } from "@/lib/color-name";
import { cn } from "@/lib/utils";

/** A colour as a swatch and name, never a code; the original code stays available on hover and to screen readers. */
export function ColorLabel({ value, className, swatchClassName }: { value?: string | null; className?: string; swatchClassName?: string }) {
  const name = colorName(value);
  if (!name) return null;
  const swatch = colorSwatch(value);
  const code = value && isColorCode(value) ? value.trim().toUpperCase() : undefined;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={code ? `${name} (${code})` : name}>
      {swatch ? <span aria-hidden className={cn("size-3.5 shrink-0 rounded-full ring-1 ring-black/15", swatchClassName)} style={{ background: swatch }} /> : null}
      <span>{name}</span>
      {code ? <span className="sr-only">{code}</span> : null}
    </span>
  );
}
