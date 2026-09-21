"use client";

import { Archive, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type DirectoryTab = "active" | "archived";

/** Switches a people directory between everyday accounts and archived ones. */
export function ArchiveTabs({ value, onChange, activeLabel = "Active" }: { value: DirectoryTab; onChange: (next: DirectoryTab) => void; activeLabel?: string }) {
  const tabs: Array<[DirectoryTab, string, typeof Users]> = [["active", activeLabel, Users], ["archived", "Archived", Archive]];
  return (
    <div role="tablist" className="inline-flex rounded-lg bg-muted p-1">
      {tabs.map(([key, label, Icon]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} onClick={() => onChange(key)} className={cn("inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition", value === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}
