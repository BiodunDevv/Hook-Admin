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
  UserX,
  Upload,
  X,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { isSuperAdmin } from "@/lib/permissions";
import { toast } from "sonner";

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

// ─── Create / Edit dialog ────────────────────────────────────────────────────

function CategoryDialog({
  category,
  open,
  onClose,
  onSuccess,
}: {
  category?: CategoryRow;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [iconUrl, setIconUrl] = useState(category?.iconUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileInputId = `category-icon-${useId().replace(/:/g, "")}`;
  const isEdit = Boolean(category);

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

    const payload: Record<string, unknown> = { name, sortOrder };
    if (description) payload.description = description;
    if (icon) payload.iconUrl = icon;

    setLoading(true);
    try {
      if (isEdit) {
        await apiPatch(`/admin/categories/${category!.id}`, payload);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update "${category!.name}" — changes apply across the whole organization.`
              : "This category becomes available organization-wide for products and staff assignment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              placeholder="e.g. Sneakers"
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading
                ? <HookLoader size="button" label={isEdit ? "Saving..." : "Creating..."} />
                : isEdit ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Category card ───────────────────────────────────────────────────────────

function CategoryCard({
  category,
  onEdit,
  onRefresh,
}: {
  category: CategoryRow;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const canDelete = category.productCount === 0;

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
              <DropdownMenuItem onClick={onEdit}>
                <Pencil size={14} />
                Edit Category
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
                {canDelete ? "Delete" : "Delete (has products)"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {category.description && (
          <p className="mt-2.5 line-clamp-2 text-xs text-zinc-500">{category.description}</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
            <Package size={11} />
            {category.productCount} product{category.productCount === 1 ? "" : "s"}
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

export default function CategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: session } = useAdminSession();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useApiQuery<CategoriesResponse>(
    ["admin", "categories"],
    "/admin/categories",
  );

  // Guard: only super_admin manages the organization taxonomy
  useEffect(() => {
    if (session && !isSuperAdmin(session)) router.replace("/dashboard");
  }, [router, session]);
  if (session && !isSuperAdmin(session)) return null;

  const all = data?.data ?? [];
  const filtered = all.filter((category) => {
    if (statusFilter === "active" && !category.isActive) return false;
    if (statusFilter === "inactive" && category.isActive) return false;
    if (search && ![category.name, category.slug, category.description].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    )) return false;
    return true;
  });

  const productsCategorized = all.reduce((sum, category) => sum + category.productCount, 0);
  const withoutManager = all.filter((category) => category.managers.length === 0).length;

  return (
    <div className="p-2 sm:p-4 space-y-5">
      <PageHeader
        title="Categories"
        description="Organization-wide product taxonomy and the staff in charge of each category."
        actions={
          <Button variant="brand" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus size={15} />
            New Category
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Tags} tone="amber" label="Total Categories" value={all.length} caption="Organization-wide" />
        <KpiCard icon={CheckCircle2} tone="green" label="Active" value={all.filter((c) => c.isActive).length} caption="Available for products" />
        <KpiCard icon={Package} tone="blue" label="Products Categorized" value={productsCategorized} caption="Across all categories" />
        <KpiCard icon={UserX} tone={withoutManager > 0 ? "red" : "zinc"} label="Without Manager" value={withoutManager} caption="Need an assignee" />
      </div>

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

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => setEditing(category)}
              onRefresh={refetch}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <CategoryDialog
          open
          onClose={() => setCreateOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {editing && (
        <CategoryDialog
          category={editing}
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
