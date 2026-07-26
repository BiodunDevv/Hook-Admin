"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HookLogo } from "@/components/shared/HookLogo";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginPlatformAccount } from "@/lib/api";

export function PortalLogin({ type }: { type: "runner" | "partner" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      await loginPlatformAccount(String(form.get("email")), String(form.get("password")), type);
      router.replace(`/${type}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Sign in failed");
    } finally { setLoading(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><Card className="w-full max-w-sm rounded-lg shadow-none">
    <CardHeader className="items-center gap-3"><HookLogo className="text-3xl" /><CardTitle>{type === "runner" ? "Runner" : "Hook Partner"} sign in</CardTitle></CardHeader>
    <CardContent><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div><div className="space-y-1.5"><Label>Password</Label><Input name="password" type="password" required /></div><Button className="w-full bg-hook text-black hover:bg-hook/90" disabled={loading}>{loading ? <HookLoader size="button" variant="dark" /> : "Sign in"}</Button></form></CardContent>
  </Card></main>;
}
