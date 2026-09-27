"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, HelpCircle, LifeBuoy, Mail, MessageCircle, Package, ShieldCheck, Timer } from "lucide-react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { HookLogo } from "@/components/shared/HookLogo";
import { MobileButton, MobileHeader, MobileRow, MobileSection } from "@/components/mobile/MobileUI";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/lib/query";

type SupportContact = { supportEmail?: string; supportUrl?: string };
type PublicFaq = { id: string; question: string; answer: string };

// Shown only if the admin hasn't added any FAQs yet, so the page never looks empty.
const DEFAULT_FAQS: PublicFaq[] = [
  { id: "default-1", question: "Where is my order?", answer: "Open Orders in the Hook app and tap the order for live status. Delivery times shown at checkout are estimates and can shift with traffic or stock changes." },
  { id: "default-2", question: "How do refunds work?", answer: "Refunds are issued to the original payment method or as Hook credit, depending on the order. Most refunds are processed within 3-5 business days once approved." },
  { id: "default-3", question: "How do I change or cancel an order?", answer: "Orders can be changed or cancelled before a Market Associate confirms sourcing. Contact support with your order number as soon as possible." },
  { id: "default-4", question: "How do I delete my account?", answer: "Go to Profile > Delete account in the Hook app. You can cancel the request any time during the cooling-off period before it takes effect." },
];

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#D9D9D9] last:border-b-0">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 px-3 py-3.5 text-left">
        <span className="text-[14px] font-semibold text-black">{question}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#A3A3A6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <p className="px-3 pb-3.5 text-[13px] leading-5 text-[#6B6B6E]">{answer}</p> : null}
    </div>
  );
}

function HelpPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("order") || "";
  const [orderInput, setOrderInput] = useState(orderId);
  const support = useApiQuery<SupportContact>(["public-support"], "/public/support");
  const supportEmail = support.data?.supportEmail || "support@hook.africa";
  const faqsQuery = useApiQuery<PublicFaq[]>(["public-faqs"], "/public/faqs");
  const faqs = faqsQuery.data?.length ? faqsQuery.data : DEFAULT_FAQS;

  const mailtoHref = useMemo(() => {
    const subject = orderInput ? `Order ${orderInput}` : "Help & Support";
    const body = orderInput ? `Hi Hook team,\n\nI need help with order ${orderInput}.\n\n` : "";
    return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [orderInput, supportEmail]);

  return (
    <main className="min-h-dvh bg-[#F5F5F5] lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="relative flex min-h-dvh justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md pb-16 lg:max-w-xl lg:pt-6">
          <div className="mb-6 flex justify-center lg:justify-start"><HookLogo className="text-2xl text-black" compact /></div>
          <MobileHeader title="Help & Support" subtitle="We're here to help with orders, accounts, and anything else on Hook." />

          <MobileSection title="Contact an order">
            <div className="space-y-2.5 p-3">
              <Label htmlFor="help-order-id" className="text-[13px] text-[#6B6B6E]">Order number (optional)</Label>
              <Input id="help-order-id" value={orderInput} onChange={(event) => setOrderInput(event.target.value)} placeholder="e.g. ORD-2H8K3" className="h-11 rounded-[10px]" />
            </div>
          </MobileSection>

          <MobileSection title="Get in touch">
            <MobileRow icon={Mail} label="Email support" description={supportEmail} href={mailtoHref} />
            <MobileRow icon={Package} label="Track an order" description="Open the Hook app" href="hook://orders" />
          </MobileSection>

          <MobileSection title="Frequently asked questions">
            <div className="px-0.5">
              {faqs.map((faq) => <FaqRow key={faq.id} question={faq.question} answer={faq.answer} />)}
            </div>
          </MobileSection>

          <MobileButton href={mailtoHref} className="mt-2"><Mail size={18} /> Contact support</MobileButton>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-[#A0A0A3] lg:justify-start">
            <MessageCircle size={13} /> Usually replies within a few hours
          </div>
        </div>
      </section>

      <aside className="sticky top-0 hidden h-dvh flex-col justify-between overflow-hidden border-l border-white/10 bg-zinc-950 p-10 text-white lg:flex">
        <FlickeringGrid className="absolute inset-0 z-0" squareSize={4} gridGap={6} color="#FFC809" maxOpacity={0.35} flickerChance={0.12} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 bg-linear-to-b from-brand-gold/10 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-zinc-950/0 via-zinc-950/40 to-zinc-950/95" />

        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-brand-gold">Hook support</p>
          <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-balance">You&apos;re never far from a real answer.</h2>
          <p className="text-base leading-7 text-zinc-400">The same team behind Hook reads every message here — customers, Market Associates, and Hook Partners all reach us through this one page.</p>
        </div>

        <div className="relative z-10 space-y-4">
          <ul className="grid grid-cols-3 gap-3">
            {[
              { icon: Timer, label: "Fast replies" },
              { icon: ShieldCheck, label: "Order help" },
              { icon: LifeBuoy, label: "Account help" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-4 text-center">
                <Icon className="size-5 text-brand-gold" />
                <span className="text-xs font-medium text-zinc-300">{label}</span>
              </li>
            ))}
          </ul>
          <p className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-500">
            <span className="size-1.5 rounded-full bg-brand-gold" />
            One help center for every Hook client
          </p>
        </div>
      </aside>
    </main>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#F5F5F5]"><HelpCircle className="animate-pulse text-[#D9D9D9]" /></div>}>
      <HelpPageContent />
    </Suspense>
  );
}
