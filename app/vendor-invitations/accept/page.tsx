"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Link2, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HookLoader } from "@/components/shared/HookLoader";

function VendorInvitationAcceptForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function accept(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setState("error");
    setState("saving");
    try {
      await apiRequest(`/public/vendor-invitations/${encodeURIComponent(token)}/accept`, { method: "POST", body: JSON.stringify({ contactName: contactName.trim() || undefined, phone: phone.trim() || undefined, email: email.trim() || undefined }) }, { auth: false, retryOnUnauthorized: false });
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "This invitation could not be accepted");
      setState("error");
    }
  }

  return <main className="grid min-h-screen place-items-center bg-muted/30 p-4"><Card className="w-full max-w-lg rounded-2xl shadow-sm"><CardHeader className="space-y-4 p-6 sm:p-8"><div className="grid size-11 place-items-center rounded-xl bg-[#fff5c7] text-[#9a7600]"><Link2 className="size-5" /></div><div><CardTitle className="text-2xl">Confirm your Hook supplier profile</CardTitle><p className="mt-2 text-sm leading-6 text-muted-foreground">Review the contact details Hook uses to coordinate product sourcing with your Market Runner. This does not create a supplier login.</p></div></CardHeader><CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">{state === "success" ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 className="size-7" /><h2 className="mt-3 font-semibold">Profile confirmed</h2><p className="mt-1 text-sm leading-6">Your Market supplier record is now marked as consented. Hook will contact you through the details you provided.</p></div> : <form onSubmit={accept} className="space-y-4"><div className="space-y-2"><Label htmlFor="vendor-invite-name">Contact name</Label><Input id="vendor-invite-name" value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Your name" /></div><div className="space-y-2"><Label htmlFor="vendor-invite-phone">Phone number</Label><Input id="vendor-invite-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="080..." /></div><div className="space-y-2"><Label htmlFor="vendor-invite-email">Email <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="vendor-invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>{state === "error" ? <p className="text-sm text-destructive">{message || "This invitation link is missing or invalid."}</p> : null}<Button type="submit" variant="brand" className="w-full" disabled={state === "saving" || !token}>{state === "saving" ? <HookLoader size="button" /> : <><ShieldCheck className="size-4" /> Confirm supplier details</>}</Button></form>}</CardContent></Card></main>;
}

export default function VendorInvitationAcceptPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-muted/30 p-4"><HookLoader label="Loading invitation" /></main>}><VendorInvitationAcceptForm /></Suspense>;
}
