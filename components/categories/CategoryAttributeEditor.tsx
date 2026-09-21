"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, List, Palette, Ruler, Trash2, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SIZE_PRESET_LABEL,
  SIZE_PRESET_VALUES,
  attributeKey,
  type AttributeType,
  type CategoryAttribute,
  type SizePreset,
} from "@/lib/category-attributes";
import { cn } from "@/lib/utils";

const TYPE_META: Record<AttributeType, { icon: typeof Ruler; name: string; hint: string }> = {
  size: { icon: Ruler, name: "Size", hint: "Shoe, clothing or bra sizes" },
  colour: { icon: Palette, name: "Colour", hint: "Colour swatches" },
  select: { icon: List, name: "Pick from a list", hint: "e.g. capacity, length, texture" },
  text: { icon: Type, name: "Free text", hint: "e.g. phone model" },
};

/** A row of removable chips with an input that adds on Enter or comma. */
function ChipInput({ values, onChange, placeholder }: { values: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const parts = draft.split(",").map((part) => part.trim()).filter((part) => part && !values.some((value) => value.toLowerCase() === part.toLowerCase()));
    if (parts.length) onChange([...values, ...parts]);
    setDraft("");
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-white p-1.5 focus-within:ring-2 focus-within:ring-brand-gold/40">
      {values.map((value) => (
        <span key={value} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-1 pl-2 pr-1 text-xs font-medium text-zinc-800">
          {value}
          <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} className="grid size-4 place-items-center rounded hover:bg-zinc-200" aria-label={`Remove ${value}`}><X size={11} /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") { event.preventDefault(); commit(); }
          else if (event.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={commit}
        placeholder={values.length ? "Add another…" : placeholder}
        className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
      />
    </div>
  );
}

const summaryOf = (attribute: CategoryAttribute) => {
  const parts: string[] = [TYPE_META[attribute.type].name];
  if (attribute.type === "size" && attribute.preset) parts.push(SIZE_PRESET_LABEL[attribute.preset].replace(/ \(.*\)/, ""));
  if (attribute.type === "select" && attribute.options?.length) parts.push(`${attribute.options.length} options`);
  parts.push(attribute.required ? "Required" : "Optional");
  return parts.join(" · ");
};

/**
 * What a product in this category asks for. Each row is one question, shown
 * collapsed as a one-line summary and opened to edit. A live preview shows
 * exactly what a Market Associate will see.
 */
export function CategoryAttributeEditor({
  attributes,
  onChange,
}: {
  attributes: CategoryAttribute[];
  onChange: (next: CategoryAttribute[]) => void;
  inheritedNote?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const update = (index: number, patch: Partial<CategoryAttribute>) =>
    onChange(attributes.map((attribute, position) => (position === index ? { ...attribute, ...patch } : attribute)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= attributes.length) return;
    const next = [...attributes];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpenIndex(target);
  };
  const add = (type: AttributeType) => {
    const base: CategoryAttribute =
      type === "size" ? { key: "size", label: "Size", type, required: true, preset: "clothing", variantAxis: true }
        : type === "colour" ? { key: "colour", label: "Colour", type, required: true, variantAxis: true }
          : { key: "", label: "", type, required: false, options: type === "select" ? [] : undefined, variantAxis: true };
    onChange([...attributes, base]);
    setOpenIndex(attributes.length);
  };
  const available = (Object.keys(TYPE_META) as AttributeType[]).filter((type) => !((type === "size" || type === "colour") && attributes.some((attribute) => attribute.type === type)));

  return (
    <div className="space-y-4">
      {attributes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm font-medium text-zinc-800">No questions yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-zinc-500">Products here will only ask for a title, price and photos. Add a question, or start from a template above.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {attributes.map((attribute, index) => {
            const meta = TYPE_META[attribute.type];
            const Icon = meta.icon;
            const open = openIndex === index;
            const options = attribute.type === "size" ? SIZE_PRESET_VALUES[attribute.preset || "clothing"] : attribute.options;
            return (
              <li key={index} className={cn("overflow-hidden rounded-xl border bg-white transition", open ? "border-zinc-300 shadow-sm" : "border-zinc-200")}>
                <button type="button" onClick={() => setOpenIndex(open ? null : index)} aria-expanded={open} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600"><Icon size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">{attribute.label || "Untitled question"}</span>
                    <span className="block truncate text-xs text-zinc-500">{summaryOf(attribute)}</span>
                  </span>
                  <ChevronDown size={16} className={cn("shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
                </button>

                {open ? (
                  <div className="space-y-4 border-t bg-zinc-50/60 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Question</Label>
                        <Input
                          value={attribute.label}
                          disabled={attribute.type === "size" || attribute.type === "colour"}
                          onChange={(event) => {
                            const label = event.target.value;
                            update(index, { label, ...(attribute.type === "select" || attribute.type === "text" ? { key: attributeKey(label) } : {}) });
                          }}
                          placeholder="e.g. Capacity"
                        />
                      </div>
                      {attribute.type === "size" ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Size scale</Label>
                          <Select value={attribute.preset || "clothing"} onValueChange={(value) => update(index, { preset: value as SizePreset })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{(Object.keys(SIZE_PRESET_LABEL) as SizePreset[]).map((preset) => <SelectItem key={preset} value={preset}>{SIZE_PRESET_LABEL[preset]}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Answer type</Label>
                          <p className="flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-sm text-zinc-600"><Icon size={14} /> {meta.name}</p>
                        </div>
                      )}
                    </div>

                    {attribute.type === "select" ? (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Choices</Label>
                        <ChipInput values={attribute.options || []} onChange={(next) => update(index, { options: next })} placeholder="Type a choice and press Enter" />
                        <p className="text-xs text-zinc-500">Press Enter or comma after each one. You can paste a comma-separated list.</p>
                      </div>
                    ) : null}

                    <div className="divide-y rounded-lg border bg-white">
                      <label className="flex cursor-pointer items-center justify-between gap-4 px-3 py-2.5">
                        <span><span className="block text-sm font-medium text-zinc-900">Required</span><span className="block text-xs text-zinc-500">A product can&apos;t be submitted without it.</span></span>
                        <Switch checked={attribute.required} onCheckedChange={(value) => update(index, { required: value })} />
                      </label>
                      <label className="flex cursor-pointer items-center justify-between gap-4 px-3 py-2.5">
                        <span><span className="block text-sm font-medium text-zinc-900">Customer picks this</span><span className="block text-xs text-zinc-500">Each answer is a separate option to buy, like size 42 or Red.</span></span>
                        <Switch checked={attribute.variantAxis} onCheckedChange={(value) => update(index, { variantAxis: value })} />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp size={13} /></Button>
                        <Button type="button" variant="outline" size="icon-sm" onClick={() => move(index, 1)} disabled={index === attributes.length - 1} aria-label="Move down"><ArrowDown size={13} /></Button>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { onChange(attributes.filter((_, position) => position !== index)); setOpenIndex(null); }}>
                        <Trash2 size={13} /> Remove
                      </Button>
                    </div>
                    {options?.length && attribute.type !== "select" ? <p className="text-[11px] text-zinc-400">Includes: {options.slice(0, 8).join(", ")}{options.length > 8 ? `, +${options.length - 8} more` : ""}</p> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">Add a question:</span>
        {available.map((type) => {
          const Icon = TYPE_META[type].icon;
          return (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => add(type)} title={TYPE_META[type].hint}><Icon size={13} /> {TYPE_META[type].name}</Button>
          );
        })}
      </div>

      {attributes.length ? (
        <div className="rounded-xl border bg-zinc-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">What a Market Associate sees</p>
          <div className="space-y-2.5">
            {attributes.filter((attribute) => attribute.label).map((attribute, index) => {
              const values = attribute.type === "size" ? SIZE_PRESET_VALUES[attribute.preset || "clothing"].slice(0, 6) : attribute.type === "select" ? (attribute.options || []).slice(0, 6) : [];
              return (
                <div key={index}>
                  <p className="text-xs font-medium text-zinc-700">{attribute.label}{attribute.required ? <span className="text-red-500"> *</span> : null}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {attribute.type === "colour" ? ["#111111", "#FFFFFF", "#DC2626", "#2563EB", "#16A34A"].map((swatch) => <span key={swatch} className="size-5 rounded-full border border-black/10" style={{ background: swatch }} />)
                      : attribute.type === "text" ? <span className="rounded-md border border-dashed bg-white px-2 py-1 text-xs text-zinc-400">Type an answer…</span>
                        : values.map((value) => <span key={value} className="rounded-full border bg-white px-2.5 py-0.5 text-xs text-zinc-700">{value}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
