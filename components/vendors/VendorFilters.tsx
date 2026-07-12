"use client";

import { ChevronDown, Shield, Store, X } from "lucide-react";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StateDropdown } from "@/components/operations/StateDropdown";

const STATUS_OPTIONS = [
  { label: "All vendors", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending review", value: "pending" },
  { label: "Inactive", value: "inactive" },
];

const TIER_OPTIONS = [
  { label: "All tiers", value: "all" },
  { label: "Tier 1", value: "tier_1" },
  { label: "Tier 2", value: "tier_2" },
  { label: "Tier 3", value: "tier_3" },
];

interface VendorFiltersProps {
  search: string;
  status: string;
  tier: string;
  stateCode: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTierChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onClear: () => void;
}

export function VendorFilters({
  search,
  status,
  tier,
  stateCode,
  onSearchChange,
  onStatusChange,
  onTierChange,
  onStateChange,
  onClear,
}: VendorFiltersProps) {
  const activeCount = [search, status !== "all" ? status : "", tier !== "all" ? tier : "", stateCode !== "all" ? stateCode : ""].filter(Boolean).length;
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === status)?.label || "All vendors";
  const tierLabel = TIER_OPTIONS.find((option) => option.value === tier)?.label || "All tiers";

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search vendors, owners..."
          className="w-full sm:w-64 lg:w-72"
          value={search}
          onChange={onSearchChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="justify-between gap-2 text-zinc-700">
                <Store size={14} />
                <span>{statusLabel}</span>
                {status !== "all" && (
                  <span className="rounded-full bg-brand-gold px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900">1</span>
                )}
                <ChevronDown size={13} className="text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Vendor status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={status} onValueChange={onStatusChange}>
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="justify-between gap-2 text-zinc-700">
                <Shield size={14} />
                <span>{tierLabel}</span>
                {tier !== "all" && (
                  <span className="rounded-full bg-brand-gold px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900">1</span>
                )}
                <ChevronDown size={13} className="text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Partner tier</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={tier} onValueChange={onTierChange}>
                {TIER_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <StateDropdown value={stateCode} onChange={onStateChange} />
        </div>
      </div>

      {activeCount > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="self-start text-zinc-500 lg:self-auto">
          <X size={14} />
          Clear
        </Button>
      )}
    </div>
  );
}
