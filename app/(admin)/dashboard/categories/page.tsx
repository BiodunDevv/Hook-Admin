"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tags,
  Plus,
  Search,
  Package,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  Phone,
  CheckCircle2,
  Check,
  UserX,
  Upload,
  X,
  ImagePlus,
  Ruler,
  ChevronDown,
  ChevronRight,
  FolderTree,
  CornerDownRight,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  SIZING_PRESET_GROUP_LABELS,
  type SizingGuide,
  type SizingPresetGroup,
} from "@/lib/sizing-guide";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { HookLoader } from "@/components/shared/HookLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useApiQuery, useAdminSession } from "@/lib/query";
import { apiPost, apiPatch, apiRequest } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { toast } from "sonner";
import Link from "next/link";
import { CategoryAttributeEditor } from "@/components/categories/CategoryAttributeEditor";
import { attributeSummary, type CategoryAttribute } from "@/lib/category-attributes";

interface CategoryManager {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  role: "support" | "admin";
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  productCount: number;
  managers: CategoryManager[];
  parentId?: string | null;
  parentName?: string | null;
  level?: number;
  childCount?: number;
  attributes?: CategoryAttribute[];
  inheritsAttributes?: boolean;
  hasSizingGuide: boolean;
  attributeSchema?: { sizingGuide?: SizingGuide | null };
}

interface CategoriesResponse {
  data: CategoryRow[];
  total: number;
}

function managerName(manager: CategoryManager) {
  return `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || manager.email;
}

function managerInitials(manager: CategoryManager) {
  const name = managerName(manager);
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
}

const ATTRIBUTE_TEMPLATES: Array<{ name: string; attributes: CategoryAttribute[] }> = [
  { name: "Shoes", attributes: [{ key: "size", label: "Size", type: "size", required: true, preset: "shoes", variantAxis: true }, { key: "colour", label: "Colour", type: "colour", required: true, variantAxis: true }] },
  { name: "Clothing", attributes: [{ key: "size", label: "Size", type: "size", required: true, preset: "clothing", variantAxis: true }, { key: "colour", label: "Colour", type: "colour", required: true, variantAxis: true }] },
  { name: "Phone case", attributes: [{ key: "phoneModel", label: "Phone model", type: "text", required: true, variantAxis: true }, { key: "colour", label: "Colour", type: "colour", required: false, variantAxis: true }] },
  { name: "Powerbank", attributes: [{ key: "capacity", label: "Capacity", type: "select", required: true, options: ["10,000mAh", "20,000mAh", "30,000mAh"], variantAxis: true }, { key: "colour", label: "Colour", type: "colour", required: false, variantAxis: true }] },
  { name: "Wig", attributes: [{ key: "length", label: "Length", type: "select", required: true, options: ['10"', '12"', '14"', '16"', '18"', '20"', '22"'], variantAxis: true }, { key: "texture", label: "Texture", type: "select", required: true, options: ["Straight", "Body wave", "Deep wave", "Curly"], variantAxis: true }, { key: "colour", label: "Colour", type: "colour", required: false, variantAxis: true }] },
  { name: "Fabric", attributes: [{ key: "length", label: "Length", type: "select", required: true, options: ["2 yards", "4 yards", "6 yards"], variantAxis: true }, { key: "colour", label: "Colour", type: "colour", required: false, variantAxis: true }] },
];

// ─── Create / Edit sheet ─────────────────────────────────────────────────────

function CategoryDialog({
  category,
  parent,
  topLevel = [],
  open,
  onClose,
  onSuccess,
}: {
  category?: CategoryRow;
  /** When set, a new category is created as a sub-category of this one. */
  parent?: CategoryRow;
  /** Top-level categories a sub-category can be moved to. */
  topLevel?: CategoryRow[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [iconUrl, setIconUrl] = useState(category?.iconUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileInputId = `category-icon-${useId().replace(/:/g, "")}`;
  const isEdit = Boolean(category);
  const [parentId, setParentId] = useState<string>(category?.parentId || parent?.id || "none");
  const [attributes, setAttributes] = useState<CategoryAttribute[]>(category?.attributes || []);
  const isSub = parentId !== "none";
  const [tab, setTab] = useState<"basics" | "details" | "sizing" | "managers">("basics");
  // Who is in charge: loaded when the sheet opens for an existing category, saved with the rest.
  const managerOptions = useApiQuery<Array<CategoryManager & { assigned: boolean }>>(["admin", "category-manager-options", category?.id], `/admin/categories/${category?.id}/manager-options`, open && isEdit);
  const [managerIds, setManagerIds] = useState<string[] | null>(null);
  const [managerSearch, setManagerSearch] = useState("");
  const staff = managerOptions.data || [];
  const selectedManagers = managerIds ?? staff.filter((person) => person.assigned).map((person) => person.id);
  const toggleManager = (id: string) => setManagerIds(selectedManagers.includes(id) ? selectedManagers.filter((item) => item !== id) : [...selectedManagers, id]);
  const parentName = parent?.name || topLevel.find((item) => item.id === parentId)?.name;

  const existingGuide = category?.attributeSchema?.sizingGuide;
  const [sizingEnabled, setSizingEnabled] = useState(existingGuide?.enabled !== false);
  const [sizingSummary, setSizingSummary] = useState(existingGuide?.summary || "");
  const [sizingHowToMeasure, setSizingHowToMeasure] = useState(existingGuide?.howToMeasure || "");
  const [sizingPresetGroups, setSizingPresetGroups] = useState<SizingPresetGroup[]>(existingGuide?.presetGroups || []);
  // Measurements follow what is being sized: feet for shoes, band and bust for bras, the body for clothes.
  const scales = new Set<string>([...sizingPresetGroups, ...attributes.filter((item) => item.type === "size").map((item) => item.preset || "clothing")]);
  const chartColumns: string[] = scales.has("clothing") || scales.has("general") || !scales.size
    ? ["Chest", "Waist", "Hip"]
    : scales.has("bra") ? ["Band", "Bust"] : ["Foot length (cm)"];
  const [sizingChart, setSizingChart] = useState<Array<{ size: string; measurements: Record<string, string> }>>(existingGuide?.chart || []);

  function togglePresetGroup(group: SizingPresetGroup) {
    setSizingPresetGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    );
  }

  function addChartRow() {
    setSizingChart((current) => [...current, { size: "", measurements: {} }]);
  }

  function removeChartRow(index: number) {
    setSizingChart((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateChartRowSize(index: number, size: string) {
    setSizingChart((current) => current.map((row, itemIndex) => (itemIndex === index ? { ...row, size } : row)));
  }

  function updateChartRowMeasurement(index: number, label: string, value: string) {
    setSizingChart((current) =>
      current.map((row, itemIndex) =>
        itemIndex === index ? { ...row, measurements: { ...row.measurements, [label]: value } } : row,
      ),
    );
  }

  async function uploadIcon(files: FileList | null) {
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
      setIconUrl(url);
      toast.success("Category image uploaded");
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
    const description = String(form.get("description") || "").trim();
    const sortOrder = Number(form.get("sortOrder") || 0);
    const icon = iconUrl.trim();

    if (name.length < 2 || name.length > 60) {
      toast.error("Name must be between 2 and 60 characters");
      return;
    }
    if (description.length > 300) {
      toast.error("Description must be 300 characters or less");
      return;
    }
    if (icon && !/^https?:\/\//.test(icon)) {
      toast.error("Image URL must be a valid http(s) URL");
      return;
    }

    const summary = sizingSummary.trim();
    const howToMeasure = sizingHowToMeasure.trim();
    const chart = sizingChart
      .filter((row) => row.size.trim())
      .map((row) => ({
        size: row.size.trim(),
        measurements: Object.fromEntries(
          Object.entries(row.measurements).filter(([, value]) => value.trim()),
        ),
      }));
    const hasSizingGuide = Boolean(summary || howToMeasure || sizingPresetGroups.length || chart.length);

    const payload: Record<string, unknown> = { name, sortOrder, attributes };
    if (isEdit ? parentId !== (category?.parentId || "none") && parentId !== "none" : isSub) payload.parentId = parentId;
    if (description) payload.description = description;
    if (icon) payload.iconUrl = icon;
    if (hasSizingGuide || existingGuide) {
      payload.sizingGuide = {
        enabled: sizingEnabled,
        ...(summary ? { summary } : {}),
        ...(howToMeasure ? { howToMeasure } : {}),
        presetGroups: sizingPresetGroups,
        ...(chart.length ? { chart } : {}),
      };
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiPatch(`/admin/categories/${category!.id}`, payload);
        if (managerIds) await apiRequest(`/admin/categories/${category!.id}/managers`, { method: "PUT", body: JSON.stringify({ userIds: managerIds }) });
        toast.success(`"${name}" updated`);
      } else {
        await apiPost("/admin/categories", payload);
        toast.success(`Category "${name}" created`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed to save category");
    } finally {
      setLoading(false);
    }
  }

  const close = () => {
    if (!loading && !uploading) onClose();
  };

  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={isEdit ? (category?.parentId ? "Edit sub-category" : "Edit category") : isSub ? "Add sub-category" : "Create category"}
      description={isEdit
        ? `Update "${category!.name}". Changes apply across the catalog.`
        : isSub ? `Products can be filed under this sub-category of ${parentName}.` : "Create a top-level category for the Hook catalog."}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={close} disabled={loading || uploading}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" variant="brand" disabled={loading || uploading}>
            {loading
              ? <HookLoader size="button" label={isEdit ? "Saving..." : "Creating..."} />
              : isEdit ? "Save changes" : "Create category"}
          </Button>
        </>
      )}
    >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
          <div role="tablist" className={`grid gap-1 rounded-lg bg-zinc-100 p-1 ${isEdit ? "grid-cols-4" : "grid-cols-3"}`}>
            {([
              ["basics", "Basics", ""],
              ["details", "Details", attributes.length ? String(attributes.length) : isSub ? "inherits" : ""],
              ["sizing", "Sizing guide", sizingEnabled && (sizingSummary || sizingChart.length || sizingPresetGroups.length) ? "on" : ""],
              ...(isEdit ? [["managers", "In charge", selectedManagers.length ? String(selectedManagers.length) : ""] as const] : []),
            ] as const).map(([key, label, badge]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${tab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}>
                {label}
                {badge ? <span className="rounded-full bg-zinc-200 px-1.5 text-[10px] text-zinc-600">{badge}</span> : null}
              </button>
            ))}
          </div>

          <div className={tab === "basics" ? "space-y-5" : "hidden"}>
          <div><h3 className="text-sm font-semibold text-zinc-900">Basics</h3><p className="text-xs text-zinc-500">The name and picture customers see in the app.</p></div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              placeholder={isSub ? "e.g. Sneakers male" : "e.g. Shoes"}
              required
              minLength={2}
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={category?.description}
              placeholder="Short description of what belongs here"
              maxLength={300}
            />
          </div>

          {(topLevel.length > 0 || isSub) && !(isEdit && (category?.childCount || 0) > 0) ? (
            <div className="space-y-1.5">
              <Label>Parent category</Label>
              <Select value={parentId} onValueChange={setParentId} disabled={Boolean(parent) || (isEdit && !category?.parentId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level category)</SelectItem>
                  {topLevel.filter((item) => item.id !== category?.id).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-400">
                Products are filed under sub-categories. A category with no sub-categories (like Wigs) holds products itself.
              </p>
            </div>
          ) : null}

          {/* Category image — upload or paste a link */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <ImagePlus size={14} /> Category Image
            </Label>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-zinc-50 p-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                {iconUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconUrl} alt="Category" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setIconUrl("")}
                      className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-white/95 text-zinc-600 shadow-sm"
                      aria-label="Remove image"
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : (
                  <div className="flex size-full items-center justify-center text-zinc-300">
                    <Tags size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadIcon(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById(fileInputId)?.click()}
                  >
                    {uploading ? <HookLoader size="button" label="Uploading..." /> : <><Upload size={13} /> Upload</>}
                  </Button>
                  <span className="text-xs text-zinc-400">or paste a link</span>
                </div>
                <Input
                  type="url"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-400">Shown on the category card and anywhere the category is featured.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={category?.sortOrder ?? 0}
              className="w-32"
            />
          </div>
          </div>

          <div className={tab === "details" ? "space-y-4" : "hidden"}>
            <div><h3 className="text-sm font-semibold text-zinc-900">Product details</h3><p className="text-xs text-zinc-500">The questions a Market Associate answers when adding a product here (size, colour, capacity…).</p></div>
            {isSub && !attributes.length ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                This sub-category has no details of its own, so it uses {parentName || "its parent"}&apos;s. Add details below only if it needs different ones.
              </div>
            ) : null}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-600">Quick start: fill in the usual questions for…</p>
              <div className="flex flex-wrap gap-1.5">
                {ATTRIBUTE_TEMPLATES.map((template) => (
                  <button key={template.name} type="button" onClick={() => { if (!attributes.length || confirm(`Replace the current details with the ${template.name} template?`)) setAttributes(template.attributes); }} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 hover:border-zinc-900">{template.name}</button>
                ))}
              </div>
            </div>
          <CategoryAttributeEditor
            attributes={attributes}
            onChange={setAttributes}
            inheritedNote={isSub ? `Leave empty to use ${parentName || "the parent"}'s details.` : undefined}
          />

          </div>

          <div className={tab === "sizing" ? "space-y-3" : "hidden"}>
            <div><h3 className="text-sm font-semibold text-zinc-900">Sizing guide</h3><p className="text-xs text-zinc-500">Helps Market Associates and customers pick the right size.</p></div>
          <div className="space-y-3 rounded-xl border border-border bg-zinc-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <Ruler size={14} className="text-zinc-500" />
                <Label>Sizing guide</Label>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                {sizingEnabled ? "Shown" : "Hidden"}
                <Switch checked={sizingEnabled} onCheckedChange={setSizingEnabled} aria-label="Show the sizing guide" />
              </label>
            </div>
            <p className="text-xs leading-5 text-zinc-400">
              {sizingEnabled
                ? "Shown to Market Associates and Partners while they capture or browse products here, and to customers on the product page. Sub-categories without their own guide use this one."
                : "Hidden everywhere. Your guide is kept, so switching it back on restores it."}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="sizingSummary" className="text-xs font-medium text-zinc-600">Summary</Label>
              <Input
                id="sizingSummary"
                value={sizingSummary}
                onChange={(e) => setSizingSummary(e.target.value)}
                placeholder="e.g. Sizes follow standard Nigerian clothing sizing"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sizingHowToMeasure" className="text-xs font-medium text-zinc-600">How to measure</Label>
              <Textarea
                id="sizingHowToMeasure"
                value={sizingHowToMeasure}
                onChange={(e) => setSizingHowToMeasure(e.target.value)}
                placeholder="Explain how a customer or Market Associate should take measurements for this category."
                maxLength={2000}
                className="min-h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-600">Applies to</Label>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(SIZING_PRESET_GROUP_LABELS) as SizingPresetGroup[]).map((group) => (
                  <label key={group} className="flex items-center gap-1.5 text-sm text-zinc-700">
                    <Checkbox
                      checked={sizingPresetGroups.includes(group)}
                      onCheckedChange={() => togglePresetGroup(group)}
                    />
                    {SIZING_PRESET_GROUP_LABELS[group]}
                  </label>
                ))}
              </div>
              <p className="text-xs text-zinc-400">
                Narrows the size options Market Associates see when capturing products in this category.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-zinc-600">Measurement chart (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChartRow}>
                  <Plus size={13} /> Add row
                </Button>
              </div>
              {sizingChart.length ? (
                <div className="space-y-2">
                  {sizingChart.map((row, index) => (
                    <div key={index} style={{ gridTemplateColumns: `80px repeat(${chartColumns.length}, minmax(0, 1fr)) auto` }} className="grid gap-1.5 rounded-md border border-border bg-white p-2">
                      <Input
                        value={row.size}
                        onChange={(e) => updateChartRowSize(index, e.target.value)}
                        placeholder="Size"
                        className="h-8 text-xs"
                      />
                      {chartColumns.map((label) => (
                        <Input
                          key={label}
                          value={row.measurements[label] || ""}
                          onChange={(e) => updateChartRowMeasurement(index, label, e.target.value)}
                          placeholder={label}
                          className="h-8 text-xs"
                        />
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeChartRow(index)}
                        aria-label="Remove row"
                      >
                        <X size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400">No measurement rows added yet.</p>
              )}
            </div>
          </div>
          </div>

          {isEdit ? (
            <div className={tab === "managers" ? "space-y-3" : "hidden"}>
              <div><h3 className="text-sm font-semibold text-zinc-900">In charge</h3><p className="text-xs text-zinc-500">Staff who look after this category. They see it in their work and get its updates.</p></div>
              <Input value={managerSearch} onChange={(event) => setManagerSearch(event.target.value)} placeholder="Search staff by name or email" />
              {managerOptions.isLoading ? (
                <div className="grid min-h-32 place-items-center"><HookLoader label="Loading staff" /></div>
              ) : managerOptions.isError ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-zinc-500">Staff could not load. Close and reopen this sheet to try again.</p>
              ) : (
                <ul className="divide-y rounded-xl border bg-white">
                  {staff.filter((person) => `${managerName(person)} ${person.email}`.toLowerCase().includes(managerSearch.trim().toLowerCase())).map((person) => {
                    const on = selectedManagers.includes(person.id);
                    return (
                      <li key={person.id}>
                        <button type="button" onClick={() => toggleManager(person.id)} aria-pressed={on} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">{managerInitials(person)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-zinc-900">{managerName(person)}</span>
                            <span className="block truncate text-xs text-zinc-500">{person.email}</span>
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${person.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{person.role}</span>
                          <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300"}`}>{on ? <Check size={13} /> : null}</span>
                        </button>
                      </li>
                    );
                  })}
                  {!staff.length ? <li className="p-4 text-center text-sm text-zinc-500">No support or admin staff to assign yet.</li> : null}
                </ul>
              )}
              <p className="text-xs text-zinc-500">{selectedManagers.length ? `${selectedManagers.length} selected.` : "Nobody is in charge yet."} Applied when you save.</p>
            </div>
          ) : null}
        </form>
    </AdminWorkflowSheet>
  );
}

// ─── Sub-category row ────────────────────────────────────────────────────────

function SubCategoryRow({
  category,
  onEdit,
  onRefresh,
  canManage,
}: {
  category: CategoryRow;
  onEdit: () => void;
  onRefresh: () => void;
  canManage: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const canDelete = category.productCount === 0;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50">
      <CornerDownRight size={13} className="shrink-0 text-zinc-300" />
      <span className={`size-1.5 shrink-0 rounded-full ${category.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{category.name}</p>
        <p className="truncate text-[11px] text-zinc-400">
          {category.inheritsAttributes ? "Uses parent's details" : attributeSummary(category.attributes || []) || "No details"}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
        {category.productCount}
      </span>
      {canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="shrink-0 text-zinc-400" disabled={busy}><MoreHorizontal size={15} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit}><Pencil size={14} /> Edit</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => run(() => apiPatch(`/admin/categories/${category.id}/toggle`), category.isActive ? "Deactivated" : "Activated")}
            >
              <Power size={14} /> {category.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!canDelete}
              className="text-destructive focus:text-destructive"
              onClick={canDelete ? () => {
                if (confirm(`Delete "${category.name}"? This cannot be undone.`)) void run(() => apiRequest(`/admin/categories/${category.id}`, { method: "DELETE" }), "Deleted");
              } : undefined}
            >
              <Trash2 size={14} /> {canDelete ? "Delete" : "Delete (has products)"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

// ─── Category card ───────────────────────────────────────────────────────────

function CategoryCard({
  category,
  subs,
  onEdit,
  onAddSub,
  onEditSub,
  onRefresh,
  canManage,
}: {
  category: CategoryRow;
  subs: CategoryRow[];
  onEdit: () => void;
  onAddSub: () => void;
  onEditSub: (sub: CategoryRow) => void;
  onRefresh: () => void;
  canManage: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(true);
  const canDelete = category.productCount === 0 && subs.length === 0;

  async function handleToggle() {
    setBusy(true);
    try {
      await apiPatch(`/admin/categories/${category.id}/toggle`);
      toast.success(category.isActive ? `"${category.name}" deactivated` : `"${category.name}" activated`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/categories/${category.id}`, { method: "DELETE" });
      toast.success(`"${category.name}" deleted`);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-xl py-0 shadow-none transition-shadow hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {category.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.iconUrl}
                alt={category.name}
                className="size-10 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-brand-gold">
                <Tags size={18} />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-zinc-900">{category.name}</p>
                <span className={`size-2 shrink-0 rounded-full ${category.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
              </div>
              <p className="truncate text-xs text-zinc-400">/{category.slug}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 text-zinc-400" disabled={busy}>
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canManage ? <>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil size={14} />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddSub}>
                  <FolderTree size={14} />
                  Add sub-category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggle} disabled={busy}>
                  <Power size={14} />
                  {category.isActive ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={canDelete ? handleDelete : undefined}
                  disabled={!canDelete || busy}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} />
                  {canDelete ? "Delete" : subs.length ? "Delete (has sub-categories)" : "Delete (has products)"}
                </DropdownMenuItem>
              </> : <DropdownMenuItem disabled>View-only access</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {category.description && (
          <p className="mt-2.5 line-clamp-2 text-xs text-zinc-500">{category.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
            <Package size={11} />
            {category.productCount} product{category.productCount === 1 ? "" : "s"}
          </span>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              category.hasSizingGuide ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"
            }`}
          >
            <Ruler size={11} />
            {category.hasSizingGuide ? "Sizing guide added" : "No sizing guide"}
          </span>
          <Badge
            variant="outline"
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              category.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-500"
            }`}
          >
            {category.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Product details this category asks for */}
        <p className="mt-2.5 text-xs text-zinc-500">
          <span className="font-medium text-zinc-600">Asks for: </span>
          {category.attributes?.length ? attributeSummary(category.attributes) : subs.length ? "Set per sub-category" : "Nothing set"}
        </p>

        {/* Sub-categories */}
        {subs.length > 0 ? (
          <div className="mt-3 border-t border-dashed border-border pt-2">
            <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center gap-1.5 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Sub-categories ({subs.length})
            </button>
            {open ? (
              <div className="mt-1 space-y-0.5">
                {subs.map((sub) => (
                  <SubCategoryRow key={sub.id} category={sub} onEdit={() => onEditSub(sub)} onRefresh={onRefresh} canManage={canManage} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Managers */}
        <div className="mt-3 border-t border-dashed border-border pt-3">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            In Charge ({category.managers.length})
          </p>
          {category.managers.length === 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-zinc-400">
              <UserX size={12} /> No manager assigned — assign from the Staff page
            </p>
          ) : (
            <div className="space-y-1.5">
              {category.managers.map((manager) => (
                <div key={manager.id} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
                    {managerInitials(manager)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700">
                    {managerName(manager)}
                  </span>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    manager.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                  }`}>
                    {manager.role}
                  </span>
                  {manager.phone && (
                    <a
                      href={`tel:${manager.phone}`}
                      className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900"
                    >
                      <Phone size={10} />
                      {manager.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

// ─── Tree view ───────────────────────────────────────────────────────────────

/** Sends the new order to the backend, and rolls the local optimistic order back if it's refused. */
async function commitReorder(ids: string[], onSettle: () => void, rollback: () => void) {
  try {
    await apiPatch("/admin/categories/reorder", { ids });
    onSettle();
    toast.success("Order updated");
  } catch (err) {
    rollback();
    toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Could not save the new order");
  }
}

function CategoryTree({
  roots,
  subsOf,
  onEdit,
  onAddSub,
  canManage,
  reorderable,
  onReordered,
}: {
  roots: CategoryRow[];
  subsOf: (id: string) => CategoryRow[];
  onEdit: (category: CategoryRow) => void;
  onAddSub: (category: CategoryRow) => void;
  canManage: boolean;
  /** Dragging reorders sortOrder directly; disabled while a search/status filter could hide siblings out of order. */
  reorderable: boolean;
  onReordered: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // A local working copy so a drag reorders instantly; reset whenever the server's own order changes underneath it.
  // Adjusted during render (React's documented pattern for this), not in an effect, so it never lags a frame behind.
  const [prevRoots, setPrevRoots] = useState(roots);
  const [rootOrder, setRootOrder] = useState(roots);
  if (roots !== prevRoots) {
    setPrevRoots(roots);
    setRootOrder(roots);
  }
  const [childOrder, setChildOrder] = useState<Record<string, CategoryRow[]>>({});
  const [dragging, setDragging] = useState<{ scope: string; id: string } | null>(null);
  const toggle = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const rollup = (category: CategoryRow) => category.productCount + subsOf(category.id).reduce((sum, sub) => sum + sub.productCount, 0);
  const childrenOf = (root: CategoryRow) => childOrder[root.id] || subsOf(root.id);

  function reorderWithin<T extends { id: string }>(list: T[], draggedId: string, targetId: string): T[] {
    const from = list.findIndex((item) => item.id === draggedId);
    const to = list.findIndex((item) => item.id === targetId);
    if (from === -1 || to === -1 || from === to) return list;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  function dropOnRoot(targetId: string) {
    if (!dragging || dragging.scope !== "root") return;
    const draggedId = dragging.id;
    setDragging(null);
    if (draggedId === targetId) return;
    const previous = rootOrder;
    const next = reorderWithin(rootOrder, draggedId, targetId);
    setRootOrder(next);
    void commitReorder(next.map((c) => c.id), onReordered, () => setRootOrder(previous));
  }

  function dropOnChild(parentId: string, list: CategoryRow[], targetId: string) {
    if (!dragging || dragging.scope !== parentId) return;
    const draggedId = dragging.id;
    setDragging(null);
    if (draggedId === targetId) return;
    const previous = list;
    const next = reorderWithin(list, draggedId, targetId);
    setChildOrder((current) => ({ ...current, [parentId]: next }));
    void commitReorder(next.map((c) => c.id), onReordered, () => setChildOrder((current) => ({ ...current, [parentId]: previous })));
  }

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-2.5 text-xs text-zinc-500">
        <span>{roots.length} categories · products attach to the last level{reorderable && canManage ? " · drag ⠿ to reorder" : ""}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCollapsed(new Set())}>Expand all</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setCollapsed(new Set(roots.map((root) => root.id)))}>Collapse all</Button>
        </div>
      </div>
      {!reorderable && canManage ? (
        <p className="border-b bg-zinc-50 px-4 py-2 text-[11px] text-zinc-500">Clear the search and status filter to drag categories into a new order.</p>
      ) : null}
      <ul className="divide-y">
        {rootOrder.map((root) => {
          const children = childrenOf(root);
          const isOpen = !collapsed.has(root.id);
          const canDrag = reorderable && canManage;
          return (
            <li
              key={root.id}
              className={`px-2 py-1.5 ${dragging?.scope === "root" && dragging.id !== root.id ? "border-t-2 border-t-brand-gold" : ""}`}
              onDragOver={canDrag ? (e) => e.preventDefault() : undefined}
              onDrop={canDrag ? () => dropOnRoot(root.id) : undefined}
            >
              <div className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-zinc-50">
                {canDrag ? (
                  <span
                    draggable
                    onDragStart={() => setDragging({ scope: "root", id: root.id })}
                    onDragEnd={() => setDragging(null)}
                    className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing"
                    aria-label={`Drag to reorder ${root.name}`}
                  >
                    <GripVertical size={14} />
                  </span>
                ) : null}
                <button type="button" onClick={() => toggle(root.id)} disabled={!children.length} className="flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 disabled:opacity-0" aria-label={isOpen ? "Collapse" : "Expand"}>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-brand-gold"><FolderTree size={15} /></span>
                <button type="button" onClick={() => onEdit(root)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-zinc-900">{root.name}</span>
                    <span className={`size-1.5 rounded-full ${root.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
                  </span>
                  <span className="block truncate text-xs text-zinc-400">{children.length ? `${children.length} sub-categories` : "Leaf category · holds products"}</span>
                </button>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">{rollup(root)} products</span>
                {canManage ? <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onAddSub(root)}><Plus size={12} /> Sub-category</Button> : null}
              </div>
              {isOpen && children.length ? (
                <ul className="relative ml-[22px] border-l border-zinc-200 pl-0">
                  {children.map((child) => (
                    <li
                      key={child.id}
                      className={`relative ${dragging?.scope === root.id && dragging.id !== child.id ? "border-t-2 border-t-brand-gold" : ""}`}
                      onDragOver={canDrag ? (e) => e.preventDefault() : undefined}
                      onDrop={canDrag ? () => dropOnChild(root.id, children, child.id) : undefined}
                    >
                      <span className="absolute left-0 top-1/2 h-px w-4 bg-zinc-200" />
                      <div className="group/child ml-5 flex w-[calc(100%-1.25rem)] items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50">
                        {canDrag ? (
                          <span
                            draggable
                            onDragStart={() => setDragging({ scope: root.id, id: child.id })}
                            onDragEnd={() => setDragging(null)}
                            className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 active:cursor-grabbing"
                            aria-label={`Drag to reorder ${child.name}`}
                          >
                            <GripVertical size={12} />
                          </span>
                        ) : null}
                        <button type="button" onClick={() => onEdit(child)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                          <span className={`size-1.5 shrink-0 rounded-full ${child.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
                          <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">{child.name}</span>
                          <span className="hidden truncate text-xs text-zinc-400 md:block">{child.attributes?.length ? attributeSummary(child.attributes) : "Inherits parent"}</span>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">{child.productCount}</span>
                          <Pencil size={12} className="text-zinc-300 group-hover/child:text-zinc-600" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [addingUnder, setAddingUnder] = useState<CategoryRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"tree" | "cards">("tree");
  const { data: session } = useAdminSession();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useApiQuery<CategoriesResponse>(
    ["admin", "categories"],
    "/admin/categories",
  );
  const needsSubQuery = useApiQuery<{ total?: number; pagination?: { total?: number } }>(
    ["admin", "categories", "needs-sub"],
    "/admin/products?needsRecategorisation=true&limit=1",
  );

  const canView = hasPermission(session, "categories.view");
  const canManage = hasPermission(session, "categories.manage");
  useEffect(() => {
    if (session && !canView) router.replace("/dashboard");
  }, [canView, router, session]);
  if (session && !canView) return null;

  const all = data?.data ?? [];
  const topLevel = all.filter((category) => !category.parentId);
  const subsOf = (id: string) => all.filter((category) => category.parentId === id);
  const matches = (category: CategoryRow) =>
    (statusFilter === "all" || (statusFilter === "active") === category.isActive) &&
    (!search || [category.name, category.slug, category.description].some((v) => v?.toLowerCase().includes(search.toLowerCase())));
  // A parent shows when it matches, or when any of its sub-categories does.
  // Retired categories (hidden from the app, kept for their history) sort last so the live tree reads first.
  const filtered = topLevel
    .filter((category) => matches(category) || subsOf(category.id).some(matches))
    .sort((a, b) => Number(b.isActive) - Number(a.isActive));
  const liveRoots = topLevel.filter((category) => category.isActive);
  const retiredRoots = topLevel.length - liveRoots.length;
  const subCount = all.length - topLevel.length;
  const needsSub = needsSubQuery.data?.total ?? needsSubQuery.data?.pagination?.total ?? 0;

  const productsCategorized = all.reduce((sum, category) => sum + category.productCount, 0);
  const withoutManager = all.filter((category) => category.managers.length === 0).length;

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Categories"
        description="Organization-wide product taxonomy and the staff in charge of each category."
        actions={
          <PermissionGuard permission="categories.manage">
            <Button variant="brand" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus size={15} />
              New Category
            </Button>
          </PermissionGuard>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Tags} tone="amber" label="Categories" value={liveRoots.length} caption={`${subCount} sub-categories${retiredRoots ? ` · ${retiredRoots} retired, hidden from the app` : ""}`} />
        <KpiCard icon={CheckCircle2} tone="green" label="Active" value={all.filter((c) => c.isActive).length} caption="Available for products" />
        <KpiCard icon={Package} tone="blue" label="Products Categorized" value={productsCategorized} caption="Across all categories" />
        <KpiCard icon={UserX} tone={withoutManager > 0 ? "red" : "zinc"} label="Without Manager" value={withoutManager} caption="Need an assignee" />
      </div>

      {needsSub > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {needsSub} product{needsSub === 1 ? "" : "s"} still need a sub-category. They stay live until you move them.</p>
          <Button asChild size="sm" variant="outline"><Link href="/dashboard/categories/recategorise">Move products</Link></Button>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="inline-flex rounded-lg border border-border bg-white p-0.5 sm:ml-auto">
          {(["tree", "cards"] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => setView(mode)} className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${view === mode ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>{mode}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <HookLoader size="page" label="Loading categories..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load categories. Please try again.
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <EmptyState
            icon={Tags}
            title="No categories found"
            description={search ? `No results for "${search}"` : "Create your first category to organize the catalog."}
          />
          {!search && (
            <Button variant="brand" onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus size={15} />
              New Category
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && view === "tree" && (
        <CategoryTree
          roots={filtered}
          subsOf={(id) => subsOf(id).filter((sub) => matches(sub) || filtered.some((root) => root.id === id && matches(root)))}
          onEdit={setEditing}
          onAddSub={setAddingUnder}
          canManage={canManage}
          reorderable={!search && statusFilter === "all"}
          onReordered={() => void refetch()}
        />
      )}

      {!isLoading && !error && filtered.length > 0 && view === "cards" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              subs={subsOf(category.id).filter((sub) => matches(category) || matches(sub))}
              onEdit={() => setEditing(category)}
              onAddSub={() => setAddingUnder(category)}
              onEditSub={setEditing}
              onRefresh={refetch}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <CategoryDialog
          open
          topLevel={topLevel}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {addingUnder && (
        <CategoryDialog
          open
          parent={addingUnder}
          topLevel={topLevel}
          onClose={() => setAddingUnder(null)}
          onSuccess={() => refetch()}
        />
      )}

      {editing && (
        <CategoryDialog
          key={editing.id}
          category={editing}
          topLevel={topLevel}
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
