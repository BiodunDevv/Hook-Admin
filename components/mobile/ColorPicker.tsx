"use client";

import { useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Common market colours, named the way Market Associates and vendors actually describe
 * them. Value stored is the plain name (not a hex code) because the catalog
 * treats variant colour as human-readable text.
 */
export const COLOR_OPTIONS: Array<{ name: string; swatch: string }> = [
  { name: "Black", swatch: "#111111" },
  { name: "White", swatch: "#FFFFFF" },
  { name: "Grey", swatch: "#9CA3AF" },
  { name: "Cream", swatch: "#F5EAD7" },
  { name: "Brown", swatch: "#7C4A21" },
  { name: "Beige", swatch: "#D8C3A5" },
  { name: "Red", swatch: "#DC2626" },
  { name: "Wine", swatch: "#7B1E3A" },
  { name: "Orange", swatch: "#F97316" },
  { name: "Yellow", swatch: "#FFC809" },
  { name: "Gold", swatch: "#C8A24A" },
  { name: "Green", swatch: "#16A34A" },
  { name: "Olive", swatch: "#6B7A2F" },
  { name: "Teal", swatch: "#0D9488" },
  { name: "Blue", swatch: "#2563EB" },
  { name: "Navy", swatch: "#1E3A5F" },
  { name: "Sky", swatch: "#61B7E8" },
  { name: "Purple", swatch: "#7C3AED" },
  { name: "Pink", swatch: "#EC4899" },
  { name: "Silver", swatch: "#C0C5CE" },
  { name: "Multi", swatch: "linear-gradient(135deg,#DC2626,#FFC809,#16A34A,#2563EB)" },
];

export function swatchFor(value: string) {
  const match = COLOR_OPTIONS.find(
    (option) => option.name.toLowerCase() === value.trim().toLowerCase(),
  );
  return match?.swatch;
}

/**
 * Renders a stored variant colour for display. Submissions made through this
 * picker always store a name ("Black"), but older/imported data can carry a
 * raw hex code instead — this resolves that to the closest named colour so
 * customers and partners never see a bare "#111111" chip.
 */
export function displayColorName(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed;

  const target = hexToRgb(trimmed);
  if (!target) return trimmed;

  let closest: { name: string; distance: number } | undefined;
  for (const option of COLOR_OPTIONS) {
    const swatchRgb = hexToRgb(option.swatch);
    if (!swatchRgb) continue;
    const distance =
      (swatchRgb.r - target.r) ** 2 + (swatchRgb.g - target.g) ** 2 + (swatchRgb.b - target.b) ** 2;
    if (!closest || distance < closest.distance) closest = { name: option.name, distance };
  }
  return closest?.name || trimmed;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized;
  if (full.length < 6) return undefined;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return undefined;
  return { r, g, b };
}

export function ColorPicker({
  value,
  onChange,
  disabled,
  placeholder = "Colour",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const swatch = swatchFor(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center gap-2 rounded-[10px] border border-input bg-transparent px-3 text-left text-sm transition disabled:opacity-50",
            className,
          )}
        >
          {swatch ? (
            <span
              className="size-5 shrink-0 rounded-full border border-black/10"
              style={{ background: swatch }}
            />
          ) : (
            <Palette className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-3">
        <div className="grid grid-cols-4 gap-2">
          {COLOR_OPTIONS.map((option) => {
            const selected = option.name.toLowerCase() === value.trim().toLowerCase();
            return (
              <button
                key={option.name}
                type="button"
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                }}
                className="flex flex-col items-center gap-1 rounded-lg p-1.5 transition hover:bg-muted"
              >
                <span
                  className="relative grid size-9 place-items-center rounded-full border border-black/10"
                  style={{ background: option.swatch }}
                >
                  {selected && (
                    <Check
                      className="size-4"
                      style={{ color: option.name === "White" || option.name === "Cream" ? "#111" : "#fff" }}
                    />
                  )}
                </span>
                <span className="text-[11px] font-medium leading-tight">{option.name}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 border-t pt-3">
          <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">
            Or type an exact colour
          </p>
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. Ankara print"
            className="h-10 rounded-[10px]"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
