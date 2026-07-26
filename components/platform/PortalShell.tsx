"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { HookLogo } from "@/components/shared/HookLogo";
import { Button } from "@/components/ui/button";
import { clearSession, logoutAdmin } from "@/lib/api";

export function PortalShell({
  type,
  children,
}: {
  type: "runner" | "partner";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/${type}`;
  const links = type === "runner"
    ? [["Dashboard", base], ["Assigned Markets", `${base}/markets`], ["Profile", `${base}/profile`], ["Security", `${base}/security`]]
    : [["Dashboard", base], ["Location", `${base}/location`], ["Profile", `${base}/profile`], ["Security", `${base}/security`]];
  if (pathname === `${base}/login`) return <>{children}</>;
  async function logout() {
    try { await logoutAdmin(); } catch { clearSession(); }
    router.replace(`/${type}/login`);
  }
  return <div className="min-h-screen bg-muted/30">
    <header className="border-b bg-white"><div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4"><HookLogo className="text-2xl" />
      <nav className="hidden flex-1 gap-1 md:flex">{links.map(([label, href]) => <Button key={href} variant={pathname === href ? "secondary" : "ghost"} asChild><Link href={href}>{label}</Link></Button>)}</nav>
      <Button variant="ghost" size="icon" onClick={logout} title="Log out"><LogOut /></Button>
    </div></header>
    <main className="mx-auto max-w-6xl p-3 md:p-6">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 flex border-t bg-white p-2 md:hidden">{links.map(([label, href]) => <Link key={href} href={href} className="flex-1 truncate px-1 py-2 text-center text-xs font-medium">{label}</Link>)}</nav>
  </div>;
}
