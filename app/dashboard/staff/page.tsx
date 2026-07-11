"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Headset,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Check,
  Phone,
  Tags,
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
import { HookLoader } from "@/components/shared/HookLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useApiQuery, useAdminSession } from "@/lib/query";
import { apiPost, apiPatch, apiRequest } from "@/lib/api";
import { isSuperAdmin } from "@/lib/permissions";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  type Permission,
} from "@/lib/permissions";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "support" | "admin" | "super_admin";
  permissions: string[];
  assignedCategoryIds?: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  phone?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  isActive?: boolean;
}

interface CategoriesResponse {
  data: CategoryOption[];
  total: number;
}

interface StaffListResponse {
  data: StaffMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLE_META = {
  super_admin: {
    label: "Super Admin",
    icon: ShieldCheck,
    color: "bg-amber-100 text-amber-800 border-amber-200",
    iconColor: "text-amber-600",
    description: "Full access to everything",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    iconColor: "text-blue-600",
    description: "Full dashboard access, most write actions",
  },
  support: {
    label: "Support",
    icon: Headset,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    iconColor: "text-purple-600",
    description: "Access based on assigned permissions only",
  },
} as const;

function RoleBadge({ role }: { role: StaffMember["role"] }) {
  const meta = ROLE_META[role] ?? ROLE_META.support;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.color}`}
    >
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`size-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-300"}`}
      />
      <span className={`text-xs ${isActive ? "text-emerald-700" : "text-zinc-400"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(member: StaffMember) {
  return `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase() || "?";
}

// ─── Create Staff Dialog ───────────────────────────────────────────────────

function CreateStaffDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"support" | "admin" | "super_admin">("support");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Orders"]));

  function togglePerm(perm: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  function toggleGroup(group: { label: string; permissions: Permission[] }) {
    const allSelected = group.permissions.every((p) => selectedPerms.has(p));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => (allSelected ? next.delete(p) : next.add(p)));
      return next;
    });
  }

  function toggleGroupExpand(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function selectAll() {
    setSelectedPerms(new Set(ALL_PERMISSIONS));
  }

  function clearAll() {
    setSelectedPerms(new Set());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const phone = String(form.get("phone") || "").trim();
    const payload = {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      firstName: String(form.get("firstName") || ""),
      lastName: String(form.get("lastName") || ""),
      phone: phone || undefined,
      role,
      permissions: role === "support" ? Array.from(selectedPerms) : [],
    };

    if (!payload.email || !payload.password || !payload.firstName || !payload.lastName) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (role !== "super_admin" && !phone) {
      toast.error("Phone number is required for admin and support staff");
      return;
    }
    if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      toast.error("Enter a valid phone number (e.g. +234 801 234 5678)");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/admin/staff", payload);
      toast.success(`${ROLE_META[role].label} account created successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed to create staff");
    } finally {
      setLoading(false);
    }
  }

  const showPermissions = role === "support";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Create a new staff account and configure their role and access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" name="firstName" placeholder="John" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" name="lastName" placeholder="Doe" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" name="email" type="email" placeholder="staff@hook.africa" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Temporary Password *</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 6 characters" required minLength={6} />
            <p className="text-xs text-zinc-400">Staff member should change this on first login.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone Number {role !== "super_admin" ? "*" : <span className="font-normal text-zinc-400">(optional)</span>}
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+234 801 234 5678"
              required={role !== "super_admin"}
            />
            <p className="text-xs text-zinc-400">
              Shown as the contact for categories this staff member manages.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Role *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["support", "admin", "super_admin"] as const).map((r) => {
                const meta = ROLE_META[r];
                const Icon = meta.icon;
                const selected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition-all ${
                      selected
                        ? "border-zinc-900 bg-zinc-950 text-white"
                        : "border-border hover:border-zinc-300 hover:bg-muted"
                    }`}
                  >
                    <Icon size={18} className={selected ? "text-amber-400" : meta.iconColor} />
                    <span className="text-[11px] font-semibold">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500">{ROLE_META[role].description}</p>
          </div>

          {showPermissions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-zinc-300">·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                {PERMISSION_GROUPS.map((group) => {
                  const allSelected = group.permissions.every((p) => selectedPerms.has(p));
                  const someSelected = group.permissions.some((p) => selectedPerms.has(p));
                  const expanded = expandedGroups.has(group.label);
                  return (
                    <div key={group.label}>
                      {/* Row: div instead of button to avoid nested button violation */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleGroupExpand(group.label)}
                        onKeyDown={(e) => e.key === "Enter" && toggleGroupExpand(group.label)}
                        className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          {/* Checkbox toggle — standalone button, no outer button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroup(group);
                            }}
                            className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              allSelected
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : someSelected
                                ? "border-zinc-400 bg-zinc-100"
                                : "border-border bg-background"
                            }`}
                          >
                            {allSelected && <Check size={10} />}
                            {someSelected && !allSelected && <span className="block size-1.5 rounded-sm bg-zinc-500" />}
                          </button>
                          <span className="text-sm font-medium">{group.label}</span>
                          <span className="text-xs text-zinc-400">
                            {group.permissions.filter((p) => selectedPerms.has(p)).length}/
                            {group.permissions.length}
                          </span>
                        </div>
                        {expanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                      </div>
                      {expanded && (
                        <div className="grid grid-cols-2 gap-1 bg-muted/30 px-3 py-2">
                          {group.permissions.map((perm) => (
                            <label
                              key={perm}
                              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPerms.has(perm)}
                                onChange={() => togglePerm(perm)}
                                className="size-3.5 accent-zinc-900"
                              />
                              <span className="text-xs">{PERMISSION_LABELS[perm as Permission]}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-400">
                {selectedPerms.size} of {ALL_PERMISSIONS.length} permissions selected
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? <HookLoader size="button" label="Creating..." /> : "Create Staff Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Permissions Edit Dialog ───────────────────────────────────────────────

function PermissionsDialog({
  member,
  open,
  onClose,
  onSuccess,
}: {
  member: StaffMember;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(
    new Set(member.permissions || []),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(PERMISSION_GROUPS.map((g) => g.label)),
  );

  function togglePerm(perm: string) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  function toggleGroup(group: { label: string; permissions: Permission[] }) {
    const allSelected = group.permissions.every((p) => selectedPerms.has(p));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => (allSelected ? next.delete(p) : next.add(p)));
      return next;
    });
  }

  function toggleGroupExpand(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiPatch(`/admin/staff/${member.id}/permissions`, {
        permissions: Array.from(selectedPerms),
      });
      toast.success("Permissions updated");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Permissions</DialogTitle>
          <DialogDescription>
            Configure what {member.firstName} {member.lastName} can access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">{selectedPerms.size} of {ALL_PERMISSIONS.length} selected</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedPerms(new Set(ALL_PERMISSIONS))}
                className="text-xs text-blue-600 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedPerms(new Set())}
                className="text-xs text-zinc-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {PERMISSION_GROUPS.map((group) => {
              const allSelected = group.permissions.every((p) => selectedPerms.has(p));
              const someSelected = group.permissions.some((p) => selectedPerms.has(p));
              const expanded = expandedGroups.has(group.label);
              return (
                <div key={group.label}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleGroupExpand(group.label)}
                    onKeyDown={(e) => e.key === "Enter" && toggleGroupExpand(group.label)}
                    className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group);
                        }}
                        className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          allSelected
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : someSelected
                            ? "border-zinc-400 bg-zinc-100"
                            : "border-border bg-background"
                        }`}
                      >
                        {allSelected && <Check size={10} />}
                        {someSelected && !allSelected && <span className="block size-1.5 rounded-sm bg-zinc-500" />}
                      </button>
                      <span className="text-sm font-medium">{group.label}</span>
                      <span className="text-xs text-zinc-400">
                        {group.permissions.filter((p) => selectedPerms.has(p)).length}/{group.permissions.length}
                      </span>
                    </div>
                    {expanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                  </div>
                  {expanded && (
                    <div className="grid grid-cols-2 gap-1 bg-muted/30 px-3 py-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm}
                          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPerms.has(perm)}
                            onChange={() => togglePerm(perm)}
                            className="size-3.5 accent-zinc-900"
                          />
                          <span className="text-xs">{PERMISSION_LABELS[perm as Permission]}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? <HookLoader size="button" label="Saving..." /> : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Categories Dialog ──────────────────────────────────────────────

function CategoriesDialog({
  member,
  categories,
  open,
  onClose,
  onSuccess,
}: {
  member: StaffMember;
  categories: CategoryOption[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(member.assignedCategoryIds || []),
  );

  function toggleCategory(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiPatch(`/admin/staff/${member.id}/categories`, {
        categoryIds: Array.from(selected),
      });
      toast.success("Category assignments updated");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Categories</DialogTitle>
          <DialogDescription>
            Pick the categories {member.firstName} {member.lastName} is in charge of.
            They will show as the contact person on every product in those categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            {selected.size} of {categories.length} selected
          </p>
          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-zinc-400">
              No categories exist yet — create them on the Categories page first.
            </p>
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="size-4 accent-zinc-900"
                  />
                  <Tags size={13} className="shrink-0 text-zinc-400" />
                  <span className="flex-1 font-medium text-zinc-800">{category.name}</span>
                  {category.isActive === false && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">Inactive</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="brand" onClick={handleSave} disabled={loading}>
            {loading ? <HookLoader size="button" label="Saving..." /> : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Card ────────────────────────────────────────────────────────────

function StaffCard({
  member,
  onRefresh,
  currentUserId,
  categories,
}: {
  member: StaffMember;
  onRefresh: () => void;
  currentUserId?: string;
  categories: CategoryOption[];
}) {
  const [permOpen, setPermOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isSelf = member.id === currentUserId;
  const meta = ROLE_META[member.role] ?? ROLE_META.support;
  const Icon = meta.icon;

  async function handleToggle() {
    setToggling(true);
    try {
      await apiPatch(`/admin/staff/${member.id}/toggle`);
      toast.success(member.isActive ? "Account deactivated" : "Account activated");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed");
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${member.firstName} ${member.lastName}'s account? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiRequest(`/admin/staff/${member.id}`, { method: "DELETE" });
      toast.success("Staff member removed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="rounded-xl shadow-none transition-shadow hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${meta.color}`}>
                {initials(member)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">
                  {member.firstName} {member.lastName}
                  {isSelf && (
                    <span className="ml-1.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                      You
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{member.email}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0 text-zinc-400">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {member.role === "support" && (
                  <DropdownMenuItem onClick={() => setPermOpen(true)}>
                    <KeyRound size={14} />
                    Edit Permissions
                  </DropdownMenuItem>
                )}
                {member.role !== "super_admin" && (
                  <DropdownMenuItem onClick={() => setCatOpen(true)}>
                    <Tags size={14} />
                    Assign Categories
                  </DropdownMenuItem>
                )}
                {!isSelf && (
                  <DropdownMenuItem
                    onClick={handleToggle}
                    disabled={toggling}
                  >
                    <Power size={14} />
                    {member.isActive ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                )}
                {!isSelf && member.role !== "super_admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} />
                      Remove Staff
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RoleBadge role={member.role} />
            <StatusDot isActive={member.isActive} />
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-900"
              >
                <Phone size={11} />
                {member.phone}
              </a>
            )}
          </div>

          {/* Assigned categories — the areas this person is in charge of */}
          {member.role !== "super_admin" && (member.assignedCategoryIds?.length ?? 0) > 0 && (
            <div className="mt-3 border-t border-dashed border-border pt-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                In Charge Of
              </p>
              <div className="flex flex-wrap gap-1">
                {(member.assignedCategoryIds || []).map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  if (!category) return null;
                  return (
                    <span
                      key={categoryId}
                      className="flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
                    >
                      <Tags size={9} />
                      {category.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {member.role === "support" && (
            <div className="mt-3 border-t border-dashed border-border pt-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Permissions ({member.permissions?.length ?? 0})
              </p>
              {!member.permissions?.length ? (
                <p className="text-xs text-zinc-400">No permissions assigned</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {member.permissions.slice(0, 6).map((perm) => (
                    <span
                      key={perm}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600"
                    >
                      {PERMISSION_LABELS[perm as Permission] ?? perm}
                    </span>
                  ))}
                  {(member.permissions?.length ?? 0) > 6 && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      +{member.permissions.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-3 border-t border-dashed border-border pt-3 flex items-center justify-between text-xs text-zinc-400">
            <span>Joined {formatDate(member.createdAt)}</span>
            {member.lastLoginAt && (
              <span>Last login {formatDate(member.lastLoginAt)}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {permOpen && (
        <PermissionsDialog
          member={member}
          open={permOpen}
          onClose={() => setPermOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {catOpen && (
        <CategoriesDialog
          member={member}
          categories={categories}
          open={catOpen}
          onClose={() => setCatOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { data: session } = useAdminSession();
  const router = useRouter();

  // Guard: only super_admin can access this page
  if (session && !isSuperAdmin(session)) {
    router.replace("/dashboard");
    return null;
  }

  const queryParams = new URLSearchParams();
  if (roleFilter !== "all") queryParams.set("role", roleFilter);
  const queryString = queryParams.toString();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useApiQuery<StaffListResponse>(
    ["admin", "staff", roleFilter],
    `/admin/staff${queryString ? `?${queryString}` : ""}`,
  );

  const { data: categoriesData } = useApiQuery<CategoriesResponse>(
    ["admin", "categories"],
    "/admin/categories",
  );
  const categoryOptions = categoriesData?.data ?? [];

  const allMembers = data?.data ?? [];
  const filtered = search
    ? allMembers.filter((m) =>
        [m.email, m.firstName, m.lastName].some((v) =>
          v?.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : allMembers;

  const superAdmins = filtered.filter((m) => m.role === "super_admin");
  const admins = filtered.filter((m) => m.role === "admin");
  const support = filtered.filter((m) => m.role === "support");

  const stats = [
    { label: "Super Admins", count: data?.data.filter((m) => m.role === "super_admin").length ?? 0, role: "super_admin" as const },
    { label: "Admins", count: data?.data.filter((m) => m.role === "admin").length ?? 0, role: "admin" as const },
    { label: "Support", count: data?.data.filter((m) => m.role === "support").length ?? 0, role: "support" as const },
    { label: "Total Staff", count: data?.total ?? 0, role: null },
  ];

  return (
    <div className="p-2 sm:p-4 space-y-5">
      <PageHeader
        title="Staff Management"
        description="Manage team accounts, roles, and permissions."
        actions={
          <Button
            variant="brand"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus size={15} />
            Add Staff Member
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const meta = s.role ? ROLE_META[s.role] : null;
          const Icon = meta?.icon ?? UserCog;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-3.5 shadow-none"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} className={meta?.iconColor ?? "text-zinc-500"} />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-zinc-900">{s.count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-9 w-full sm:w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="support">Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <HookLoader size="page" label="Loading staff..." />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load staff members. Please try again.
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <EmptyState
            icon={UserCog}
            title="No staff members found"
            description={
              search
                ? `No results for "${search}"`
                : "Get started by adding your first staff member."
            }
          />
          {!search && (
            <Button variant="brand" onClick={() => setCreateOpen(true)} className="mt-4">
              <Plus size={15} />
              Add Staff Member
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-6">
          {superAdmins.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <ShieldCheck size={14} className="text-amber-600" />
                Super Admins
                <Badge variant="secondary" className="text-[10px]">{superAdmins.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {superAdmins.map((m) => (
                  <StaffCard
                    key={m.id}
                    member={m}
                    onRefresh={refetch}
                    currentUserId={session?.id}
                    categories={categoryOptions}
                  />
                ))}
              </div>
            </section>
          )}

          {admins.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <Shield size={14} className="text-blue-600" />
                Admins
                <Badge variant="secondary" className="text-[10px]">{admins.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {admins.map((m) => (
                  <StaffCard
                    key={m.id}
                    member={m}
                    onRefresh={refetch}
                    currentUserId={session?.id}
                    categories={categoryOptions}
                  />
                ))}
              </div>
            </section>
          )}

          {support.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                <Headset size={14} className="text-purple-600" />
                Support Staff
                <Badge variant="secondary" className="text-[10px]">{support.length}</Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {support.map((m) => (
                  <StaffCard
                    key={m.id}
                    member={m}
                    onRefresh={refetch}
                    currentUserId={session?.id}
                    categories={categoryOptions}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <CreateStaffDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
