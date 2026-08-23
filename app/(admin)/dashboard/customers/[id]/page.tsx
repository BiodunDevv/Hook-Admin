"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Power,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QueryState } from "@/components/shared/QueryState";
import { DetailSection } from "@/components/shared/DetailSection";
import { DefinitionGrid } from "@/components/shared/DefinitionGrid";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPost } from "@/lib/api";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import { useAdminSession, useApiPatch, useApiQuery } from "@/lib/query";

interface CustomerAddress {
  publicId?: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  formattedAddress?: string;
  line1?: string;
  stateName?: string;
  cityName?: string;
  localGovernmentArea?: string;
  isDefault?: boolean;
}

interface RecentOrder {
  publicId?: string;
  orderCode?: string;
  totalMinor?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
}

interface CustomerDetail {
  id: string;
  publicId?: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  accountType?: string;
  accountStatus?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  defaultAddress?: CustomerAddress | null;
  totalSpentMinor?: number;
  orderCount?: number;
  recentOrders?: RecentOrder[];
}

function dateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

function money(minor?: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(minor || 0) / 100);
}

function cleanName(customer?: CustomerDetail) {
  return `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || customer?.email || "Customer";
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
}

function cleanError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: admin } = useAdminSession();
  const query = useApiQuery<CustomerDetail>(["admin", "customers", id], `/admin/users/${id}`, Boolean(id));
  const toggle = useApiPatch<{ id: string; isActive: boolean }, undefined>(`/admin/users/${id}/toggle`, ["admin", "customers", id], { successMessage: "Customer status updated" });
  const customer = query.data;
  const name = cleanName(customer);
  const address = customer?.defaultAddress;
  const canEdit = hasPermission(admin, "customers.edit");
  const canHardDelete = isSuperAdmin(admin);

  const [softDeleteOpen, setSoftDeleteOpen] = useState(false);
  const [softDeleteReason, setSoftDeleteReason] = useState("");
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);
  const [hardDeleteReason, setHardDeleteReason] = useState("");
  const [hardDeleteConfirmation, setHardDeleteConfirmation] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const deletionIdentifier = customer?.publicId || customer?.id || "";
  const expectedConfirmation = `DELETE ${deletionIdentifier}`;
  const isDeleted = customer?.accountStatus === "deletion_requested";

  async function softDelete() {
    if (softDeleteReason.trim().length < 3) return toast.error("Add a reason for this deletion");
    setActionPending(true);
    try {
      await apiPost(`/admin/users/${id}/soft-delete`, { reason: softDeleteReason.trim() });
      toast.success("Customer account deleted (soft delete)");
      setSoftDeleteOpen(false);
      setSoftDeleteReason("");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to delete customer account"));
    } finally {
      setActionPending(false);
    }
  }

  async function restore() {
    setActionPending(true);
    try {
      await apiPost(`/admin/users/${id}/restore`, {});
      toast.success("Customer account restored");
      await query.refetch();
    } catch (error) {
      toast.error(cleanError(error, "Unable to restore customer account"));
    } finally {
      setActionPending(false);
    }
  }

  async function hardDelete() {
    if (hardDeleteReason.trim().length < 3) return toast.error("Add a reason for this permanent deletion");
    if (hardDeleteConfirmation.trim() !== expectedConfirmation) {
      return toast.error(`Type "${expectedConfirmation}" exactly to confirm`);
    }
    setActionPending(true);
    try {
      await apiPost(`/admin/users/${id}/hard-delete`, {
        reason: hardDeleteReason.trim(),
        confirmation: hardDeleteConfirmation.trim(),
      });
      toast.success("Customer account permanently deleted");
      setHardDeleteOpen(false);
      setHardDeleteReason("");
      setHardDeleteConfirmation("");
      // The account no longer exists — refetching this page would 404.
      router.push("/dashboard/customers");
    } catch (error) {
      toast.error(cleanError(error, "Unable to permanently delete customer account"));
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="w-full space-y-5 px-4 py-5">
      <PageHeader
        title="Customer details"
        description="Review the customer identity, account access, delivery profile, and order history."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft /> Back to customers</Button>
            {customer && canEdit ? (
              <Button variant={customer.isActive ? "outline" : "brand"} size="sm" onClick={() => toggle.mutate(undefined)} disabled={toggle.isPending}>
                <Power /> {customer.isActive ? "Suspend account" : "Activate account"}
              </Button>
            ) : null}
          </>
        }
      />
      <QueryState loading={query.isLoading} error={query.error} loadingLabel="Loading customer details" errorTitle="Customer details unavailable" onRetry={() => query.refetch()}>
        {customer ? <>
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-5 bg-brand-gold px-5 py-6 text-zinc-950 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-8">
              <div className="flex min-w-0 items-center gap-4"><Avatar className="size-16 rounded-2xl ring-2 ring-zinc-950/10"><AvatarImage src={(customer as CustomerDetail & { avatarUrl?: string }).avatarUrl} alt={name} /><AvatarFallback className="rounded-2xl bg-zinc-950 text-lg font-bold text-brand-gold">{initials(name)}</AvatarFallback></Avatar><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-xl font-semibold sm:text-2xl">{name}</h2><StatusBadge status={isDeleted ? customer.accountStatus || "deleted" : customer.isActive ? "active" : "suspended"} className="border-zinc-950/15 bg-white/55 text-zinc-950" /></div><p className="mt-1 truncate text-sm text-zinc-800">{customer.email}</p><p className="mt-2 font-mono text-xs text-zinc-950">{customer.publicId || customer.id}</p></div></div>
              <div className="grid grid-cols-2 gap-5 text-sm sm:min-w-64"><div><p className="text-xs text-zinc-700">Account type</p><p className="mt-1 font-medium">{customer.accountType || "Customer"}</p></div><div><p className="text-xs text-zinc-700">Joined</p><p className="mt-1 font-medium">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-NG") : "Not available"}</p></div></div>
            </div>
            <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">{[["Email", customer.isEmailVerified ? "Verified" : "Unverified"], ["Phone", customer.phone || address?.phone || "Not set"], ["Total spent", money(customer.totalSpentMinor)], ["Orders placed", String(customer.orderCount || 0)]].map(([label, value]) => <div key={label} className="min-w-0 px-5 py-4 sm:px-6"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p></div>)}</div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <div className="space-y-4">
              <DetailSection title="Identity and contact" description="The customer information used for account communication.">
                <DefinitionGrid items={[
                  { label: "Full name", value: name },
                  { label: "Email address", value: <span className="inline-flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{customer.email}</span> },
                  { label: "Phone number", value: customer.phone || address?.phone ? <span className="inline-flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{customer.phone || address?.phone}{!customer.phone && address?.phone ? <span className="text-xs text-muted-foreground">(from delivery address)</span> : null}</span> : "Not set" },
                ]} />
              </DetailSection>

              <DetailSection title="Default delivery address" description="The address this customer uses by default at checkout.">
                {address ? (
                  <DefinitionGrid items={[
                    { label: "Recipient", value: address.recipientName || "Not set" },
                    { label: "Phone", value: address.phone || "Not set" },
                    { label: "Address", value: <span className="inline-flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{address.formattedAddress || address.line1 || "Not set"}</span>, span: 2 },
                    { label: "State", value: address.stateName || "Not set" },
                    { label: "Local government", value: address.localGovernmentArea || "Not set" },
                  ]} />
                ) : (
                  <p className="text-sm text-muted-foreground">This customer has not saved a delivery address yet.</p>
                )}
              </DetailSection>

              <DetailSection
                title="Recent orders"
                description="The most recent orders placed by this customer. Click through for full order details."
                action={<Link href={`/dashboard/orders?search=${encodeURIComponent(customer.email)}`} className="text-xs font-medium text-primary hover:underline">View all</Link>}
              >
                {customer.recentOrders?.length ? (
                  <div className="space-y-2">
                    {customer.recentOrders.map((order) => (
                      <Link
                        key={order.publicId}
                        href={`/dashboard/orders/${order.publicId}`}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><ShoppingBag className="size-4" /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{order.orderCode || order.publicId}</p>
                            <p className="text-xs text-muted-foreground">{dateTime(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <p className="text-sm font-semibold text-foreground">{money(order.totalMinor)}</p>
                          <StatusBadge status={order.status || "pending"} />
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">This customer has not placed any orders yet.</p>}
              </DetailSection>
            </div>
            <div className="space-y-4">
              <DetailSection title="Account security" description="Verification and access checks for this customer."><div className="space-y-3"><SecurityRow icon={customer.isEmailVerified ? CheckCircle2 : ShieldCheck} label="Email verification" value={customer.isEmailVerified ? "Verified" : "Pending verification"} positive={customer.isEmailVerified} /><SecurityRow icon={customer.isActive ? CheckCircle2 : ShieldCheck} label="Sign-in access" value={customer.isActive ? "Enabled" : "Suspended"} positive={customer.isActive} /></div></DetailSection>
              <DetailSection title="Account activity" description="Recent lifecycle and authentication timestamps."><DefinitionGrid columns={1} items={[{ label: "Created", value: dateTime(customer.createdAt) }, { label: "Last sign-in", value: dateTime(customer.lastLoginAt) }, { label: "Last updated", value: dateTime(customer.updatedAt) }]} /></DetailSection>

              {canEdit ? (
                <DetailSection title="Danger zone" description="Deleting a customer account is a serious action. Soft delete can be reversed; permanent deletion cannot.">
                  <div className="space-y-3">
                    {isDeleted ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        This account is deleted. It can be restored.
                      </div>
                    ) : null}
                    {isDeleted ? (
                      <Button variant="outline" className="w-full justify-center" onClick={() => void restore()} disabled={actionPending}>
                        <RotateCcw /> Restore account
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full justify-center text-destructive hover:text-destructive" onClick={() => setSoftDeleteOpen(true)}>
                        <Trash2 /> Delete account (soft)
                      </Button>
                    )}
                    {canHardDelete ? (
                      <Button variant="destructive" className="w-full justify-center" onClick={() => setHardDeleteOpen(true)}>
                        <Trash2 /> Permanently delete
                      </Button>
                    ) : null}
                  </div>
                </DetailSection>
              ) : null}
            </div>
          </div>
        </> : null}
      </QueryState>

      <Dialog open={softDeleteOpen} onOpenChange={(open) => { if (!open && !actionPending) { setSoftDeleteOpen(false); setSoftDeleteReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this customer account?</DialogTitle>
            <DialogDescription>The account will be deactivated and hidden from active use, but all data is kept and this can be reversed later with Restore.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="soft-delete-reason">Reason</Label>
            <Textarea id="soft-delete-reason" value={softDeleteReason} onChange={(event) => setSoftDeleteReason(event.target.value)} placeholder="Why is this account being deleted?" maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoftDeleteOpen(false)} disabled={actionPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => void softDelete()} disabled={actionPending || softDeleteReason.trim().length < 3}>{actionPending ? "Deleting…" : "Delete account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={hardDeleteOpen} onOpenChange={(open) => { if (!open && !actionPending) { setHardDeleteOpen(false); setHardDeleteReason(""); setHardDeleteConfirmation(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete this customer?</DialogTitle>
            <DialogDescription>
              This cannot be undone. The customer&apos;s account and saved addresses will be removed from the database entirely. Past orders keep their own record of the customer&apos;s details at the time of purchase, so order history is unaffected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="hard-delete-reason">Reason</Label>
              <Textarea id="hard-delete-reason" value={hardDeleteReason} onChange={(event) => setHardDeleteReason(event.target.value)} placeholder="Why is this account being permanently deleted?" maxLength={500} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hard-delete-confirmation">
                Type <span className="font-mono font-semibold text-foreground">{expectedConfirmation}</span> to confirm
              </Label>
              <Input id="hard-delete-confirmation" value={hardDeleteConfirmation} onChange={(event) => setHardDeleteConfirmation(event.target.value)} placeholder={expectedConfirmation} autoComplete="off" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHardDeleteOpen(false)} disabled={actionPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => void hardDelete()} disabled={actionPending || hardDeleteReason.trim().length < 3 || hardDeleteConfirmation.trim() !== expectedConfirmation}>
              {actionPending ? "Deleting…" : "Permanently delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecurityRow({ icon: Icon, label, value, positive }: { icon: typeof CheckCircle2; label: string; value: string; positive: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3"><span className={`grid size-8 place-items-center rounded-full ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p></div></div>;
}
