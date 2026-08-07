"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAdminSession, useApiQuery, useLogout } from "@/lib/query";
import { HookLogo } from "@/components/shared/HookLogo";
import { HookLoader } from "@/components/shared/HookLoader";
import { NavGroup } from "@/components/nav-group";
import { canAccessNavItem, navGroups } from "./nav-items";

interface DashboardSummary {
  activeOrders?: { value: number };
  orders?: { pending: number; active?: number };
}

function initials(firstName?: string, lastName?: string, email?: string) {
  const value = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim();
  return (value || email?.slice(0, 2) || "AD").toUpperCase();
}

export default function AppSidebar() {
  const router = useRouter();
  const logout = useLogout();
  const { data: admin } = useAdminSession();
  const { data: summary } = useApiQuery<DashboardSummary>(
    ["admin", "sidebar-summary"],
    "/admin/dashboard",
  );
  const adminName =
    `${admin?.firstName || ""} ${admin?.lastName || ""}`.trim() ||
    admin?.email ||
    "Admin";
  const adminSubtitle = admin?.role ? admin.role.replaceAll("_", " ") : "hook.";

  const orders =
    summary?.activeOrders?.value ??
    summary?.orders?.active ??
    summary?.orders?.pending ??
    0;
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canAccessNavItem(item, admin))
        .map((item) =>
          item.label === "Orders" && orders
            ? { ...item, badge: String(orders) }
            : item,
        ),
    }))
    .filter((group) => group.items.length > 0);

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => router.push("/login"),
    });
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="*:data-[slot=sidebar-inner]:bg-background"
    >
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="hook.">
              <Link
                href="/dashboard"
                className="justify-center group-data-[collapsible=icon]:px-0"
              >
                <HookLogo
                  className="text-2xl text-sidebar-foreground group-data-[collapsible=icon]:text-lg"
                  compact
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="py-1">
        {visibleNavGroups.map((group) => (
          <NavGroup key={group.label} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 rounded-md px-1 py-1.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/20 text-xs font-semibold text-foreground">
              {initials(admin?.firstName, admin?.lastName, admin?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {adminName}
            </p>
            <p className="truncate text-xs capitalize text-muted-foreground">
              {adminSubtitle}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Sign out"
                className="shrink-0 text-muted-foreground hover:text-destructive group-data-[collapsible=icon]:hidden"
              >
                <LogOut />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of Hook?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your admin session will be ended on this device. You can sign
                  in again whenever you need access.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  className="bg-zinc-950 text-white hover:bg-zinc-800"
                >
                  {logout.isPending ? (
                    <HookLoader size="button" variant="yellow" />
                  ) : (
                    "Log out"
                  )}
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
