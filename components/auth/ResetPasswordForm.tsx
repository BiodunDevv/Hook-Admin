"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { HookLogo } from "@/components/shared/HookLogo";
import { useResetPassword } from "@/lib/query";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reset = useResetPassword();
  const [values, setValues] = useState({
    email: searchParams.get("email") || "admin@gmail.com",
    code: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string }>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = "Please enter a valid admin email address";
    }
    if (values.code.length < 4) {
      nextErrors.code = "Enter the OTP sent to your email";
    }
    if (values.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }
    try {
      await reset.mutateAsync(values);
      router.push("/login");
    } catch {
      // Mutation errors are displayed globally through Sonner.
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
      <div className="mb-8 text-center">
        <HookLogo className="justify-center text-4xl" />
        <div className="mx-auto mt-6 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <KeyRound size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">Enter your OTP</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          Use the OTP from your email to create a new admin password.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Admin email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="reset-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              className="bg-white pl-9 focus:border-brand-gold focus:ring-brand-gold/20"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="otp">OTP code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            value={values.code}
            onChange={(event) => setValues((current) => ({ ...current, code: event.target.value.replace(/\D/g, "") }))}
            className="bg-emerald-50 text-center text-3xl font-bold tracking-[0.35em] text-emerald-800"
            placeholder="123456"
          />
          {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="new-password"
              type="password"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              className="bg-white pl-9 focus:border-brand-gold focus:ring-brand-gold/20"
            />
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>
        <Button type="submit" variant="brand" disabled={reset.isPending} className="w-full">
          {reset.isPending ? <HookLoader size="button" label="Resetting..." /> : "Reset password"}
        </Button>
        <Button asChild type="button" variant="ghost" className="w-full">
          <Link href="/login"><ArrowLeft size={15} /> Back to login</Link>
        </Button>
      </form>
    </div>
  );
}
