"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { COLOR_OPTIONS, swatchFor } from "@/components/mobile/ColorPicker";
import { attributeOptions, type CategoryAttribute } from "@/lib/category-attributes";
import { cn } from "@/lib/utils";

export type BuilderVariant = { size: string; colour: string; attributes: Record<string, string>; active: boolean };

const isSize = (attribute: CategoryAttribute) => attribute.type === "size" || attribute.key === "size";
const readValue = (variant: BuilderVariant, attribute: CategoryAttribute) =>
  isSize(attribute) ? variant.size : attribute.type === "colour" ? variant.colour : variant.attributes[attribute.key] || "";
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Every combination of the chosen values, one row each, keeping rows the associate already had. */
function combine(axes: Array<{ attribute: CategoryAttribute; values: string[] }>, existing: BuilderVariant[]): BuilderVariant[] {
  const used = axes.filter((axis) => axis.values.length);
  if (!used.length) return [];
  let rows: BuilderVariant[] = [{ size: "", colour: "", attributes: {}, active: true }];
  for (const { attribute, values } of used) {
    rows = rows.flatMap((row) =>
      values.map((value) => {
        if (isSize(attribute)) return { ...row, size: value };
        if (attribute.type === "colour") return { ...row, colour: value };
        return { ...row, attributes: { ...row.attributes, [attribute.key]: value } };
      }),
    );
  }
  return rows.map((row) => {
    const match = existing.find((old) => used.every(({ attribute }) => same(readValue(old, attribute), readValue(row, attribute))));
    return match ? { ...row, active: match.active } : row;
  });
}

/**
 * Category-driven variant builder. The category decides which choices exist
 * (size and colour for shoes, capacity and colour for a powerbank); the associate
 * ticks what the vendor has, and the combinations are made for them.
 */
export function VariantBuilder({
  attributes,
  variants,
  disabled,
  presetGroups,
  onChange,
}: {
  attributes: CategoryAttribute[];
  variants: BuilderVariant[];
  disabled?: boolean;
  presetGroups?: Array<{ key?: string; label?: string; sizes?: string[] }>;
  onChange: (variants: BuilderVariant[]) => void;
}) {
  const axes = attributes.filter((attribute) => attribute.variantAxis !== false);
  // Values already present on the saved variants, per axis.
  const chosen = useMemo(
    () => axes.map((attribute) => ({ attribute, values: [...new Set(variants.map((variant) => readValue(variant, attribute).trim()).filter(Boolean))] })),
    [axes, variants],
  );
  const [typed, setTyped] = useState<Record<string, string>>({});

  function setValues(attribute: CategoryAttribute, values: string[]) {
    onChange(combine(chosen.map((axis) => (axis.attribute.key === attribute.key ? { attribute, values } : axis)), variants));
  }
  const toggle = (attribute: CategoryAttribute, value: string) => {
    const current = chosen.find((axis) => axis.attribute.key === attribute.key)?.values || [];
    setValues(attribute, current.some((item) => same(item, value)) ? current.filter((item) => !same(item, value)) : [...current, value]);
  };

  const counts = chosen.filter((axis) => axis.values.length);
  const total = counts.reduce((product, axis) => product * axis.values.length, 1);
  const activeCount = variants.filter((variant) => variant.active).length;

  return (
    <div className="space-y-5">
      {chosen.map(({ attribute, values }) => {
        const options = attributeOptions(attribute) || (isSize(attribute) ? presetGroups?.flatMap((group) => group.sizes || []) : undefined);
        const custom = values.filter((value) => !(options || []).some((option) => same(option, value)));
        return (
          <div key={attribute.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-zinc-800">{attribute.label}{attribute.required ? <span className="text-red-500"> *</span> : <span className="font-normal text-zinc-400"> (optional)</span>}</p>
              {options?.length && !disabled ? (
                <button type="button" className="text-[12px] font-medium text-[#9a7400]" onClick={() => setValues(attribute, values.length === options.length ? [] : [...options])}>
                  {values.length === options.length ? "Clear all" : "Select all"}
                </button>
              ) : null}
            </div>

            {attribute.type === "colour" ? (
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((colour) => {
                  const on = values.some((value) => same(value, colour.name));
                  return (
                    <button key={colour.name} type="button" disabled={disabled} onClick={() => toggle(attribute, colour.name)} aria-pressed={on} aria-label={colour.name} className={cn("flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12px] transition", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700")}>
                      <span className="size-5 rounded-full border border-black/10" style={{ background: swatchFor(colour.name) }} />
                      {colour.name}
                      {on ? <Check className="size-3" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : options?.length ? (
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const on = values.some((value) => same(value, option));
                  return (
                    <button key={option} type="button" disabled={disabled} onClick={() => toggle(attribute, option)} aria-pressed={on} className={cn("min-w-11 rounded-full border px-3 py-1.5 text-[13px] font-medium transition", on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700")}>
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Anything outside the list, or a free-text detail, is added by hand. */}
            {attribute.type !== "colour" && (!options?.length || isSize(attribute)) ? (
              <div className="flex flex-wrap items-center gap-2">
                {custom.map((value) => (
                  <span key={value} className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-[13px] text-white">
                    {value}
                    {!disabled ? <button type="button" onClick={() => toggle(attribute, value)} aria-label={`Remove ${value}`}><X className="size-3" /></button> : null}
                  </span>
                ))}
                {!disabled ? (
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const value = (typed[attribute.key] || "").trim();
                      if (!value) return;
                      if (!values.some((item) => same(item, value))) setValues(attribute, [...values, value]);
                      setTyped((current) => ({ ...current, [attribute.key]: "" }));
                    }}
                  >
                    <input value={typed[attribute.key] || ""} onChange={(event) => setTyped((current) => ({ ...current, [attribute.key]: event.target.value }))} placeholder={options?.length ? "Other size" : `Add ${attribute.label.toLowerCase()}`} className="h-9 w-36 rounded-full border border-dashed border-zinc-300 bg-white px-3 text-[13px] outline-none focus:border-zinc-900" />
                    <button type="submit" className="grid size-9 place-items-center rounded-full bg-zinc-100" aria-label="Add"><Plus className="size-4" /></button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {counts.length ? (
        <div className="rounded-[12px] bg-[#F7F7F7] p-3">
          <p className="text-[13px] font-semibold text-zinc-800">
            {counts.length > 1 ? `${counts.map((axis) => axis.values.length).join(" × ")} = ` : ""}{total} variant{total === 1 ? "" : "s"}
            <span className="font-normal text-zinc-500"> · {activeCount} in stock</span>
          </p>
          <p className="mb-2 text-[12px] text-zinc-500">Switch off the combinations the vendor does not have.</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {variants.map((variant, index) => (
              <button key={index} type="button" disabled={disabled} onClick={() => onChange(variants.map((item, itemIndex) => (itemIndex === index ? { ...item, active: !item.active } : item)))} aria-pressed={variant.active} className={cn("flex items-center gap-2 rounded-[10px] border bg-white px-3 py-2 text-left text-[13px] transition", variant.active ? "border-zinc-200" : "border-dashed border-zinc-300 text-zinc-400 line-through")}>
                <span className={cn("grid size-4 shrink-0 place-items-center rounded border", variant.active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300")}>{variant.active ? <Check className="size-3" /> : null}</span>
                <span className="truncate">{chosen.filter((axis) => axis.values.length).map((axis) => readValue(variant, axis.attribute)).filter(Boolean).join(" · ")}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-[12px] border border-dashed p-3 text-center text-[13px] text-zinc-500">Pick at least one option above to create variants.</p>
      )}
    </div>
  );
}
