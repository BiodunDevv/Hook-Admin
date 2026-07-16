"use client";

import { useState } from "react";
import { Store, Zap, Boxes, AlertTriangle, Plus, Search, ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { HookLoader } from "@/components/shared/HookLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BoothCard, type BoothRow } from "@/components/booths/BoothCard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useApiQuery } from "@/lib/query";
import { apiPost, apiRequest } from "@/lib/api";
import { StateDropdown } from "@/components/operations/StateDropdown";
import { queryString, useUrlFilters } from "@/lib/admin-utils";

interface Page<T> { data: T[]; total: number; }

interface BoothAnalytics {
  total: number;
  active: number;
  inactive: number;
  withAgent: number;
  phygital: number;
  microHub: number;
}

interface AgentOption {
  id: string;
  assignedMarket: string;
  agent?: { firstName?: string; lastName?: string; email?: string };
}

function agentLabel(agent: AgentOption) {
  const name = `${agent.agent?.firstName || ""} ${agent.agent?.lastName || ""}`.trim() || agent.agent?.email || "Agent";
  return `${name} — ${agent.assignedMarket}`;
}

// ─── Provision Booth dialog ──────────────────────────────────────────────────

function ProvisionBoothDialog({
  open,
  onClose,
  onSuccess,
  agents,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agents: AgentOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [boothType, setBoothType] = useState<"phygital" | "micro_hub">("phygital");
  const [agentId, setAgentId] = useState<string>("none");
  const [attendantMode, setAttendantMode] = useState<"existing" | "new">("existing");
  const [stateCode, setStateCode] = useState("LA");

  async function uploadImage(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("images", files[0]);
    setUploading(true);
    try {
      const uploaded = await apiRequest<Array<{ url: string; secureUrl?: string }>>("/upload/images", {
        method: "POST",
        body: formData,
      });
      const url = uploaded[0]?.secureUrl || uploaded[0]?.url;
      if (!url) throw new Error("Upload did not return an image URL");
      setImageUrl(url);
      toast.success("Booth image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const address = String(form.get("address") || "").trim();
    const description = String(form.get("description") || "").trim();
    const lat = Number(form.get("lat") || 0);
    const lng = Number(form.get("lng") || 0);

    if (name.length < 2) {
      toast.error("Booth name must be at least 2 characters");
      return;
    }
    if (!address) {
      toast.error("Address is required");
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      description: description || undefined,
      boothType,
      location: { address, lat, lng, stateCode },
      previewImageUrl: imageUrl || undefined,
      isActive: true,
    };
    if (attendantMode === "existing" && agentId !== "none") payload.fieldAgentId = agentId;
    if (attendantMode === "new") payload.newAttendant = {
      firstName: String(form.get("attendantFirstName") || "").trim(),
      lastName: String(form.get("attendantLastName") || "").trim(),
      email: String(form.get("attendantEmail") || "").trim(),
      phone: String(form.get("attendantPhone") || "").trim(),
    };

    setLoading(true);
    try {
      await apiPost("/admin/booths", payload);
      toast.success(`Booth "${name}" provisioned`);
      setImageUrl("");
      setAgentId("none");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed to provision booth");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provision New Booth</DialogTitle>
          <DialogDescription>
            Register a new company-owned physical booth location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="booth-name">Booth Name *</Label>
            <Input id="booth-name" name="name" placeholder="e.g. Surulere Micro Hub" required minLength={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="booth-description">Description</Label>
            <Input id="booth-description" name="description" placeholder="What this booth is for" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Booth Type *</Label>
              <Select value={boothType} onValueChange={(v) => setBoothType(v as "phygital" | "micro_hub")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phygital">Phygital — walk-in experience</SelectItem>
                  <SelectItem value="micro_hub">Micro Hub — pickup & dispatch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Attendant</Label>
              <Select value={attendantMode} onValueChange={(value) => setAttendantMode(value as "existing" | "new")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Choose existing</SelectItem>
                  <SelectItem value="new">Add new attendant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {attendantMode === "existing" ? (
            <div className="space-y-1.5">
              <Label>Existing attendant</Label>
              <Select value={agentId} onValueChange={setAgentId}><SelectTrigger className="w-full"><SelectValue placeholder="Assign an attendant" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agentLabel(agent)}</SelectItem>)}</SelectContent></Select>
            </div>
          ) : (
            <div className="rounded-lg border bg-zinc-50 p-3">
              <p className="mb-3 text-sm font-medium">New attendant profile</p>
              <div className="grid grid-cols-2 gap-3"><Input name="attendantFirstName" placeholder="First name" required /><Input name="attendantLastName" placeholder="Last name" required /></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input name="attendantEmail" type="email" placeholder="Email address" required /><Input name="attendantPhone" type="tel" placeholder="Phone number" required /></div>
              <p className="mt-2 text-xs text-muted-foreground">A field-agent account is created and assigned immediately.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="booth-address">Address *</Label>
            <Input id="booth-address" name="address" placeholder="Street, area, city" required />
          </div>

          <div className="space-y-1.5">
            <Label>Operating state</Label>
            <StateDropdown mode="form" value={stateCode} onChange={setStateCode} className="h-9 w-full justify-between gap-2 text-zinc-700" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="booth-lat">Latitude</Label>
              <Input id="booth-lat" name="lat" type="number" step="any" placeholder="6.4541" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="booth-lng">Longitude</Label>
              <Input id="booth-lng" name="lng" type="number" step="any" placeholder="3.3894" />
            </div>
          </div>

          {/* Booth image */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <ImagePlus size={14} /> Booth Image
            </Label>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-zinc-50 p-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Booth" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-white/95 text-zinc-600 shadow-sm"
                      aria-label="Remove image"
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : (
                  <div className="flex size-full items-center justify-center text-zinc-300">
                    <Store size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="booth-image-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadImage(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("booth-image-file")?.click()}
                  >
                    {uploading ? <HookLoader size="button" label="Uploading..." /> : <><Upload size={13} /> Upload</>}
                  </Button>
                  <span className="text-xs text-zinc-400">or paste a link</span>
                </div>
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? <HookLoader size="button" label="Provisioning..." /> : "Provision Booth"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function BoothsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filters = useUrlFilters({ stateCode: "all" });
  const stateCode = filters.get("stateCode") || "all";

  const booths = useApiQuery<Page<BoothRow>>(["admin", "booths", stateCode], `/admin/booths${queryString({ limit: 50, stateCode })}`);
  const analytics = useApiQuery<BoothAnalytics>(["admin", "booths", "analytics"], "/admin/booths/analytics");
  const agents = useApiQuery<Page<AgentOption>>(["admin", "field-agents"], "/admin/field-agents?limit=50");

  const rows = (booths.data?.data ?? []).filter((booth) =>
    !search || [booth.name, booth.location?.address, booth.boothType].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );

  function refreshAll() {
    booths.refetch();
    analytics.refetch();
  }

  return (
    <div className="p-2 sm:p-4">
      <PageHeader
        title="Physical Booths"
        description="Company-owned walk-in booths and micro hubs across Lagos."
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search booths..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-48 pl-8 lg:w-64"
              />
            </div>
            <StateDropdown value={stateCode} onChange={(value) => filters.set({ stateCode: value })} />
            <PermissionGuard permission="booths.edit">
              <Button variant="brand" size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus size={15} /> Provision New Booth
              </Button>
            </PermissionGuard>
          </>
        }
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Store} tone="green" label="Active Booths" value={analytics.data?.active ?? 0} caption="Live locations" />
        <KpiCard icon={Zap} tone="amber" label="Phygital" value={analytics.data?.phygital ?? 0} caption="Walk-in experience" />
        <KpiCard icon={Boxes} tone="blue" label="Micro Hubs" value={analytics.data?.microHub ?? 0} caption="Pickup & dispatch" />
        <KpiCard icon={AlertTriangle} tone="red" label="Offline" value={analytics.data?.inactive ?? 0} caption="Not operating" />
      </div>

      {/* Booth grid */}
      {booths.isLoading && (
        <div className="flex items-center justify-center py-16">
          <HookLoader size="page" label="Loading booths..." />
        </div>
      )}

      {!booths.isLoading && rows.length === 0 && (
        <EmptyState
          icon={Store}
          title={search ? "No matching booths" : "No booths provisioned yet"}
          description={search ? `No booths match "${search}".` : "Provision your first physical booth to get started."}
        />
      )}

      {!booths.isLoading && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((booth) => (
            <BoothCard key={booth.id} booth={booth} onRefresh={refreshAll} />
          ))}
        </div>
      )}

      <ProvisionBoothDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refreshAll}
        agents={agents.data?.data ?? []}
      />
    </div>
  );
}
