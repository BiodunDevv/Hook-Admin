"use client";

import { useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiDelete, apiPatch, apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

interface Banner { id: string; text: string; imageUrl?: string; linkType: string; linkTarget: string; placement: string; tone: string; isActive: boolean; sortOrder: number; startsAt: string | null; endsAt: string | null; }
const TONES: Record<string, string> = { gold: "bg-[#FFC809] text-black", dark: "bg-zinc-900 text-white", green: "bg-emerald-600 text-white", red: "bg-red-600 text-white" };
const EMPTY = { text: "", imageUrl: "", placement: "home", tone: "gold", linkType: "none", linkTarget: "", isActive: true, sortOrder: 0, startsAt: "", endsAt: "" };
const toLocal = (value: string | null) => (value ? new Date(value).toISOString().slice(0, 16) : "");

export function BannersSection() {
  const query = useApiQuery<Banner[]>(["admin", "banners"], "/admin/banners");
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  // Switch flips at once; the server confirms in the background and we roll back only on failure.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const banners = (query.data || []).map((banner) => (banner.id in optimistic ? { ...banner, isActive: optimistic[banner.id] } : banner));

  function open(banner: Banner | "new") {
    setForm(banner === "new" ? EMPTY : { text: banner.text, imageUrl: banner.imageUrl || "", placement: banner.placement, tone: banner.tone, linkType: banner.linkType, linkTarget: banner.linkTarget, isActive: banner.isActive, sortOrder: banner.sortOrder, startsAt: toLocal(banner.startsAt), endsAt: toLocal(banner.endsAt) });
    setEditing(banner);
  }

  async function save() {
    if (form.text.trim().length < 3) return toast.error("Write the banner message");
    setSaving(true);
    try {
      const body = { ...form, text: form.text.trim(), startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null };
      if (editing === "new") await apiPost("/admin/banners", body); else if (editing) await apiPatch(`/admin/banners/${editing.id}`, body);
      toast.success("Banner saved");
      setEditing(null);
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not save banner");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(banner: Banner, isActive: boolean) {
    setOptimistic((current) => ({ ...current, [banner.id]: isActive }));
    try {
      await apiPatch(`/admin/banners/${banner.id}`, { isActive });
      await query.refetch();
    } catch {
      toast.error("Could not update banner");
    } finally {
      setOptimistic((current) => { const next = { ...current }; delete next[banner.id]; return next; });
    }
  }

  async function remove(banner: Banner) {
    if (!confirm("Delete this banner?")) return;
    try { await apiDelete(`/admin/banners/${banner.id}`); toast.success("Banner deleted"); await query.refetch(); } catch { toast.error("Could not delete banner"); }
  }

  if (query.isLoading) return <div className="grid min-h-60 place-items-center"><HookLoader label="Loading banners" /></div>;
  if (query.isError) return <QueryState error={query.error} errorTitle="Banners could not load" onRetry={() => void query.refetch()} />;

  return (
    <Card className="gap-0 overflow-hidden border-zinc-200 py-0 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="size-5 text-brand-gold" /> Marquee banners</CardTitle>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Colour-coded messages that scroll in a slim ribbon under the app header. Changes appear in the app instantly.</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => open("new")}><Plus size={15} /> New banner</Button>
      </CardHeader>
      <CardContent className="space-y-3 p-5 sm:p-6">
        {banners.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-zinc-500">No banners yet. Add one to promote a sale, a delivery update or a new category.</p> : null}
        {banners.map((banner) => (
          <div key={banner.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center">
            <div className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-full py-1 pr-4 text-sm font-bold", banner.imageUrl ? "pl-1" : "pl-4", TONES[banner.tone])}>{banner.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={banner.imageUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" /> : null}<span className="truncate">{banner.text}</span></div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 capitalize">{banner.placement}</span>
              {banner.endsAt ? <span>Ends {new Date(banner.endsAt).toLocaleDateString()}</span> : <span>No end date</span>}
              <Switch checked={banner.isActive} onCheckedChange={(value) => void toggle(banner, value)} aria-label="Banner active" />
              <Button variant="ghost" size="icon-sm" onClick={() => open(banner)} aria-label="Edit banner"><Pencil size={14} /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => void remove(banner)} aria-label="Delete banner"><Trash2 size={14} className="text-red-500" /></Button>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(value) => { if (!value && !saving) setEditing(null); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing === "new" ? "New banner" : "Edit banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Input value={form.text} maxLength={140} onChange={(event) => setForm({ ...form, text: event.target.value })} placeholder="Free delivery to Lagos this weekend" />
              <p className="text-xs text-zinc-400">{form.text.length}/140. Keep it short so it reads at a glance.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-500">Preview as it scrolls in the app</p>
              <div className="overflow-hidden rounded-xl bg-zinc-100 px-3 py-2.5">
                <div className={cn("inline-flex max-w-full items-center gap-2.5 rounded-full py-1 pr-4 text-sm font-bold", form.imageUrl ? "pl-1" : "pl-4", TONES[form.tone])}>
                  {form.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={form.imageUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" /> : null}
                  <span className="truncate">{form.text || "Your message appears here"}</span>
                </div>
              </div>
            </div>
            <MediaPicker
              value={form.imageUrl ? [form.imageUrl] : []}
              onChange={(urls) => setForm({ ...form, imageUrl: urls[urls.length - 1] || "" })}
              maxFiles={1}
              label="Banner picture (recommended)"
              description="A square photo works best. It appears as a small round picture at the start of the message."
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Where</Label>
                <Select value={form.placement} onValueChange={(value) => setForm({ ...form, placement: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="home">Home</SelectItem><SelectItem value="category">Category pages</SelectItem><SelectItem value="all">Everywhere</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Colour</Label>
                <Select value={form.tone} onValueChange={(value) => setForm({ ...form, tone: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gold">Hook gold</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="red">Red</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Starts</Label><Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div>
              <div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></div>
              <div className="space-y-2"><Label>Tap opens</Label>
                <Select value={form.linkType} onValueChange={(value) => setForm({ ...form, linkType: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nothing</SelectItem><SelectItem value="category">A category</SelectItem><SelectItem value="product">A product</SelectItem><SelectItem value="market">A market</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Target ID</Label><Input disabled={form.linkType === "none"} value={form.linkTarget} onChange={(event) => setForm({ ...form, linkTarget: event.target.value })} placeholder="e.g. CAT-2026-000010" /></div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" min={0} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></div>
              <div className="flex items-end gap-2 pb-2"><Switch checked={form.isActive} onCheckedChange={(value) => setForm({ ...form, isActive: value })} /><Label>Active</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button variant="brand" onClick={() => void save()} disabled={saving}>{saving ? <HookLoader size="button" /> : "Save banner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
