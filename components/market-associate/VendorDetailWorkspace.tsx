"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Copy,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { HookLoader } from "@/components/shared/HookLoader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  MobileButton,
  MobileEmpty,
  MobileRow,
  MobileSection,
} from "@/components/mobile/MobileUI";
import { MarketVendorSheet, type VendorFormValue } from "@/components/market-associate/MarketVendorSheet";
import { useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { money } from "@/lib/admin-utils";

type Vendor = VendorFormValue & {
  publicId: string;
  marketId?: string;
  status?: string;
  createdAt?: string;
  consentAt?: string | null;
  paymentProfile?: {
    method?: string;
    bankName?: string | null;
    accountName?: string | null;
    accountNumberLast4?: string | null;
    verificationStatus?: string;
  };
};

type Collection = {
  publicId?: string;
  status?: string;
  totalMinor?: number;
  amountMinor?: number;
  createdAt?: string;
};

type Invitation = {
  publicId: string;
  status: string;
  expiresAt?: string;
  acceptedAt?: string | null;
  createdAt?: string;
};

type VendorDetail = {
  vendor: Vendor;
  collections?: Collection[];
  invitations?: Invitation[];
};

export function VendorDetailWorkspace({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const query = useApiQuery<VendorDetail>(["marketassociate", "market-vendor", vendorId], `/market-associate/market-vendors/${vendorId}`);

  async function resendInvite() {
    setInviting(true);
    try {
      const result = await apiPost<{ inviteUrl: string; expiresAt: string }>(
        `/market-associate/market-vendors/${vendorId}/invite`,
        {},
      );
      await queryClient.invalidateQueries({ queryKey: ["marketassociate", "market-vendor", vendorId] });
      try {
        await navigator.clipboard.writeText(result.inviteUrl);
        toast.success("New invite link copied to clipboard");
      } catch {
        toast.success("New invitation sent");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not resend the invitation",
      );
    } finally {
      setInviting(false);
    }
  }

  if (query.isLoading)
    return (
      <div className="grid min-h-80 place-items-center">
        <HookLoader label="Loading supplier" />
      </div>
    );
  if (query.isError || !query.data)
    return <p className="text-sm text-destructive">This supplier could not be loaded.</p>;

  const { vendor, collections = [], invitations = [] } = query.data;
  const payment = vendor.paymentProfile;
  const pendingInvite = invitations.find((invitation) => invitation.status === "pending");

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#8F8F8F]"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="mb-7 flex items-start gap-3 px-1">
        <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-[#FFF2B8] text-[19px] font-black">
          {(vendor.businessName || "?").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-bold leading-tight text-black">{vendor.businessName}</h1>
          <p className="mt-1 truncate text-[14px] text-[#8F8F8F]">{vendor.contactName}</p>
          <div className="mt-2">
            <StatusBadge status={vendor.status || "pending"} />
          </div>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-3 gap-2">
        <QuickAction icon={Phone} label="Call" href={vendor.phone ? `tel:${vendor.phone}` : undefined} />
        <QuickAction
          icon={MessageCircle}
          label="WhatsApp"
          href={vendor.phone ? `https://wa.me/${vendor.phone.replace(/\D/g, "")}` : undefined}
        />
        <QuickAction icon={Pencil} label="Edit" onClick={() => setEditing(true)} />
      </div>

      <MobileSection title="Contact">
        <MobileRow icon={Phone} label="Phone" tone="neutral" description={vendor.phone} />
        {vendor.email && <MobileRow icon={Mail} label="Email" tone="neutral" description={vendor.email} />}
        {vendor.address && <MobileRow icon={MapPin} label="Stall / address" tone="neutral" description={vendor.address} />}
        <MobileRow
          icon={MessageCircle}
          label="Preferred contact"
          tone="neutral"
          value={<span className="capitalize">{vendor.preferredContactChannel || "phone"}</span>}
        />
      </MobileSection>

      <MobileSection title="Payment profile">
        <MobileRow
          icon={payment?.method === "bank_transfer" ? Landmark : Banknote}
          label="Method"
          value={<span className="capitalize">{(payment?.method || "cash").replaceAll("_", " ")}</span>}
        />
        {payment?.bankName && <MobileRow icon={Landmark} label="Bank" tone="neutral" value={payment.bankName} />}
        {payment?.accountName && <MobileRow icon={Landmark} label="Account name" tone="neutral" value={payment.accountName} />}
        {payment?.accountNumberLast4 && (
          <MobileRow icon={ShieldCheck} label="Account number" tone="neutral" value={`•••• ${payment.accountNumberLast4}`} />
        )}
        <MobileRow
          icon={ShieldCheck}
          label="Verification"
          tone="neutral"
          value={<span className="capitalize">{payment?.verificationStatus || "unverified"}</span>}
        />
      </MobileSection>

      <MobileSection
        title="Invitations"
        action={
          <button
            type="button"
            onClick={() => void resendInvite()}
            disabled={inviting}
            className="flex items-center gap-1 text-[13px] font-semibold text-[#9a7400] disabled:opacity-50"
          >
            {inviting ? <HookLoader size="button" /> : <><Send size={13} /> Resend</>}
          </button>
        }
      >
        {invitations.length ? (
          invitations.slice(0, 5).map((invitation) => (
            <MobileRow
              key={invitation.publicId}
              icon={invitation.status === "accepted" ? ShieldCheck : Send}
              tone={invitation.status === "accepted" ? "brand" : "neutral"}
              label={invitation.status === "accepted" ? "Accepted" : `Invitation ${invitation.status}`}
              description={
                invitation.acceptedAt
                  ? new Date(invitation.acceptedAt).toLocaleDateString("en-NG")
                  : invitation.expiresAt
                    ? `Expires ${new Date(invitation.expiresAt).toLocaleDateString("en-NG")}`
                    : undefined
              }
            />
          ))
        ) : (
          <MobileRow icon={Send} tone="neutral" label="No invitations yet" />
        )}
      </MobileSection>

      <MobileSection title="Your collections">
        {collections.length ? (
          collections.slice(0, 8).map((collection) => (
            <MobileRow
              key={collection.publicId}
              icon={Package}
              tone="neutral"
              label={collection.publicId || "Collection"}
              description={collection.createdAt ? new Date(collection.createdAt).toLocaleDateString("en-NG") : undefined}
              value={money(collection.totalMinor ?? collection.amountMinor)}
            />
          ))
        ) : (
          <div className="py-2">
            <MobileEmpty icon={Package} title="No collections yet" description="Collections you record from this supplier appear here." />
          </div>
        )}
      </MobileSection>

      {pendingInvite && (
        <MobileButton variant="outline" onClick={() => void resendInvite()} disabled={inviting}>
          <Copy size={17} /> Copy a fresh invite link
        </MobileButton>
      )}

      <MarketVendorSheet
        key={editing ? `edit-${vendor.publicId}` : "edit-closed"}
        marketId={vendor.marketId || ""}
        marketName={vendor.businessName || "this Market"}
        vendor={vendor}
        open={editing}
        onClose={() => setEditing(false)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["marketassociate", "market-vendor", vendorId] });
          void queryClient.invalidateQueries({ queryKey: ["marketassociate", "market"] });
        }}
      />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="mb-1.5 grid size-10 place-items-center rounded-full bg-[#FFC809]">
        <Icon size={18} className="text-black" />
      </span>
      <span className="text-[12px] font-semibold text-black">{label}</span>
    </>
  );
  const className =
    "flex flex-col items-center rounded-[10px] bg-white py-3.5 transition active:bg-black/3 disabled:opacity-40";
  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={className}>
      {content}
    </button>
  );
}
