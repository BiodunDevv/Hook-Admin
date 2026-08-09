"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Mail, MapPin, Phone, Power, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApiPatch, useApiQuery } from "@/lib/query";

interface CustomerDetail {
  id: string;
  publicId?: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  accountType?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  address?: Record<string, unknown>;
}

function dateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function cleanName(customer?: CustomerDetail) {
  return `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || customer?.email || "Customer";
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
}

function addressValue(address: Record<string, unknown> | undefined, keys: string[]) {
  const entry = keys.map((key) => address?.[key]).find((value) => value !== undefined && value !== null && String(value).trim());
  return entry ? String(entry) : "Not set";
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const query = useApiQuery<CustomerDetail>(["admin", "customers", id], `/admin/users/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/users/${id}/toggle`, ["admin", "customers"], { successMessage: "Customer status updated" });
  const customer = query.data;
  const name = cleanName(customer);
  const address = customer?.address;

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader title="Customer details" description="Review the customer identity, account access, and delivery profile." actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft /> Back to customers</Button>{customer ? <Button variant={customer.isActive ? "outline" : "brand"} size="sm" onClick={() => toggle.mutate(undefined)} disabled={toggle.isPending}><Power /> {customer.isActive ? "Suspend account" : "Activate account"}</Button> : null}</>} />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading customer details" errorTitle="Customer details unavailable" onRetry={() => query.refetch()}>
        {customer ? <>
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-5 bg-brand-gold px-5 py-6 text-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-8">
              <div className="flex min-w-0 items-center gap-4"><Avatar className="size-16 rounded-2xl ring-2 ring-zinc-950/10"><AvatarImage src={(customer as CustomerDetail & { avatarUrl?: string }).avatarUrl} alt={name} /><AvatarFallback className="rounded-2xl bg-zinc-950 text-lg font-bold text-brand-gold">{initials(name)}</AvatarFallback></Avatar><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-xl font-semibold sm:text-2xl">{name}</h2><StatusBadge status={customer.isActive ? "active" : "suspended"} className="border-zinc-950/15 bg-white/55 text-zinc-950" /></div><p className="mt-1 truncate text-sm text-zinc-800">{customer.email}</p><p className="mt-2 font-mono text-xs text-zinc-950">{customer.publicId || customer.id}</p></div></div>
              <div className="grid grid-cols-2 gap-5 text-sm sm:min-w-64"><div><p className="text-xs text-zinc-700">Account type</p><p className="mt-1 font-medium">{customer.accountType || "Customer"}</p></div><div><p className="text-xs text-zinc-700">Joined</p><p className="mt-1 font-medium">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-NG") : "Not available"}</p></div></div>
            </div>
            <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">{[["Email", customer.isEmailVerified ? "Verified" : "Unverified"], ["Phone", customer.phone || "Not set"], ["Last sign-in", customer.lastLoginAt ? dateTime(customer.lastLoginAt) : "Never"], ["Record updated", customer.updatedAt ? dateTime(customer.updatedAt) : "Not available"]].map(([label, value]) => <div key={label} className="min-w-0 px-5 py-4 sm:px-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p></div>)}</div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <div className="space-y-4">
              <DetailSection title="Identity and contact" description="The customer information used for account communication.">
                <DefinitionGrid items={[{ label: "Full name", value: name }, { label: "Email address", value: <span className="inline-flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{customer.email}</span> }, { label: "Phone number", value: customer.phone ? <span className="inline-flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{customer.phone}</span> : "Not set" }, { label: "Phone verification", value: <StatusBadge status={customer.isPhoneVerified ? "verified" : "pending"} /> }]} />
              </DetailSection>
              <DetailSection title="Delivery profile" description="The saved delivery information available to this customer.">
                <DefinitionGrid items={[{ label: "Address label", value: addressValue(address, ["label", "name"]) }, { label: "Recipient", value: addressValue(address, ["recipientName"]) }, { label: "Address", value: <span className="inline-flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{addressValue(address, ["formattedAddress", "line1", "address"])}</span>, span: 2 }, { label: "State", value: addressValue(address, ["stateName", "state"]) }, { label: "Local government", value: addressValue(address, ["localGovernmentArea", "localGovernmentAreaName"]) }]} />
              </DetailSection>
            </div>
            <div className="space-y-4">
              <DetailSection title="Account security" description="Verification and access checks for this customer."><div className="space-y-3"><SecurityRow icon={customer.isEmailVerified ? CheckCircle2 : ShieldCheck} label="Email verification" value={customer.isEmailVerified ? "Verified" : "Pending verification"} positive={customer.isEmailVerified} /><SecurityRow icon={customer.isPhoneVerified ? CheckCircle2 : ShieldCheck} label="Phone verification" value={customer.isPhoneVerified ? "Verified" : "Not verified"} positive={Boolean(customer.isPhoneVerified)} /><SecurityRow icon={customer.isActive ? CheckCircle2 : ShieldCheck} label="Sign-in access" value={customer.isActive ? "Enabled" : "Suspended"} positive={customer.isActive} /></div></DetailSection>
              <DetailSection title="Account activity" description="Recent lifecycle and authentication timestamps."><DefinitionGrid columns={1} items={[{ label: "Created", value: dateTime(customer.createdAt) }, { label: "Last sign-in", value: dateTime(customer.lastLoginAt) }, { label: "Last updated", value: dateTime(customer.updatedAt) }]} /></DetailSection>
            </div>
          </div>
        </> : null}
      </QueryState>
    </div>
  );
}

function SecurityRow({ icon: Icon, label, value, positive }: { icon: typeof CheckCircle2; label: string; value: string; positive: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"><span className={`grid size-8 place-items-center rounded-full ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p></div></div>;
}
