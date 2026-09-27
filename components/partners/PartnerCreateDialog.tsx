"use client";

import { useMemo, useState } from "react";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { Button } from "@/components/ui/button";
import { HookLoader } from "@/components/shared/HookLoader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RelatedSelect, type DirectoryField } from "@/components/platform/PlatformDirectoryPage";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

const stateField: DirectoryField = { key: "stateId", label: "Operation state", type: "select", optionsEndpoint: "/admin/states" };

type RelationRef = { publicId?: string; _id?: string } | string | undefined;
type MarketOption = { id?: string; publicId?: string; name?: string; status?: string; stateId?: RelationRef; cityId?: RelationRef };
type MarketResponse = MarketOption[] | { data?: MarketOption[] };

// /admin/markets resolves stateId/cityId to the full related record, not a plain id string.
function relationId(ref: RelationRef): string {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref.publicId || ref._id || "";
}

type Values = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stateId: string;
  marketId: string;
  address: string;
};

const empty: Values = { name: "", firstName: "", lastName: "", email: "", phone: "", stateId: "", marketId: "", address: "" };

function cleanError(error: unknown) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to create this Hook Partner location";
}

// Invites a Hook Partner: pick a State, then a Market — City is derived from the Market.
export function PartnerCreateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => Promise<unknown> | unknown }) {
  const [values, setValues] = useState<Values>(empty);
  const [saving, setSaving] = useState(false);

  const marketsQuery = useApiQuery<MarketResponse>(["admin", "markets", "for-partner-create"], "/admin/markets?limit=200", open && Boolean(values.stateId));
  const eligibleMarkets = useMemo(() => {
    const rows = Array.isArray(marketsQuery.data) ? marketsQuery.data : marketsQuery.data?.data || [];
    return rows.filter((market) => market.status === "active" && relationId(market.stateId) === values.stateId);
  }, [marketsQuery.data, values.stateId]);
  const selectedMarket = eligibleMarkets.find((market) => (market.publicId || market.id) === values.marketId);

  function update<Key extends keyof Values>(key: Key, value: Values[Key]) {
    setValues((current) => ({ ...current, [key]: value, ...(key === "stateId" ? { marketId: "" } : {}) }));
  }

  function reset() {
    setValues(empty);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.name.trim().length < 2) return toast.error("Add the Partner location's name");
    if (!values.firstName.trim() || !values.lastName.trim()) return toast.error("Add a contact first and last name");
    if (!values.email.trim()) return toast.error("Add a contact email");
    if (values.phone.trim().length < 7) return toast.error("Add a valid contact phone number");
    if (!values.stateId || !values.marketId) return toast.error("Select the operation state and Market");
    const cityId = relationId(selectedMarket?.cityId);
    if (!cityId) return toast.error("The selected Market has no City on record — pick another Market");
    if (values.address.trim().length < 5) return toast.error("Add the location's address");
    setSaving(true);
    try {
      await apiPost("/admin/partners", {
        name: values.name.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        stateId: values.stateId,
        cityId,
        marketId: values.marketId,
        address: values.address.trim(),
        contact: { phone: values.phone.trim() },
      });
      toast.success("Hook Partner invited successfully");
      reset();
      onClose();
      await onSuccess();
    } catch (error) {
      toast.error(cleanError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminWorkflowSheet
      open={open}
      onOpenChange={(nextOpen) => { if (!nextOpen && !saving) { reset(); onClose(); } }}
      title="Invite a Hook Partner"
      description="Add a new authenticated drop-off and assisted-checkout location. They receive an activation email once created."
      footer={<><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="partner-create-form" variant="brand" disabled={saving}>{saving ? <HookLoader size="button" /> : <><Store /> Invite Partner</>}</Button></>}
    >
      <form id="partner-create-form" onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="partner-name">Partner location name</Label><Input id="partner-name" value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Balogun Market Stall 12" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="partner-first-name">Contact first name</Label><Input id="partner-first-name" value={values.firstName} onChange={(event) => update("firstName", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="partner-last-name">Contact last name</Label><Input id="partner-last-name" value={values.lastName} onChange={(event) => update("lastName", event.target.value)} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="partner-email">Email</Label><Input id="partner-email" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="partner-phone">Phone</Label><Input id="partner-phone" value={values.phone} onChange={(event) => update("phone", event.target.value)} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="partner-state">Operation state</Label><RelatedSelect field={stateField} value={values.stateId} values={values} onChange={(value) => update("stateId", value)} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="partner-market">Market</Label>
            <Select value={values.marketId} onValueChange={(value) => update("marketId", value)} disabled={!values.stateId || marketsQuery.isLoading}>
              <SelectTrigger id="partner-market" className="w-full">
                <SelectValue placeholder={!values.stateId ? "Select a state first" : marketsQuery.isLoading ? "Loading markets..." : "Select market"} />
              </SelectTrigger>
              <SelectContent>
                {eligibleMarkets.map((market) => {
                  const id = market.publicId || market.id || "";
                  return <SelectItem key={id} value={id}>{market.name}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            {values.stateId && !marketsQuery.isLoading && !eligibleMarkets.length ? <p className="text-xs text-muted-foreground">No active Markets in this state yet.</p> : null}
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="partner-address">Address</Label><Textarea id="partner-address" value={values.address} onChange={(event) => update("address", event.target.value)} placeholder="Street, landmark, and any directions" rows={3} /></div>
      </form>
    </AdminWorkflowSheet>
  );
}
