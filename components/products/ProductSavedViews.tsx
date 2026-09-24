"use client";

import { useState } from "react";
import { BookmarkPlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiDelete, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

interface SavedView {
  publicId: string;
  name: string;
  params: Record<string, string>;
}

/**
 * Lets an admin save the products list's current search/status/category/etc
 * filter combination under a name, and reapply it in one click later. Views
 * are private to the admin who saved them.
 */
export function ProductSavedViews({ currentParams, onApply }: { currentParams: Record<string, string>; onApply: (params: Record<string, string>) => void }) {
  const query = useApiQuery<{ data: SavedView[] }>(["admin", "saved-views", "products"], "/admin/saved-views?page=products");
  const views = query.data?.data || [];
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (name.trim().length < 1) return;
    setBusy(true);
    try {
      await apiPost("/admin/saved-views", { page: "products", name: name.trim(), params: currentParams });
      toast.success("View saved");
      setSaving(false);
      setName("");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not save this view");
    } finally {
      setBusy(false);
    }
  }

  async function remove(view: SavedView) {
    try {
      await apiDelete(`/admin/saved-views/${view.publicId}`);
      toast.success(`"${view.name}" removed`);
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not remove this view");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><BookmarkPlus size={13} /> Views</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {views.length ? views.map((view) => (
            <DropdownMenuItem key={view.publicId} className="justify-between gap-2" onSelect={() => onApply(view.params)}>
              <span className="truncate">{view.name}</span>
              <button
                type="button"
                aria-label={`Remove ${view.name}`}
                className="shrink-0 text-zinc-400 hover:text-destructive"
                onClick={(event) => { event.stopPropagation(); void remove(view); }}
              >
                <Trash2 size={13} />
              </button>
            </DropdownMenuItem>
          )) : (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved views yet</div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setSaving(true)}><Save size={14} /> Save current filters…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saving} onOpenChange={(open) => { if (!busy) setSaving(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this view</DialogTitle>
            <DialogDescription>Saves the current search, filters, sort, and layout so you can reapply them in one click.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="view-name">Name</Label>
            <Input id="view-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Paused products in Lagos" maxLength={80} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setSaving(false)}>Cancel</Button>
            <Button variant="brand" disabled={busy || name.trim().length < 1} onClick={() => void save()}>{busy ? "Saving..." : "Save view"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
