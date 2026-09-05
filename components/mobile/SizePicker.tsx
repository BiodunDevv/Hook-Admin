"use client";

import { useState } from "react";
import { ChevronDown, Ruler } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SizingPresetGroup } from "@/lib/sizing-guide";

const ALL_SIZE_GROUPS: Array<{ key: SizingPresetGroup; label: string; sizes: string[] }> = [
  { key: "clothing", label: "Clothing", sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  {
    key: "shoes",
    label: "Shoes (EU)",
    sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  },
  { key: "general", label: "General", sizes: ["One Size", "Small", "Medium", "Large"] },
];

export function SizePicker({
  value,
  onChange,
  disabled,
  placeholder = "Size",
  className,
  groups,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Category-specific preset groups to show. Falls back to all groups when omitted or empty. */
  groups?: SizingPresetGroup[];
}) {
  const [open, setOpen] = useState(false);
  const visibleGroups = groups?.length ? ALL_SIZE_GROUPS.filter((group) => groups.includes(group.key)) : ALL_SIZE_GROUPS;

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
          <Ruler className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-3">
        <div className="space-y-3">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.sizes.map((size) => {
                  const selected = size.toLowerCase() === value.trim().toLowerCase();
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        onChange(size);
                        setOpen(false);
                      }}
                      className={cn(
                        "min-w-11 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition",
                        selected ? "bg-[#FFC809] text-black" : "bg-muted hover:bg-muted/70",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t pt-3">
          <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">
            Or type an exact size
          </p>
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. 42 wide"
            className="h-10 rounded-[10px]"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
