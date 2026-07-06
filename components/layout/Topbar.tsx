"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Zap,
  BellOff,
  ShoppingCart,
  Package,
  Store,
  Users,
  Search,
  UserCog,
  Shield,
  ShieldCheck,
  Headset,
} from "lucide-react";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiGet } from "@/lib/api";
import { money } from "@/lib/admin-utils";
import { hasPermission, isSuperAdmin, type Permission } from "@/lib/permissions";
import { navItems } from "./nav-items";

interface Notification {
  id: string;
  title?: string;
  message?: string;
  createdAt?: string;
  isRead?: boolean;
}

interface NotificationsResponse {
  data: Notification[];
  unread: number;
  total: number;
}

interface SearchOrder {
  id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  total: number;
  customer: string;
  createdAt: string;
}

interface SearchProduct {
  id: string;
  title: string;
  hookId?: string;
  status: string;
  sellingPrice: number;
  image?: string | null;
  vendor?: string | null;
}

interface SearchVendor {
  id: string;
  businessName: string;
  businessEmail?: string;
  tier?: string;
  isApproved: boolean;
  isActive: boolean;
}

interface SearchCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

interface SearchStaff {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: "support" | "admin" | "super_admin";
  isActive: boolean;
  permissions: string[];
}

interface SearchResults {
  query: string;
  orders: SearchOrder[];
  products: SearchProduct[];
  vendors: SearchVendor[];
  customers: SearchCustomer[];
  staff: SearchStaff[];
  total: number;
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    processing: "bg-blue-100 text-blue-700",
    in_transit: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    approved: "bg-emerald-100 text-emerald-700",
    pending_approval: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
    disabled: "bg-zinc-100 text-zinc-500",
    tier_1: "bg-purple-100 text-purple-700",
    tier_2: "bg-blue-100 text-blue-700",
    tier_3: "bg-zinc-100 text-zinc-600",
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-zinc-100 text-zinc-500",
    successful: "bg-green-100 text-green-700",
    unpaid: "bg-red-100 text-red-700",
  };
  const cls = map[status] ?? "bg-zinc-100 text-zinc-500";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ProductThumb({ src, title }: { src?: string | null; title: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded bg-zinc-100 text-zinc-400">
        <Package size={14} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setErr(true)}
      className="size-7 shrink-0 rounded object-cover"
    />
  );
}

const navPermissionMap: Record<string, Permission> = {
  "Orders": "orders.view",
  "Products": "products.view",
  "Vendors": "vendors.view",
  "Customers": "customers.view",
  "Drivers": "drivers.view",
  "Field Agents": "field_agents.view",
  "Booths": "booths.view",
  "Financials": "financials.view",
  "AI Negotiation": "ai_negotiation.view",
  "Reports": "reports.view",
  "Settings": "settings.view",
};

export default function Topbar() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { data: admin } = useAdminSession();

  // Search scope is driven by the caller's role + permissions — mirrors backend scoping
  const canSearchOrders = hasPermission(admin ?? null, "orders.view");
  const canSearchProducts = hasPermission(admin ?? null, "products.view");
  const canSearchVendors = hasPermission(admin ?? null, "vendors.view");
  const canSearchCustomers = hasPermission(admin ?? null, "customers.view");
  const canSearchStaff = isSuperAdmin(admin);

  const searchScopes = [
    canSearchOrders && "orders",
    canSearchProducts && "products",
    canSearchVendors && "vendors",
    canSearchCustomers && "customers",
    canSearchStaff && "staff",
  ].filter(Boolean) as string[];

  const searchPlaceholder = searchScopes.length
    ? `Search ${searchScopes.join(", ")}...`
    : "Search...";

  const { data: notifData } = useApiQuery<NotificationsResponse>(
    ["notifications"],
    "/notifications",
  );

  const notifications = notifData?.data ?? [];
  const unreadCount = notifData?.unread ?? 0;

  // Debounced search
  useEffect(() => {
    if (abortRef.current) clearTimeout(abortRef.current);

    if (query.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    abortRef.current = setTimeout(async () => {
      try {
        const data = await apiGet<SearchResults>(
          `/admin/search?q=${encodeURIComponent(query)}&limit=5`,
        );
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (abortRef.current) clearTimeout(abortRef.current);
    };
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!commandOpen) {
      setQuery("");
      setResults(null);
      setSearching(false);
    }
  }, [commandOpen]);

  // ⌘K shortcut
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function navigate(href: string) {
    setCommandOpen(false);
    router.push(href);
  }

  // Defensive client-side scoping — backend already filters, this guarantees a
  // role never renders a bucket it can't access (e.g. stale cache, role change)
  const scoped = results
    ? {
        orders: canSearchOrders ? results.orders : [],
        products: canSearchProducts ? results.products : [],
        vendors: canSearchVendors ? results.vendors : [],
        customers: canSearchCustomers ? results.customers : [],
        staff: canSearchStaff ? results.staff ?? [] : [],
      }
    : null;
  const scopedTotal = scoped
    ? scoped.orders.length + scoped.products.length + scoped.vendors.length + scoped.customers.length + scoped.staff.length
    : 0;
  const noResults = results && scopedTotal === 0 && query.length >= 2 && !searching;
  const isSearchMode = query.length >= 2;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
        <SidebarTrigger className="md:hidden" />

        <Button
          variant="outline"
          onClick={() => setCommandOpen(true)}
          className="h-9 w-9 justify-center bg-muted px-2 text-muted-foreground sm:w-full sm:max-w-xs sm:justify-start sm:px-3"
        >
          <Search size={14} className="shrink-0" />
          <span className="hidden flex-1 truncate text-left sm:block">
            {searchPlaceholder}
          </span>
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </Button>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative border-border">
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  {unreadCount} new
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <BellOff size={20} className="text-zinc-300" />
                <p className="text-sm font-medium text-zinc-500">No new notifications</p>
                <p className="text-xs text-zinc-400">You&apos;re all caught up</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-2 py-1.5">
                  <p className="text-sm font-medium">{n.title ?? n.message ?? "Notification"}</p>
                  {n.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="brand" className="h-9 items-center gap-1.5 px-3.5">
          <Zap size={15} className="fill-zinc-950" />
          <span className="hidden sm:inline">Quick Actions</span>
        </Button>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-130">

          {/* Loading */}
          {searching && (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <HookLoader size="inline" label="Searching..." />
            </div>
          )}

          {/* No results */}
          {noResults && (
            <CommandEmpty>
              <span className="block">No results for &ldquo;{query}&rdquo;</span>
              <span className="mt-1 block text-xs text-zinc-400">
                Your search covers: {searchScopes.length ? searchScopes.join(", ") : "nothing — ask an admin for access"}
              </span>
            </CommandEmpty>
          )}

          {/* Live search results — every bucket is permission-scoped */}
          {scoped && scopedTotal > 0 && !searching && (
            <>
              {scoped.orders.length > 0 && (
                <CommandGroup heading={`Orders (${scoped.orders.length})`}>
                  {scoped.orders.map((order) => (
                    <CommandItem
                      key={order.id}
                      value={`order-${order.id}-${order.orderCode}`}
                      onSelect={() => navigate(`/dashboard/orders/${order.id}`)}
                      className="gap-3 py-2.5"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded bg-amber-50 text-amber-500">
                        <ShoppingCart size={14} />
                      </span>
                      <span className="flex flex-1 items-center gap-2 min-w-0">
                        <span className="font-semibold text-zinc-900 shrink-0">{order.orderCode}</span>
                        <span className="text-zinc-500 truncate text-sm">{order.customer}</span>
                        <StatusChip status={order.status} />
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-zinc-700">{money(order.total)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {scoped.orders.length > 0 && scoped.products.length > 0 && <CommandSeparator />}

              {scoped.products.length > 0 && (
                <CommandGroup heading={`Products (${scoped.products.length})`}>
                  {scoped.products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`product-${product.id}-${product.title}`}
                      onSelect={() => navigate(`/dashboard/products/${product.id}`)}
                      className="gap-3 py-2.5"
                    >
                      <ProductThumb src={product.image} title={product.title} />
                      <span className="flex flex-1 items-center gap-2 min-w-0">
                        <span className="font-semibold text-zinc-900 truncate">{product.title}</span>
                        {product.vendor && <span className="text-zinc-500 text-sm shrink-0 truncate">{product.vendor}</span>}
                        <StatusChip status={product.status} />
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-zinc-700">{money(product.sellingPrice)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {scoped.products.length > 0 && scoped.vendors.length > 0 && <CommandSeparator />}

              {scoped.vendors.length > 0 && (
                <CommandGroup heading={`Vendors (${scoped.vendors.length})`}>
                  {scoped.vendors.map((vendor) => (
                    <CommandItem
                      key={vendor.id}
                      value={`vendor-${vendor.id}-${vendor.businessName}`}
                      onSelect={() => navigate(`/dashboard/vendors/${vendor.id}`)}
                      className="gap-3 py-2.5"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-500">
                        <Store size={14} />
                      </span>
                      <span className="flex flex-1 items-center gap-2 min-w-0">
                        <span className="font-semibold text-zinc-900 shrink-0">{vendor.businessName}</span>
                        {vendor.tier && <StatusChip status={vendor.tier} />}
                        <StatusChip status={vendor.isApproved ? "approved" : "pending"} />
                      </span>
                      {vendor.businessEmail && (
                        <span className="shrink-0 text-xs text-zinc-400 hidden sm:block">{vendor.businessEmail}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {scoped.vendors.length > 0 && scoped.customers.length > 0 && <CommandSeparator />}

              {scoped.customers.length > 0 && (
                <CommandGroup heading={`Customers (${scoped.customers.length})`}>
                  {scoped.customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={`customer-${customer.id}-${customer.email}`}
                      onSelect={() => navigate(`/dashboard/customers/${customer.id}`)}
                      className="gap-3 py-2.5"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-500">
                        <Users size={14} />
                      </span>
                      <span className="flex flex-1 items-center gap-2 min-w-0">
                        <span className="font-semibold text-zinc-900 shrink-0">
                          {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"}
                        </span>
                        <span className="text-zinc-500 text-sm truncate">{customer.email}</span>
                        <StatusChip status={customer.isActive ? "active" : "inactive"} />
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Staff — scoped.staff is already empty for non-super_admins */}
              {scoped.staff.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading={`Staff (${scoped.staff.length})`}>
                    {scoped.staff.map((member) => {
                      const RoleIcon = member.role === "super_admin" ? ShieldCheck : member.role === "admin" ? Shield : Headset;
                      const roleColor = member.role === "super_admin" ? "bg-amber-50 text-amber-600" : member.role === "admin" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600";
                      return (
                        <CommandItem
                          key={member.id}
                          value={`staff-${member.id}-${member.email}`}
                          onSelect={() => navigate("/dashboard/staff")}
                          className="gap-3 py-2.5"
                        >
                          <span className={`flex size-7 shrink-0 items-center justify-center rounded ${roleColor}`}>
                            <RoleIcon size={14} />
                          </span>
                          <span className="flex flex-1 items-center gap-2 min-w-0">
                            <span className="font-semibold text-zinc-900 shrink-0">
                              {[member.firstName, member.lastName].filter(Boolean).join(" ") || "—"}
                            </span>
                            <span className="text-zinc-500 text-sm truncate">{member.email}</span>
                            <StatusChip status={member.role.replace("_", " ")} />
                          </span>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {/* Default nav — shown when not in search mode */}
          {!isSearchMode && !searching && (
            <>
              <CommandGroup heading="Navigation">
                {navItems.filter((item) => {
                  const perm = navPermissionMap[item.label];
                  if (!perm) return true;
                  return hasPermission(admin ?? null, perm);
                }).map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={item.label}
                      onSelect={() => navigate(item.href)}
                      className="gap-2"
                    >
                      <Icon className="text-muted-foreground" size={16} />
                      {item.label}
                    </CommandItem>
                  );
                })}
                {/* Staff nav shortcut — super_admin only */}
                {isSuperAdmin(admin) && (
                  <CommandItem
                    value="Staff Management"
                    onSelect={() => navigate("/dashboard/staff")}
                    className="gap-2"
                  >
                    <UserCog className="text-muted-foreground" size={16} />
                    Staff
                  </CommandItem>
                )}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                <CommandItem value="view-all-orders" onSelect={() => navigate("/dashboard/orders")}>
                  View all orders
                </CommandItem>
                <CommandItem value="manage-vendors" onSelect={() => navigate("/dashboard/vendors")}>
                  Manage vendors
                </CommandItem>
                <CommandItem value="open-reports" onSelect={() => navigate("/dashboard/reports")}>
                  Open reports
                </CommandItem>
                {isSuperAdmin(admin) && (
                  <CommandItem value="manage-staff" onSelect={() => navigate("/dashboard/staff")}>
                    Manage staff
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
