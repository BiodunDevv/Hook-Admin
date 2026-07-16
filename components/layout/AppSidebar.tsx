"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCog, Tags } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAdminSession, useApiQuery, useLogout } from "@/lib/query";
import { hasPermission, type Permission } from "@/lib/permissions";
import { HookLogo } from "@/components/shared/HookLogo";
import { HookLoader } from "@/components/shared/HookLoader";
import { navItems } from "./nav-items";

interface DashboardSummary {
  activeOrders?: { value: number };
  activeDrivers?: { value: number };
  orders?: { pending: number; active?: number };
  logistics?: { activeDeliveries: number };
}

function initials(firstName?: string, lastName?: string, email?: string) {
  const value = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim();
  return (value || email?.slice(0, 2) || "AD").toUpperCase();
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: admin } = useAdminSession();
  const { data: summary } = useApiQuery<DashboardSummary>(["admin", "sidebar-summary"], "/admin/dashboard");
  const adminName = `${admin?.firstName || ""} ${admin?.lastName || ""}`.trim() || admin?.email || "Admin";
  const adminSubtitle = admin?.role ? admin.role.replaceAll("_", " ") : "hook.africa";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // For support role: filter nav items based on their permissions
  const navPermissionMap: Record<string, Permission> = {
    "Orders": "orders.view",
    "Products": "products.view",
    "Vendors": "vendors.view",
    "Customers": "customers.view",
    "Drivers": "drivers.view",
    "Field Agents": "field_agents.view",
    "Booths": "booths.view",
    "Financials": "financials.view",
    "Support": "deletions.view",
    "Checkout Analytics": "analytics.checkout",
    "AI Negotiation": "ai_negotiation.view",
    "Reports": "reports.view",
    "Settings": "settings.view",
  };

  const visibleNavItems = navItems.filter((item) => {
    const perm = navPermissionMap[item.label];
    if (!perm) return true; // Dashboard — always visible
    return hasPermission(admin ?? null, perm);
  });

  // Super_admin-only items spliced into logical positions:
  // Categories after Products (catalog cluster), Staff after Customers (people cluster)
  if (admin?.role === "super_admin") {
    const categoriesItem = { label: "Categories", href: "/dashboard/categories", icon: Tags };
    const productsIndex = visibleNavItems.findIndex((item) => item.label === "Products");
    visibleNavItems.splice(productsIndex === -1 ? visibleNavItems.length : productsIndex + 1, 0, categoriesItem);

    const staffItem = { label: "Staff", href: "/dashboard/staff", icon: UserCog };
    const customersIndex = visibleNavItems.findIndex((item) => item.label === "Customers");
    visibleNavItems.splice(customersIndex === -1 ? visibleNavItems.length : customersIndex + 1, 0, staffItem);
  }

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  }

  function sidebarBadge(label: string) {
    const orders = summary?.activeOrders?.value ?? summary?.orders?.active ?? summary?.orders?.pending ?? 0;
    if (label === "Orders" && orders) return String(orders);
    return null;
  }

  function sidebarDot(label: string) {
    const activeDrivers = summary?.activeDrivers?.value ?? summary?.logistics?.activeDeliveries ?? 0;
    if (label === "Drivers") return Boolean(activeDrivers);
    return false;
  }

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Hook">
              <Link href="/dashboard">
                <HookLogo className="text-2xl text-sidebar-foreground" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="data-[active=true]:bg-zinc-950 data-[active=true]:text-white data-[active=true]:hover:bg-zinc-900"
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {sidebarBadge(item.label) && (
                      <SidebarMenuBadge className="text-[11px]">
                        {sidebarBadge(item.label)}
                      </SidebarMenuBadge>
                    )}
                    {sidebarDot(item.label) && (
                      <SidebarMenuBadge>
                        <span className="size-2 rounded-full bg-emerald-500" />
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-900">
              {initials(admin?.firstName, admin?.lastName, admin?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {adminName}
            </p>
            <p className="truncate text-xs capitalize text-muted-foreground">{adminSubtitle}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Sign out"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <LogOut />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of Hook?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your admin session will be ended on this device. You can sign in again whenever you need access.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  className="bg-zinc-950 text-white hover:bg-zinc-800"
                >
                  {logout.isPending ? <HookLoader size="button" variant="yellow" /> : "Log out"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
