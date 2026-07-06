"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCog } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
    "AI Negotiation": "ai_negotiation.view",
    "Reports": "reports.view",
    "Settings": "settings.view",
  };

  const visibleNavItems = navItems.filter((item) => {
    const perm = navPermissionMap[item.label];
    if (!perm) return true; // Dashboard — always visible
    return hasPermission(admin ?? null, perm);
  });

  // Staff (super_admin only) — inserted after Customers to sit with people management
  if (admin?.role === "super_admin") {
    const staffItem = { label: "Staff", href: "/dashboard/staff", icon: UserCog };
    const customersIndex = visibleNavItems.findIndex((item) => item.label === "Customers");
    visibleNavItems.splice(customersIndex === -1 ? visibleNavItems.length : customersIndex + 1, 0, staffItem);
  }

  function handleLogout() {
    logout();
    router.push("/login");
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
                <span className="flex size-8 items-center justify-center rounded-md bg-brand-gold text-sm font-bold text-zinc-950">
                  H
                </span>
                <span className="font-semibold text-sidebar-foreground">
                  Hook
                </span>
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
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            title="Sign out"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
