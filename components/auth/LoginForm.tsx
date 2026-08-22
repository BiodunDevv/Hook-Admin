"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAccountLogin } from "@/lib/query";
import type { AuthSession } from "@/lib/api";
import { HookLoader } from "@/components/shared/HookLoader";
import { HookLogo } from "@/components/shared/HookLogo";

interface LoginFormProps {
  onSuccess: (session: AuthSession) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const login = useAccountLogin();
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  function validate() {
    const nextErrors: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!values.password) {
      nextErrors.password = "Password is required";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    try {
      const session = await login.mutateAsync(values);
      onSuccess(session);
    } catch {
      // Mutation errors are displayed globally through Sonner.
    }
  }

  return (
    <div className="mx-auto w-full max-w-md scroll-mb-[40vh] rounded-xl border border-zinc-200 bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
      <div className="mb-8 text-center">
        <HookLogo className="justify-center text-4xl" />
        <div className="mx-auto mt-6 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <ShieldCheck size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
          Welcome back
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
          One secure sign-in for staff, Market Associates, and Hook Partners.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues((current) => ({ ...current, email: event.target.value }))
              }
              className="bg-white pl-9 focus:border-brand-gold focus:ring-brand-gold/20"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="password"
              type="password"
              value={values.password}
              onChange={(event) =>
                setValues((current) => ({ ...current, password: event.target.value }))
              }
              className="bg-white pl-9 focus:border-brand-gold focus:ring-brand-gold/20"
            />
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <Link
            href={`/forgot-password?email=${encodeURIComponent(values.email)}`}
            className="text-xs font-semibold text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="brand" disabled={login.isPending} className="mt-2 w-full">
          {login.isPending ? <HookLoader size="button" label="Signing in..." /> : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
