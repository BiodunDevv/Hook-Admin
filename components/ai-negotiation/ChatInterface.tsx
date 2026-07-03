import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Bot, XCircle, MessageCircle, Check } from "lucide-react";

export function ChatInterface() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Chat Header */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=100&q=80"
            alt="Jacket"
            className="h-12 w-12 rounded-lg border border-zinc-200 object-cover"
          />
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-lg font-bold leading-tight text-zinc-900">Vintage YSL Jacket</h2>
              <Badge variant="outline" className="flex items-center gap-1 rounded-full border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                <AlertCircle size={10} /> Human Escalation
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 font-medium text-zinc-600">
                <img
                  src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=100&q=80"
                  alt="User"
                  className="h-4 w-4 rounded-full"
                />
                Ibrahim S.
              </div>
              <div className="h-3 w-px bg-zinc-300" />
              <div className="text-zinc-500">
                List Price: <span className="font-semibold text-zinc-900">₦45,000</span>
              </div>
              <div className="h-3 w-px bg-zinc-300" />
              <div className="text-zinc-500">
                Floor: <span className="font-semibold text-red-600">₦32,000</span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">View Product</Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 bg-zinc-50 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500">
              Negotiation started today at 10:14 AM
            </span>
          </div>

          {/* User Message 1 */}
          <div className="flex w-[85%] items-end gap-3">
            <img
              src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=100&q=80"
              alt="User"
              className="h-8 w-8 shrink-0 rounded-full shadow-sm"
            />
            <div className="flex flex-col items-start gap-1">
              <span className="ml-1 text-xs font-medium text-zinc-500">
                Ibrahim S. <span className="font-normal text-zinc-400">10:14 AM</span>
              </span>
              <div className="rounded-2xl rounded-bl-none border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800 shadow-sm">
                Hi, I really like this jacket but ₦45k is a bit steep for me. Would you take ₦25,000?
              </div>
            </div>
          </div>

          {/* AI Message 1 */}
          <div className="flex w-[85%] items-end justify-end gap-3 self-end">
            <div className="flex flex-col items-end gap-1">
              <span className="mr-1 text-xs font-medium text-zinc-500">
                <span className="font-normal text-zinc-400">10:14 AM</span> Hook AI
              </span>
              <div className="rounded-2xl rounded-br-none bg-zinc-900 p-4 text-sm leading-relaxed text-white shadow-sm">
                Hello Ibrahim! This Vintage YSL Jacket is a rare find in excellent condition. ₦25,000 is quite low, but I can offer a special discount to ₦40,000. How does that sound?
              </div>
              <div className="mr-1 mt-1 inline-block rounded-full border border-brand-gold bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
                Official Offer: ₦40,000
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/20 bg-amber-50 text-brand-gold shadow-sm">
              <Bot size={16} />
            </div>
          </div>

          {/* User Message 2 */}
          <div className="flex w-[85%] items-end gap-3">
            <img
              src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=100&q=80"
              alt="User"
              className="h-8 w-8 shrink-0 rounded-full shadow-sm"
            />
            <div className="flex flex-col items-start gap-1">
              <span className="ml-1 text-xs font-medium text-zinc-500">
                Ibrahim S. <span className="font-normal text-zinc-400">10:16 AM</span>
              </span>
              <div className="rounded-2xl rounded-bl-none border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800 shadow-sm">
                I can&apos;t go that high. I&apos;m a student and really want it for a photoshoot. My final offer is ₦30,000. Please let&apos;s make a deal.
              </div>
            </div>
          </div>

          {/* AI Message 2 */}
          <div className="flex w-[85%] items-end justify-end gap-3 self-end">
            <div className="flex flex-col items-end gap-1">
              <span className="mr-1 text-xs font-medium text-zinc-500">
                <span className="font-normal text-zinc-400">10:16 AM</span> Hook AI
              </span>
              <div className="rounded-2xl rounded-br-none bg-zinc-900 p-4 text-sm leading-relaxed text-white shadow-sm">
                I understand you&apos;re on a budget! The lowest I&apos;m authorized to go right now is ₦35,000 to ensure our boutique owner gets a fair price. That&apos;s a solid ₦10k off the listing price!
              </div>
              <div className="mr-1 mt-1 inline-block rounded-full border border-brand-gold bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-600">
                Official Offer: ₦35,000
              </div>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/20 bg-amber-50 text-brand-gold shadow-sm">
              <Bot size={16} />
            </div>
          </div>

          {/* User Message 3 + Alert */}
          <div className="mb-2 flex w-[85%] items-end gap-3">
            <img
              src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=100&q=80"
              alt="User"
              className="h-8 w-8 shrink-0 rounded-full shadow-sm"
            />
            <div className="flex w-full flex-col items-start gap-1">
              <span className="ml-1 text-xs font-medium text-zinc-500">
                Ibrahim S. <span className="font-normal text-zinc-400">10:18 AM</span>
              </span>
              <div className="w-full rounded-2xl rounded-bl-none border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800 shadow-sm">
                Come on, ₦30k is all I have in my wallet right now. Call the manager if you have to.
              </div>
              <Alert className="mt-4 w-full border-red-100 bg-red-50 shadow-sm">
                <AlertCircle size={18} className="text-red-500" />
                <AlertDescription className="text-sm font-medium text-red-600">
                  AI Confidence dropped below 40%. Bot requested human takeover.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-20" />
        </div>
      </ScrollArea>

      {/* Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 border-t border-zinc-200 bg-white p-4 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="shrink-0">
          <h4 className="mb-0.5 text-sm font-bold text-zinc-900">Escalation Required</h4>
          <p className="text-xs text-zinc-500">
            Customer&apos;s firm offer (<span className="font-semibold text-zinc-700">₦30k</span>) is below
            the allowed floor (<span className="font-semibold text-zinc-700">₦32k</span>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
          >
            <XCircle size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Reject Offer</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-zinc-700"
          >
            <MessageCircle size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Take Over Chat</span>
          </Button>
          <Button
            variant="brand"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Check size={16} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Approve Exception (₦30k)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
