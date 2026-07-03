"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
import { clearToken } from "@/lib/api";
import { navItems } from "./nav-items";

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  function handleLogout() {
    clearToken();
    router.push("/login");
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
              {navItems.map((item) => {
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
                    {item.badge && (
                      <SidebarMenuBadge className="text-[11px]">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                    {item.dot && (
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
              AO
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              Admin Ops
            </p>
            <p className="truncate text-xs text-muted-foreground">hook.africa</p>
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
