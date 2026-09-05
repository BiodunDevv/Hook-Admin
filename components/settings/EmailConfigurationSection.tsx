"use client";

import { useEffect, useState } from "react";
import { Mail, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { apiPatch } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type EmailSettings = {
  supportEmail: string;
  hookOpsEmail: string;
  brevoFromEmail: string;
  brevoFromName: string;
  appName: string;
  appUrl: string;
  updatedAt?: string;
};

const FIELDS: Array<{
  key: keyof Omit<EmailSettings, "updatedAt">;
  label: string;
  placeholder: string;
  hint: string;
  type?: string;
}> = [
  {
    key: "supportEmail",
    label: "Support email",
    placeholder: "support@hook.africa",
    hint: "Shown in the footer of every email Hook sends.",
    type: "email",
  },
  {
    key: "hookOpsEmail",
    label: "Operations email",
    placeholder: "ops@hook.africa",
    hint: "Receives internal new-order notifications.",
    type: "email",
  },
  {
    key: "brevoFromEmail",
    label: "Sender email",
    placeholder: "noreply@hook.africa",
    hint: "The address customers see emails come from. Must be verified in Brevo first.",
    type: "email",
  },
  {
    key: "brevoFromName",
    label: "Sender name",
    placeholder: "Hook",
    hint: "The display name shown next to the sender address.",
  },
  {
    key: "appName",
    label: "App name",
    placeholder: "Hook",
    hint: "Used in email copy wherever the product is named.",
  },
  {
    key: "appUrl",
    label: "App URL",
    placeholder: "https://hook.africa",
    hint: "Where email buttons and links point back to.",
    type: "url",
  },
];

const EMPTY: Omit<EmailSettings, "updatedAt"> = {
  supportEmail: "",
  hookOpsEmail: "",
  brevoFromEmail: "",
  brevoFromName: "",
  appName: "",
  appUrl: "",
};

export function EmailConfigurationSection() {
  const query = useApiQuery<EmailSettings>(["settings", "email"], "/admin/settings/email");
  const [form, setForm] = useState(EMPTY);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep the editable draft aligned with the server response.
  useEffect(() => {
    if (query.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        supportEmail: query.data.supportEmail || "",
        hookOpsEmail: query.data.hookOpsEmail || "",
        brevoFromEmail: query.data.brevoFromEmail || "",
        brevoFromName: query.data.brevoFromName || "",
        appName: query.data.appName || "",
        appUrl: query.data.appUrl || "",
      });
    }
  }, [query.data]);

  async function save() {
    if (reason.trim().length < 5) return toast.error("Add a short audit reason");
    setSaving(true);
    try {
      // Only send fields the admin actually filled in — blank fields stay unset
      // so the server keeps falling back to its environment configuration.
      const payload: Record<string, string> = { reason: reason.trim() };
      for (const field of FIELDS) {
        const value = form[field.key].trim();
        if (value) payload[field.key] = value;
      }
      await apiPatch("/admin/settings/email", payload);
      toast.success("Email configuration updated");
      setReason("");
      await query.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not update email configuration",
      );
    } finally {
      setSaving(false);
    }
  }

  if (query.isLoading)
    return (
      <div className="grid min-h-60 place-items-center">
        <HookLoader label="Loading email configuration" />
      </div>
    );
  if (query.isError)
    return (
      <QueryState
        error={query.error}
        errorTitle="Email configuration could not load"
        onRetry={() => void query.refetch()}
      />
    );

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="size-5 text-brand-gold" /> Email configuration
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Addresses and naming used across every email Hook sends. Changes apply immediately —
          no redeploy needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`email-${field.key}`}>{field.label}</Label>
              <Input
                id={`email-${field.key}`}
                type={field.type || "text"}
                value={form[field.key]}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder={field.placeholder}
              />
              <p className="text-xs leading-5 text-zinc-500">{field.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Leave a field blank to keep using the server&apos;s environment configuration. The Brevo
            API key is a secret and is never editable here.
          </span>
        </div>

        <div className="grid gap-4 rounded-lg border bg-zinc-50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="email-settings-reason">Audit reason</Label>
            <Input
              id="email-settings-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why is the email configuration changing?"
            />
          </div>
          <Button variant="brand" disabled={saving} onClick={() => void save()}>
            {saving ? <HookLoader size="button" /> : <><Save /> Save configuration</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
