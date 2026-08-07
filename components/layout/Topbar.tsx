"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Zap,
  BellOff,
  ShoppingCart,
  Package,
  Users,
  Search,
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
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useAdminSession, useApiQuery } from "@/lib/query";
import { apiGet } from "@/lib/api";
import { money } from "@/lib/admin-utils";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import { canAccessNavItem, findNavItem, navItems } from "./nav-items";
import { PlatformContextSelector } from "@/components/platform/PlatformContextSelector";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

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
  customers: SearchCustomer[];
  staff: SearchStaff[];
  total: number;
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

export default function Topbar() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, state: sidebarState } = useSidebar();
  const { data: admin } = useAdminSession();
  const activeNavItem = findNavItem(pathname);
  const ActiveNavIcon = activeNavItem?.icon;

  // Search scope is driven by the caller's role + permissions — mirrors backend scoping
  const canSearchOrders = hasPermission(admin ?? null, "orders.view");
  const canSearchProducts = hasPermission(admin ?? null, "products.view");
  const canSearchCustomers = hasPermission(admin ?? null, "customers.view");
  const canSearchStaff = isSuperAdmin(admin);

  const searchScopes = [
    canSearchOrders && "orders",
    canSearchProducts && "products",
    canSearchCustomers && "customers",
    canSearchStaff && "staff",
  ].filter(Boolean) as string[];

  const searchPlaceholder = searchScopes.length
    ? `Search ${searchScopes.join(", ")}...`
    : "Search...";

  const { data: notifData } = useApiQuery<NotificationsResponse>(
    ["notifications"],
    "/admin/notifications",
  );

  const notifications = notifData?.data ?? [];
  const unreadCount = notifData?.unread ?? 0;

  // Debounced search
  useEffect(() => {
    if (abortRef.current) clearTimeout(abortRef.current);

    if (query.length < 2) {
      abortRef.current = setTimeout(() => {
        setResults(null);
        setSearching(false);
      }, 0);
      return;
    }

    abortRef.current = setTimeout(async () => {
      setSearching(true);
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

  function changeCommandOpen(open: boolean) {
    setCommandOpen(open);
    if (!open) {
      setQuery("");
      setResults(null);
      setSearching(false);
    }
  }

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
        customers: canSearchCustomers ? results.customers : [],
        staff: canSearchStaff ? (results.staff ?? []) : [],
      }
    : null;
  const scopedTotal = scoped
    ? scoped.orders.length +
      scoped.products.length +
      scoped.customers.length +
      scoped.staff.length
    : 0;
  const noResults =
    results && scopedTotal === 0 && query.length >= 2 && !searching;
  const isSearchMode = query.length >= 2;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-background/95 px-3 shadow-xs backdrop-blur-sm supports-backdrop-filter:bg-background/75 md:gap-3 md:px-5",
          !isMobile &&
            (sidebarState === "collapsed"
              ? "md:left-[var(--sidebar-width-icon)]"
              : "md:left-[var(--sidebar-width)]"),
          "md:transition-[left] md:duration-200 md:ease-linear",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <CustomSidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <div className="hidden min-w-0 sm:block">
            <AppBreadcrumbs
              page={
                activeNavItem
                  ? {
                      title: activeNavItem.label,
                      icon: ActiveNavIcon ? <ActiveNavIcon /> : undefined,
                    }
                  : null
              }
            />
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setCommandOpen(true)}
          className="ml-1 h-9 w-9 justify-center bg-muted/70 px-2 text-muted-foreground sm:w-full sm:max-w-64 sm:justify-start sm:px-3 lg:max-w-xs"
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
        <PlatformContextSelector />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative border-border"
            >
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-96 w-72 overflow-y-auto"
          >
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
                <p className="text-sm font-medium text-zinc-500">
                  No new notifications
                </p>
                <p className="text-xs text-zinc-400">
                  You&apos;re all caught up
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {n.title ?? n.message ?? "Notification"}
                  </p>
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

        <Button
          variant="outline"
          onClick={() => setCommandOpen(true)}
          className="h-9 w-9 items-center gap-1.5 px-0 sm:w-auto sm:px-3.5"
          aria-label="Open quick actions"
        >
          <Zap size={15} />
          <span className="hidden sm:inline">Quick Actions</span>
        </Button>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={changeCommandOpen}>
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
                <span className="block">
                  No results for &ldquo;{query}&rdquo;
                </span>
                <span className="mt-1 block text-xs text-zinc-400">
                  Your search covers:{" "}
                  {searchScopes.length
                    ? searchScopes.join(", ")
                    : "nothing — ask an admin for access"}
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
                        onSelect={() =>
                          navigate(`/dashboard/orders/${order.id}`)
                        }
                        className="gap-3 py-2.5"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-amber-50 text-amber-500">
                          <ShoppingCart size={14} />
                        </span>
                        <span className="flex flex-1 items-center gap-2 min-w-0">
                          <span className="font-semibold text-zinc-900 shrink-0">
                            {order.orderCode}
                          </span>
                          <span className="text-zinc-500 truncate text-sm">
                            {order.customer}
                          </span>
                          <StatusBadge status={order.status} />
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-zinc-700">
                          {money(order.total)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {scoped.orders.length > 0 && scoped.products.length > 0 && (
                  <CommandSeparator />
                )}

                {scoped.products.length > 0 && (
                  <CommandGroup
                    heading={`Products (${scoped.products.length})`}
                  >
                    {scoped.products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={`product-${product.id}-${product.title}`}
                        onSelect={() =>
                          navigate(`/dashboard/products/${product.id}`)
                        }
                        className="gap-3 py-2.5"
                      >
                        <ProductThumb
                          src={product.image}
                          title={product.title}
                        />
                        <span className="flex flex-1 items-center gap-2 min-w-0">
                          <span className="font-semibold text-zinc-900 truncate">
                            {product.title}
                          </span>
                          {product.vendor && (
                            <span className="text-zinc-500 text-sm shrink-0 truncate">
                              {product.vendor}
                            </span>
                          )}
                          <StatusBadge status={product.status} />
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-zinc-700">
                          {money(product.sellingPrice)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {scoped.products.length > 0 && scoped.customers.length > 0 && (
                  <CommandSeparator />
                )}

                {scoped.customers.length > 0 && (
                  <CommandGroup
                    heading={`Customers (${scoped.customers.length})`}
                  >
                    {scoped.customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`customer-${customer.id}-${customer.email}`}
                        onSelect={() =>
                          navigate(`/dashboard/customers/${customer.id}`)
                        }
                        className="gap-3 py-2.5"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-purple-50 text-purple-500">
                          <Users size={14} />
                        </span>
                        <span className="flex flex-1 items-center gap-2 min-w-0">
                          <span className="font-semibold text-zinc-900 shrink-0">
                            {[customer.firstName, customer.lastName]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </span>
                          <span className="text-zinc-500 text-sm truncate">
                            {customer.email}
                          </span>
                          <StatusBadge
                            status={customer.isActive ? "active" : "inactive"}
                          />
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
                        const RoleIcon =
                          member.role === "super_admin"
                            ? ShieldCheck
                            : member.role === "admin"
                              ? Shield
                              : Headset;
                        const roleColor =
                          member.role === "super_admin"
                            ? "bg-amber-50 text-amber-600"
                            : member.role === "admin"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-purple-50 text-purple-600";
                        return (
                          <CommandItem
                            key={member.id}
                            value={`staff-${member.id}-${member.email}`}
                            onSelect={() => navigate("/dashboard/staff")}
                            className="gap-3 py-2.5"
                          >
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded ${roleColor}`}
                            >
                              <RoleIcon size={14} />
                            </span>
                            <span className="flex flex-1 items-center gap-2 min-w-0">
                              <span className="font-semibold text-zinc-900 shrink-0">
                                {[member.firstName, member.lastName]
                                  .filter(Boolean)
                                  .join(" ") || "—"}
                              </span>
                              <span className="text-zinc-500 text-sm truncate">
                                {member.email}
                              </span>
                              <StatusBadge
                                status={member.role.replace("_", " ")}
                              />
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
                            >
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
                  {navItems
                    .filter((item) => canAccessNavItem(item, admin))
                    .map((item) => {
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
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Quick Actions">
                  <CommandItem
                    value="view-all-orders"
                    onSelect={() => navigate("/dashboard/orders")}
                  >
                    View all orders
                  </CommandItem>
                  <CommandItem
                    value="open-reports"
                    onSelect={() => navigate("/dashboard/reports")}
                  >
                    Open reports
                  </CommandItem>
                  {isSuperAdmin(admin) && (
                    <CommandItem
                      value="manage-staff"
                      onSelect={() => navigate("/dashboard/staff")}
                    >
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
