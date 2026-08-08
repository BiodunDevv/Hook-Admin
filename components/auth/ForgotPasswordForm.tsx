"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { HookLogo } from "@/components/shared/HookLogo";
import { useForgotPassword } from "@/lib/query";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const forgot = useForgotPassword();
  const [email, setEmail] = useState(searchParams.get("email") || "admin@gmail.com");
  const [emailError, setEmailError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Please enter a valid Hook account email");
      return;
    }
    try {
      await forgot.mutateAsync({ email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      // Mutation errors are displayed globally through Sonner.
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
      <div className="mb-8 text-center">
        <HookLogo className="justify-center text-4xl" />
        <div className="mx-auto mt-6 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <LockKeyhole size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">Reset admin password</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          Enter your Hook account email. If it exists, we will send an OTP to continue.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Account email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-white pl-9 focus:border-brand-gold focus:ring-brand-gold/20"
            />
          </div>
          {emailError && <p className="text-xs text-red-500">{emailError}</p>}
        </div>
        <Button type="submit" variant="brand" disabled={forgot.isPending} className="w-full">
          {forgot.isPending ? <HookLoader size="button" label="Sending OTP..." /> : "Send OTP"}
        </Button>
        <Button asChild type="button" variant="ghost" className="w-full">
          <Link href="/auth/login"><ArrowLeft size={15} /> Back to login</Link>
        </Button>
      </form>
    </div>
  );
}
