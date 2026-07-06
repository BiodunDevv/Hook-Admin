"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAdminLogin } from "@/lib/query";
import { HookLoader } from "@/components/shared/HookLoader";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const login = useAdminLogin();
  const [values, setValues] = useState({
    email: "admin@gmail.com",
    password: "123456",
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
    setServerError("");
    if (!validate()) return;

    try {
      await login.mutateAsync(values);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message.replace(/^\d+:\s*/, "") : "Login failed";
      setServerError(message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle size={16} className="text-red-500" />
          <AlertDescription className="text-sm text-red-600">{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          className="bg-zinc-50 focus:border-brand-gold focus:ring-brand-gold/20"
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
          className="bg-zinc-50 focus:border-brand-gold focus:ring-brand-gold/20"
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="brand"
        disabled={login.isPending}
        className="mt-2 w-full"
      >
        {login.isPending ? (
          <HookLoader size="button" label="Signing in..." />
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
