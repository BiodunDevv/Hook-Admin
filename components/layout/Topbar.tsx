"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

const ranges = ["Today", "7d", "30d"] as const;

export default function Topbar() {
  const [activeRange, setActiveRange] = useState<(typeof ranges)[number]>("Today");
  const [commandOpen, setCommandOpen] = useState(false);
  const router = useRouter();

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

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
        <SidebarTrigger className="md:hidden" />

        <Button
          variant="outline"
          onClick={() => setCommandOpen(true)}
          className="h-9 w-9 justify-center bg-muted px-2 text-muted-foreground sm:w-full sm:max-w-xs sm:justify-start sm:px-3"
        >
          <span className="hidden flex-1 text-left sm:block">
            Search orders, vendors, customers...
          </span>
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </Button>

        <div className="flex-1" />

        <div className="hidden items-center gap-1 rounded-md border border-border bg-muted p-1 text-sm sm:flex">
          <span className="flex items-center gap-1.5 px-2 text-muted-foreground">
            <Calendar size={15} />
          </span>
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                "rounded px-3 py-1 font-medium transition-colors",
                activeRange === range
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range}
            </button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative border-border"
            >
              <Bell />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div>
                <p className="font-medium">New order #ORD-1234</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div>
                <p className="font-medium">Vendor Adunni Farms verified</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div>
                <p className="font-medium">Driver Emeka is delayed</p>
                <p className="text-xs text-muted-foreground">32 minutes ago</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="hidden h-9 items-center gap-1.5 border-border text-foreground sm:flex"
        >
          <Download size={15} />
          Export
        </Button>

        <Button variant="brand" className="h-9 items-center gap-1.5 px-3.5">
          <Zap size={15} className="fill-zinc-950" />
          <span className="hidden sm:inline">Quick Actions</span>
        </Button>
      </header>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search pages, orders, vendors..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => navigate(item.href)}
                  className="gap-2"
                >
                  <Icon className="text-muted-foreground" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => navigate("/dashboard/orders")}>
              View all orders
            </CommandItem>
            <CommandItem onSelect={() => navigate("/dashboard/vendors")}>
              Manage vendors
            </CommandItem>
            <CommandItem onSelect={() => navigate("/dashboard/reports")}>
              Open reports
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
