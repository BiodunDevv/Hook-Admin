"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Clock3, ExternalLink, LoaderCircle, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentProviderMark } from "@/components/payments/PaymentProviderMark";
import { publicPaymentRequest } from "@/lib/public-payment-api";

type PaymentDetail = {
  id: string;
  status: string;
  expiresAt: string;
  purpose: string;
  paidAt?: string;
  providers: Array<{ provider: "paystack" | "opay"; isDefault: boolean; mode: "test" | "live" }>;
  order: {
    id: string;
    reference: string;
    subtotalMinor: number;
    vatRate: number;
    vatMinor: number;
    deliveryFeeMinor: number;
    totalMinor: number;
    currency: string;
    items: Array<{ id: string; title: string; imageUrl?: string; quantity: number; selectedVariants?: Record<string, string> }>;
  };
};

type StatusAttempt = { provider: "paystack" | "opay"; status: string } | undefined;

function useCountdown(expiresAt: string | undefined) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const diffMs = target - Date.now();
      if (diffMs <= 0) {
        setLabel("Expired");
        return;
      }
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setLabel(hours > 0 ? `Expires in ${hours}h ${minutes}m` : `Expires in ${minutes}m`);
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  return label;
}

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value / 100);
}

function providerName(provider: "paystack" | "opay") {
  return provider === "opay" ? "OPay" : "Paystack";
}

function idempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return `web-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function PublicPaymentCheckout({ token, processing = false }: { token: string; processing?: boolean }) {
  const [detail, setDetail] = useState<PaymentDetail>();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<"paystack" | "opay">();
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<StatusAttempt>();
  const appReturn = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("appReturn") === "1";

  const load = useCallback(async () => {
    try {
      const data = await publicPaymentRequest<PaymentDetail>(`/public/payment-links/${encodeURIComponent(token)}`);
      setDetail(data);
      setSelected((current) => current || data.providers.find((provider) => provider.isDefault)?.provider || data.providers[0]?.provider);
      setError("");
      return data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This payment link is unavailable");
    }
  }, [token]);

  // Load the public checkout when the token changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!processing || detail?.status === "paid") return;
    const timer = window.setInterval(async () => {
      try {
        const status = await publicPaymentRequest<{ status: string; attempt?: StatusAttempt }>(`/public/payment-links/${encodeURIComponent(token)}/status`);
        setAttempt(status.attempt);
        if (status.status === "paid") await load();
      } catch { /* Keep polling while provider verification completes. */ }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [detail?.status, load, processing, token]);

  const paid = detail?.status === "paid";
  const attemptFailed = attempt?.status === "failed" || attempt?.status === "expired" || attempt?.status === "cancelled";
  const expiry = useMemo(() => detail ? new Date(detail.expiresAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "", [detail]);
  const countdown = useCountdown(detail?.expiresAt);

  async function pay() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const attempt = await publicPaymentRequest<{ authorizationUrl: string }>(`/public/payment-links/${encodeURIComponent(token)}/initialize`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
        body: JSON.stringify({ provider: selected, appReturn }),
      });
      window.location.assign(attempt.authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment could not start");
      setSubmitting(false);
    }
  }

  if (!detail && !error) return <PaymentShell><div className="flex min-h-80 items-center justify-center"><LoaderCircle className="animate-spin text-[#e6ad00]" size={30} /></div></PaymentShell>;
  if (!detail) return <PaymentShell><StatePanel icon={LockKeyhole} title="Payment link unavailable" description={error} action={<Button onClick={() => void load()}><RotateCcw /> Try again</Button>} /></PaymentShell>;
  if (paid) return (
    <PaymentShell>
      <StatePanel icon={Check} tone="success" title="Payment successful" description={`Payment for ${detail.order.reference} has been verified. Hook will now continue processing the Order.`} action={appReturn ? <Button onClick={() => window.location.assign(`hook://payments/return?status=success&orderId=${encodeURIComponent(detail.order.id)}`)}>Return to Hook <ExternalLink /></Button> : undefined} />
    </PaymentShell>
  );

  return (
    <PaymentShell>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7400]">{detail.purpose}</p>
            <h1 className="mt-2 text-2xl font-extrabold text-zinc-950 sm:text-3xl">Review and pay</h1>
            <p className="mt-1 text-sm text-zinc-500">Order {detail.order.reference}</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {detail.order.items.map((item) => (
              <div key={item.id} className="flex min-w-0 items-center gap-3 border-b border-zinc-100 p-3 last:border-b-0 sm:p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xs text-zinc-400">Hook</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">Quantity {item.quantity}</p>
                  {item.selectedVariants && <p className="mt-1 truncate text-xs text-zinc-400">{Object.values(item.selectedVariants).filter(Boolean).join(" · ")}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#f0d36c] bg-[#fff9df] p-3 text-sm text-[#705700]"><Clock3 size={17} /> Link available until {expiry}{countdown ? ` · ${countdown}` : ""}</div>
        </section>

        <aside className="min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          {processing && <div className="mb-4 flex items-center gap-2 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600"><LoaderCircle className="animate-spin" size={16} /> Waiting for verified payment confirmation</div>}
          {attemptFailed && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Your last attempt didn&apos;t go through. Choose a payment method and try again.</div>}
          {!detail.providers.length ? (
            <StatePanel icon={LockKeyhole} title="Payments unavailable" description="No payment provider is currently configured for this link. Please contact Hook support or try again shortly." />
          ) : (
            <>
              <h2 className="font-bold text-zinc-950">Choose how to pay</h2>
              <div className="mt-3 space-y-2">
                {detail.providers.map((provider) => (
                  <button key={provider.provider} type="button" onClick={() => setSelected(provider.provider)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${selected === provider.provider ? "border-black bg-zinc-950 text-white" : "border-zinc-200 hover:border-zinc-400"}`}>
                    <PaymentProviderMark provider={provider.provider} />
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{providerName(provider.provider)}</span><span className={`block text-xs ${selected === provider.provider ? "text-zinc-300" : "text-zinc-500"}`}>Secure hosted checkout</span></span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="my-5 space-y-2 border-y border-zinc-100 py-4 text-sm">
            <div className="flex justify-between text-zinc-500"><span>Products</span><span>{money(detail.order.subtotalMinor)}</span></div>
            <div className="flex justify-between text-zinc-500"><span>VAT{detail.order.vatRate ? ` (${detail.order.vatRate * 100}%)` : ""}</span><span>{money(detail.order.vatMinor)}</span></div>
            <div className="flex justify-between text-zinc-500"><span>Delivery</span><span>{money(detail.order.deliveryFeeMinor)}</span></div>
            <div className="flex justify-between pt-2 text-lg font-extrabold text-zinc-950"><span>Total</span><span>{money(detail.order.totalMinor)}</span></div>
          </div>
          {error && <p className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button className="h-12 w-full bg-[#ffc809] font-bold text-black hover:bg-[#eeb900]" disabled={!selected || !detail.providers.length || submitting} onClick={pay}>
            {submitting ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} Continue securely
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-zinc-400">Hook never marks a payment complete from this page alone. Your provider confirms it securely.</p>
        </aside>
      </div>
    </PaymentShell>
  );
}

function PaymentShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#f5f5f4] px-4 py-6 sm:px-6 sm:py-10"><div className="mx-auto w-full max-w-5xl"><div className="mb-6 text-3xl font-black tracking-tight">hook<span className="text-[#ffc809]">.</span></div>{children}<div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400"><LockKeyhole size={13} /> Secured by Hook</div></div></main>;
}

function StatePanel({ icon: Icon, title, description, action, tone = "neutral" }: { icon: typeof Check; title: string; description: string; action?: React.ReactNode; tone?: "neutral" | "success" }) {
  return <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm"><div className={`flex size-14 items-center justify-center rounded-full ${tone === "success" ? "bg-emerald-100 text-emerald-700" : "bg-[#fff3bf] text-[#9a7400]"}`}><Icon size={26} /></div><h1 className="mt-5 text-2xl font-extrabold">{title}</h1><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}
