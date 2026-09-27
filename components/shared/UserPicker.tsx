"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";

export interface PickedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accountType?: string;
}

interface RawUserMatch {
  _id?: string;
  publicId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accountType?: string;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

export function userName(user: PickedUser) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
}

/** Multi-select account picker searching every account type via /admin/communications/search-users. */
export function UserPicker({
  label = "Search by email or name",
  selected,
  onChange,
}: {
  label?: string;
  selected: PickedUser[];
  onChange: (users: PickedUser[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<PickedUser[]>([]);

  async function search() {
    const term = query.trim();
    if (term.length < 2) return toast.error("Enter at least 2 characters");
    setSearching(true);
    try {
      const matches = await apiGet<RawUserMatch[]>(`/admin/communications/search-users?q=${encodeURIComponent(term)}`);
      const normalized = (matches || []).flatMap((match) => {
        // resolveAudience's userIds branch matches on Mongo _id, not publicId — keep this the raw _id.
        const id = match._id;
        return id ? [{ id: String(id), email: match.email, firstName: match.firstName, lastName: match.lastName, accountType: match.accountType }] : [];
      });
      setResults(normalized);
      if (!normalized.length) toast.info("No accounts matched that search");
    } catch (error) {
      toast.error(errorMessage(error, "Search failed"));
    } finally {
      setSearching(false);
    }
  }

  function add(user: PickedUser) {
    if (!user.id) return;
    if (selected.some((existing) => existing.id === user.id)) return;
    onChange([...selected, user]);
  }

  function remove(id: string) {
    onChange(selected.filter((user) => user.id !== id));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="user-picker-search">{label}</Label>
      <div className="flex gap-2">
        <Input
          id="user-picker-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }}
          placeholder="Search by email or name"
        />
        <Button type="button" variant="outline" disabled={searching} onClick={() => void search()}><Search size={15} /></Button>
      </div>

      {results.length ? (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1.5">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => add(user)}
              disabled={selected.some((existing) => existing.id === user.id)}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-zinc-100 disabled:opacity-50"
            >
              <span className="min-w-0"><span className="block truncate font-medium text-foreground">{userName(user)}</span><span className="block truncate text-xs text-muted-foreground">{user.email}{user.accountType ? ` · ${user.accountType}` : ""}</span></span>
            </button>
          ))}
        </div>
      ) : null}

      {selected.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <span key={user.id} className="inline-flex items-center gap-1 rounded-full border bg-zinc-50 px-2.5 py-1 text-xs text-foreground">
              {userName(user)}
              <button type="button" onClick={() => remove(user.id)} aria-label={`Remove ${user.email}`}><X className="size-3 text-muted-foreground" /></button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
