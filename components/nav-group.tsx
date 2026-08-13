"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavGroup as HookNavGroup } from "@/components/layout/nav-items";

function isRouteActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavGroup({ label, items }: HookNavGroup) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarGroup className="py-1.5">
      <SidebarGroupLabel className="h-7 px-2 text-[10px] font-semibold uppercase text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href);

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.label}
                className="h-9 data-[active=true]:bg-zinc-950 data-[active=true]:text-white data-[active=true]:hover:bg-zinc-900 [&[data-active=true]>svg]:text-brand-gold"
              >
                <Link href={item.href} onClick={() => { if (isMobile) setOpenMobile(false); }}>
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
              {item.badge ? (
                <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
