"use client";

import { useState } from "react";
import { GripVertical, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
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

interface Banner { id: string; text: string; imageUrl?: string; linkType: string; linkTarget: string; placement: string; tone: string; colorBg?: string | null; colorFg?: string | null; isActive: boolean; sortOrder: number; startsAt: string | null; endsAt: string | null; }

/** The four presets, as hex — kept as quick-pick swatches and as the fallback for banners that never picked a custom colour. */
const TONE_HEX: Record<string, { bg: string; fg: string }> = {
  gold: { bg: "#FFC809", fg: "#111111" },
  dark: { bg: "#18181B", fg: "#FFFFFF" },
  green: { bg: "#059669", fg: "#FFFFFF" },
  red: { bg: "#DC2626", fg: "#FFFFFF" },
};
const EMPTY = { text: "", imageUrl: "", placement: "home", tone: "gold", colorBg: "" as string, colorFg: "" as string, linkType: "none", linkTarget: "", isActive: true, sortOrder: 0, startsAt: "", endsAt: "" };
const toLocal = (value: string | null) => (value ? new Date(value).toISOString().slice(0, 16) : "");

/** A banner's actual colours: its custom pick if it has one, else the tone preset. One source of truth for both the list and the editor preview. */
function resolveColors(banner: { tone: string; colorBg?: string | null; colorFg?: string | null }) {
  if (banner.colorBg && banner.colorFg) return { bg: banner.colorBg, fg: banner.colorFg };
  return TONE_HEX[banner.tone] || TONE_HEX.gold;
}

/** Relative luminance (WCAG) to pick a readable text colour for whatever background an admin chooses. */
function readableTextColor(bgHex: string) {
  const clean = bgHex.replace("#", "");
  if (clean.length !== 6) return "#111111";
  const channel = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(clean.slice(i, i + 2), 16) / 255));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? "#111111" : "#FFFFFF";
}

export function BannersSection() {
  const query = useApiQuery<Banner[]>(["admin", "banners"], "/admin/banners");
  const [editing, setEditing] = useState<Banner | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  // Switch flips at once; the server confirms in the background and we roll back only on failure.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  // A local working order so a drag reorders instantly; reset (during render, not an effect) whenever the
  // server's own order changes underneath it.
  const [prevData, setPrevData] = useState(query.data);
  const [order, setOrder] = useState(query.data || []);
  if (query.data !== prevData) {
    setPrevData(query.data);
    setOrder(query.data || []);
  }
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const banners = order.map((banner) => (banner.id in optimistic ? { ...banner, isActive: optimistic[banner.id] } : banner));
  const previewColors = resolveColors(form);

  function handleDrop(targetId: string) {
    const draggedId = draggingId;
    setDraggingId(null);
    if (!draggedId || draggedId === targetId) return;
    const from = order.findIndex((banner) => banner.id === draggedId);
    const to = order.findIndex((banner) => banner.id === targetId);
    if (from === -1 || to === -1) return;
    const previous = order;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    void (async () => {
      try {
        await apiPatch("/admin/banners/reorder", { ids: next.map((banner) => banner.id) });
        await query.refetch();
        toast.success("Order updated");
      } catch (error) {
        setOrder(previous);
        toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not save the new order");
      }
    })();
  }

  function open(banner: Banner | "new") {
    setForm(banner === "new" ? EMPTY : { text: banner.text, imageUrl: banner.imageUrl || "", placement: banner.placement, tone: banner.tone, colorBg: banner.colorBg || "", colorFg: banner.colorFg || "", linkType: banner.linkType, linkTarget: banner.linkTarget, isActive: banner.isActive, sortOrder: banner.sortOrder, startsAt: toLocal(banner.startsAt), endsAt: toLocal(banner.endsAt) });
    setEditing(banner);
  }

  function pickPreset(tone: string) {
    // A preset clears any custom colour, so the banner goes back to following that tone (and any future tone tweak).
    setForm((current) => ({ ...current, tone, colorBg: "", colorFg: "" }));
  }

  function pickCustomColor(bg: string) {
    setForm((current) => ({ ...current, colorBg: bg, colorFg: readableTextColor(bg) }));
  }

  async function save() {
    if (form.text.trim().length < 3) return toast.error("Write the banner message");
    setSaving(true);
    try {
      const body = { ...form, text: form.text.trim(), colorBg: form.colorBg || null, colorFg: form.colorFg || null, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null };
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
      toast.success(isActive ? "Banner enabled" : "Banner disabled");
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
      <CardContent className="p-0">
        {banners.length === 0 ? <p className="p-8 text-center text-sm text-zinc-500">No banners yet. Add one to promote a sale, a delivery update or a new category.</p> : null}
        {banners.length > 1 ? <p className="border-b bg-zinc-50 px-5 py-2 text-[11px] text-zinc-500 sm:px-6">Drag ⠿ to change the order they scroll in.</p> : null}
        <div className="divide-y divide-zinc-100">
          {banners.map((banner) => {
            const colors = resolveColors(banner);
            return (
              <div
                key={banner.id}
                className={cn("flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6", draggingId && draggingId !== banner.id ? "border-t-2 border-t-brand-gold" : "")}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(banner.id)}
              >
                <span
                  draggable
                  onDragStart={() => setDraggingId(banner.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className="hidden shrink-0 cursor-grab items-center justify-center p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing sm:flex"
                  aria-label={`Drag to reorder "${banner.text}"`}
                >
                  <GripVertical size={16} />
                </span>
                {/* Just the pill, no card border around it — matches how it actually renders in the app. */}
                <div style={{ backgroundColor: colors.bg, color: colors.fg }} className={cn("flex min-w-0 flex-1 items-center gap-2.5  py-1 pr-4 text-sm font-bold", banner.imageUrl ? "pl-1" : "pl-4")}>{banner.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={banner.imageUrl} alt="" className="size-8 shrink-0  object-cover" /> : null}<span className="truncate">{banner.text}</span></div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className=" bg-zinc-100 px-2 py-0.5 capitalize">{banner.placement}</span>
                  {banner.endsAt ? <span>Ends {new Date(banner.endsAt).toLocaleDateString()}</span> : <span>No end date</span>}
                  <Switch checked={banner.isActive} onCheckedChange={(value) => void toggle(banner, value)} aria-label="Banner active" />
                  <Button variant="ghost" size="icon-sm" onClick={() => open(banner)} aria-label="Edit banner"><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => void remove(banner)} aria-label="Delete banner"><Trash2 size={14} className="text-red-500" /></Button>
                </div>
              </div>
            );
          })}
        </div>
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
                <div style={{ backgroundColor: previewColors.bg, color: previewColors.fg }} className={cn("inline-flex max-w-full items-center gap-2.5  py-1 pr-4 text-sm font-bold", form.imageUrl ? "pl-1" : "pl-4")}>
                  {form.imageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={form.imageUrl} alt="" className="size-8 shrink-0  object-cover" /> : null}
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
            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(TONE_HEX) as Array<keyof typeof TONE_HEX>).map((tone) => {
                  const selected = !form.colorBg && form.tone === tone;
                  return (
                    <button
                      key={tone}
                      type="button"
                      title={tone}
                      aria-label={`Use the ${tone} preset`}
                      aria-pressed={selected}
                      onClick={() => pickPreset(tone)}
                      style={{ backgroundColor: TONE_HEX[tone].bg }}
                      className={cn("size-8  border-2 transition", selected ? "border-zinc-900" : "border-transparent hover:border-zinc-300")}
                    />
                  );
                })}
                <span className="mx-1 h-6 w-px bg-zinc-200" />
                <div className="flex items-center gap-1.5">
                  <Input
                    type="color"
                    aria-label="Choose a custom banner colour"
                    value={form.colorBg || previewColors.bg}
                    onChange={(event) => pickCustomColor(event.target.value.toUpperCase())}
                    className="h-8 w-10 cursor-pointer p-1"
                  />
                  <Input
                    value={form.colorBg}
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase();
                      setForm((current) => ({ ...current, colorBg: value, colorFg: /^#[0-9A-F]{6}$/.test(value) ? readableTextColor(value) : current.colorFg }));
                    }}
                    placeholder="Custom hex, e.g. #FF8A62"
                    className="h-8 w-40 font-mono text-xs"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400">Pick a preset, or choose any colour — the text colour is set automatically to stay readable.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Where</Label>
                <Select value={form.placement} onValueChange={(value) => setForm({ ...form, placement: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="home">Home</SelectItem><SelectItem value="category">Category pages</SelectItem><SelectItem value="all">Everywhere</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Starts</Label><Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div>
              <div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></div>
              <div className="space-y-2"><Label>Tap opens</Label>
                <Select value={form.linkType} onValueChange={(value) => setForm({ ...form, linkType: value })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Nothing</SelectItem><SelectItem value="category">A category</SelectItem><SelectItem value="product">A product</SelectItem><SelectItem value="market">A market</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Target ID</Label><Input disabled={form.linkType === "none"} value={form.linkTarget} onChange={(event) => setForm({ ...form, linkTarget: event.target.value })} placeholder="e.g. CAT-2026-000010" /></div>
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
