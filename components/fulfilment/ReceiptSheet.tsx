"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, Lock, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { HookReceipt, type ReceiptData } from "@/components/fulfilment/HookReceipt";
import { AdminWorkflowSheet } from "@/components/shared/AdminWorkflowSheet";
import { HookLoader } from "@/components/shared/HookLoader";
import { QueryState } from "@/components/shared/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Size = "a6" | "a4" | "thermal";
// Paper sizes in millimetres; the same numbers drive the preview, the print
// stylesheet and the PDF page.
const SIZES: Record<Size, { label: string; hint: string; w: number; h: number; page: string }> = {
  a6: { label: "Label A6", hint: "105 × 148 mm", w: 105, h: 148, page: "A6" },
  thermal: { label: "Thermal 4×6", hint: "102 × 152 mm", w: 101.6, h: 152.4, page: "101.6mm 152.4mm" },
  a4: { label: "Receipt A4", hint: "210 × 297 mm", w: 210, h: 297, page: "A4" },
};

/**
 * Preview, print and download a parcel's Hook receipt from a side sheet, so
 * the Hub never leaves the page it is working on. The printable copy is
 * portalled to <body>; the PDF is rendered from an off-screen copy at the exact
 * paper size.
 */
export function ReceiptSheet({
  orderRef,
  open,
  onOpenChange,
}: {
  orderRef?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [size, setSize] = useState<Size>("a6");
  const [parcelRef, setParcelRef] = useState<string>();
  const [busy, setBusy] = useState<"print" | "pdf">();
  const captureRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // The preview is scaled to fit the sheet, so the whole label is visible
  // without scrolling. Width comes from the box, height from the window.
  const [viewport, setViewport] = useState({ width: 480, height: 800 });
  useEffect(() => {
    if (!open) return;
    const measure = () => setViewport({ width: boxRef.current?.clientWidth || 480, height: window.innerHeight });
    measure();
    const observer = boxRef.current ? new ResizeObserver(measure) : undefined;
    if (boxRef.current) observer?.observe(boxRef.current);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [open, orderRef]);
  const query = useApiQuery<ReceiptData>(
    ["admin", "fulfilment", "receipt", orderRef, parcelRef],
    `/admin/fulfilment/orders/${encodeURIComponent(orderRef || "")}/receipt${parcelRef ? `?consolidationId=${encodeURIComponent(parcelRef)}` : ""}`,
    open && Boolean(orderRef),
  );
  const data = query.data;
  const spec = SIZES[size];
  const sealed = data?.status === "SEALED";
  const MM = 3.7795;
  const chrome = sealed === false ? 470 : 405; // header, controls, padding and footer around the preview
  const fit = Math.min(1, (viewport.height - chrome) / (spec.h * MM), (viewport.width - 34) / (spec.w * MM));
  const scanUrl = data && typeof window !== "undefined" ? `${window.location.origin}/track/${data.receiptNumber}?s=${data.trackingSig || ""}` : undefined;

  // Every print or download is logged so a duplicate label can be traced.
  async function logIssue() {
    try {
      await apiPost(`/admin/fulfilment/orders/${encodeURIComponent(orderRef || "")}/receipt/print`, { size, ...(parcelRef ? { consolidationId: parcelRef } : {}) });
      await query.refetch();
    } catch (cause) {
      // A failed log must not block a label the Hub needs now.
      toast.error(cause instanceof Error ? cause.message.replace(/^\d+:\s*/, "") : "The print could not be logged.");
    }
  }

  async function print() {
    setBusy("print");
    await logIssue();
    setBusy(undefined);
    setTimeout(() => window.print(), 150);
  }

  async function download() {
    if (!data || !captureRef.current) return;
    setBusy("pdf");
    try {
      await logIssue();
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      // Let the reprint mark from the log above render before capturing.
      await new Promise((resolve) => setTimeout(resolve, 200));
      const image = await toPng(captureRef.current, { pixelRatio: 3, backgroundColor: "#ffffff", cacheBust: true });
      const pdf = new jsPDF({ unit: "mm", format: [spec.w, spec.h], orientation: "portrait", compress: true });
      pdf.addImage(image, "PNG", 0, 0, spec.w, spec.h, undefined, "FAST");
      pdf.setProperties({ title: `Hook receipt ${data.receiptNumber}`, subject: `Order ${data.order.publicId}`, creator: "Hook" });
      pdf.save(`${data.receiptNumber}.pdf`);
      toast.success("Receipt downloaded.");
    } catch {
      toast.error("The receipt could not be generated. Try printing instead.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <>
      <AdminWorkflowSheet
        open={open}
        onOpenChange={onOpenChange}
        title={data ? `Hook receipt · ${data.receiptNumber}` : "Hook receipt"}
        description={orderRef ? `Order ${orderRef}. Print it for the parcel or download a PDF copy.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => void download()} disabled={!sealed || Boolean(busy)}>
              {busy === "pdf" ? <HookLoader size="button" /> : <><Download /> Download PDF</>}
            </Button>
            <Button onClick={() => void print()} disabled={!sealed || Boolean(busy)}>
              {busy === "print" ? <HookLoader size="button" /> : <><Printer /> Print</>}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={size} onValueChange={(value) => setSize(value as Size)}>
              <TabsList>
                {(Object.keys(SIZES) as Size[]).map((key) => (
                  <TabsTrigger key={key} value={key}>{SIZES[key].label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">{spec.hint}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data ? (
              <Badge variant={sealed ? "default" : "secondary"}>{sealed ? "Sealed" : "Not sealed"}</Badge>
            ) : null}
            {data?.printCount ? <Badge variant="outline">Issued {data.printCount}×</Badge> : null}
            {data?.parcelOptions && data.parcelOptions.length > 1 ? (
              <Select value={parcelRef || data.parcel?.reference} onValueChange={setParcelRef}>
                <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.parcelOptions.map((option) => (
                    <SelectItem key={option.reference} value={String(option.reference)}>Parcel {option.reference}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={query.isFetching ? "animate-spin" : undefined} /> Refresh
            </Button>
          </div>

          {data && !sealed ? (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm">
              <Lock className="mt-0.5 size-4 shrink-0" />
              Seal the parcel first. A label is only issued for a sealed parcel, so it never ends up on an incomplete one.
            </div>
          ) : null}

          <div ref={boxRef} className="rounded-lg border bg-muted/40 p-4">
            <QueryState
              loading={query.isLoading}
              error={query.error}
              loadingLabel="Preparing receipt"
              errorTitle="The receipt could not be loaded"
              onRetry={() => query.refetch()}
            >
              {data ? (
                <div className="flex justify-center">
                  <div style={{ zoom: Math.max(fit, 0.3) }}>
                    <div
                      className="overflow-hidden rounded-md border bg-white shadow-lg"
                      style={{ width: `${spec.w}mm`, minHeight: `${spec.h}mm` }}
                    >
                      <HookReceipt data={data} scanUrl={scanUrl} />
                    </div>
                  </div>
                </div>
              ) : null}
            </QueryState>
          </div>

          {orderRef ? (
            <Button variant="link" size="sm" className="px-0" asChild>
              <a href={`/dashboard/fulfilment/receipts/${orderRef}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Open in its own page
              </a>
            </Button>
          ) : null}
        </div>
      </AdminWorkflowSheet>

      {open && data && typeof document !== "undefined"
        ? createPortal(
            <>
              {/* Printed copy: everything else on the page is hidden by print CSS. */}
              <div className="hook-print-root" style={{ width: `${spec.w}mm`, height: `${spec.h}mm` }}>
                <style>{`
                  .hook-print-root { display: none; }
                  @media print {
                    @page { size: ${spec.page}; margin: 0; }
                    body > *:not(.hook-print-root) { display: none !important; }
                    .hook-print-root { display: block !important; position: fixed; inset: 0; background: white; }
                  }
                `}</style>
                <HookReceipt data={data} scanUrl={scanUrl} />
              </div>
              {/* Off-screen copy at true paper size, captured for the PDF. */}
              <div aria-hidden className="pointer-events-none fixed left-[-99999px] top-0 print:hidden">
                <div ref={captureRef} style={{ width: `${spec.w}mm`, height: `${spec.h}mm`, background: "white" }}>
                  <HookReceipt data={data} scanUrl={scanUrl} />
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
