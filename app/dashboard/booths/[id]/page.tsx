"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clipboard, History, KeyRound, Package, Power, QrCode, ReceiptText, RotateCw, Store, UserRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useApiPatch, useApiQuery } from "@/lib/query";
import { apiPost } from "@/lib/api";
import { StateChip } from "@/components/operations/StateDropdown";

type BoothDetail = {
  id: string; name: string; description?: string; isActive: boolean; boothType: string;
  location?: { address?: string; lat?: number; lng?: number; stateName?: string };
  attendant?: { id: string; firstName?: string; lastName?: string; email: string; phone?: string };
  assignmentHistory: Array<{ id?: string; _id?: string; attendantUserId?: string; attendantName: string; attendantEmail: string; attendantPhone: string; assignedAt: string; releasedAt?: string }>;
  inventory: Array<{ id?: string; _id?: string; productId?: string; product?: { id?: string; _id?: string; title: string; images?: string[]; sellingPrice?: number } }>;
  orders: Array<{ id?: string; _id?: string; orderCode: string; total: number; status: string; paymentMode: string; orderType?: string }>;
  metrics: { orders: number; gmv: number; refunds: number; payNow: number; payOnDelivery: number; conversionRate: number };
};

export default function BoothDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const client = useQueryClient();
  const [accessCode, setAccessCode] = useState<string>();
  const [scanUrl, setScanUrl] = useState<string>();
  const query = useApiQuery<BoothDetail>(["admin", "booths", id], `/admin/booths/${id}`, Boolean(id));
  const toggle = useApiPatch(`/admin/booths/${id}/status`, ["admin", "booths"], { successMessage: "Booth status updated" });
  const rotateCode = useMutation({ mutationFn: () => apiPost<{ code: string }>(`/admin/booths/${id}/code/rotate`), onSuccess: (result) => { setAccessCode(result.code); toast.success("A new booth code is active"); client.invalidateQueries({ queryKey: ["admin", "booths", id] }); } });
  const rotateQr = useMutation({ mutationFn: () => apiPost<{ scanPath: string }>(`/admin/booths/${id}/qr/rotate`), onSuccess: (result) => { setScanUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"}${result.scanPath.replace("/api/v1", "")}`); toast.success("A new QR credential is active"); } });
  const booth = query.data;

  async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); toast.success(`${label} copied`); }
  function downloadQr() {
    const svg = document.getElementById("booth-qr");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${booth?.name || "booth"}-qr.svg`; link.click(); URL.revokeObjectURL(link.href);
  }

  if (query.isLoading) return <div className="grid min-h-[65vh] place-items-center"><HookLoader label="Loading booth operations" /></div>;
  if (!booth) return <div className="p-4 text-sm text-red-600">This booth could not be loaded.</div>;

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <PageHeader title={booth.name} description={booth.location?.address || "Physical commerce channel"} actions={<><Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft size={15} /> Back</Button><Button variant="outline" size="sm" onClick={() => toggle.mutate(undefined)}><Power size={15} /> {booth.isActive ? "Deactivate" : "Activate"}</Button></>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: "Attributed orders", value: booth.metrics.orders, icon: ReceiptText }, { label: "Gross merchandise", value: `₦${booth.metrics.gmv.toLocaleString()}`, icon: Store }, { label: "Active inventory", value: booth.inventory.length, icon: Package }, { label: "Refund exposure", value: `₦${booth.metrics.refunds.toLocaleString()}`, icon: RotateCw }].map(({ label, value, icon: Icon }) => <Card key={label} className="rounded-lg shadow-none"><CardContent className="flex items-center gap-3 p-3"><div className="grid size-9 place-items-center rounded-md bg-amber-50"><Icon size={17} /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div></CardContent></Card>)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-lg shadow-none"><CardHeader className="p-4 pb-2"><CardTitle className="flex items-center gap-2 text-base"><QrCode size={17} /> Customer access</CardTitle></CardHeader><CardContent className="grid gap-4 p-4 pt-2 sm:grid-cols-2">
          <div className="rounded-lg border bg-zinc-50 p-3"><p className="text-xs font-medium text-muted-foreground">Six-digit code</p><p className="mt-2 font-mono text-2xl font-bold tracking-[.3em]">{accessCode || "••••••"}</p><p className="mt-2 text-xs text-muted-foreground">Codes are encrypted as digests. Rotate to reveal a new code once.</p><div className="mt-3 flex gap-2">{accessCode && <Button size="sm" variant="outline" onClick={() => copy(accessCode, "Code")}><Clipboard size={14} /> Copy</Button>}<CredentialRotation title="Rotate access code" description="The old code and all active booth sessions will stop working." onConfirm={() => rotateCode.mutate()} loading={rotateCode.isPending} /></div></div>
          <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border bg-white p-3">{scanUrl ? <><QRCodeSVG id="booth-qr" value={scanUrl} size={132} level="H" includeMargin /><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => copy(scanUrl, "Scan URL")}><Clipboard size={14} /> Copy</Button><Button size="sm" variant="outline" onClick={downloadQr}>Download</Button></div></> : <><QrCode size={42} className="text-zinc-300" /><p className="mt-2 text-center text-xs text-muted-foreground">Rotate QR to generate a printable credential.</p><CredentialRotation title="Rotate QR code" description="The old QR and all active booth sessions will stop working." onConfirm={() => rotateQr.mutate()} loading={rotateQr.isPending} /></>}</div>
        </CardContent></Card>

        <Card className="rounded-lg shadow-none"><CardHeader className="p-4 pb-2"><CardTitle className="flex items-center gap-2 text-base"><UserRound size={17} /> Current attendant</CardTitle></CardHeader><CardContent className="p-4 pt-2">{booth.attendant ? <div className="rounded-lg border p-3"><p className="font-semibold">{booth.attendant.firstName} {booth.attendant.lastName}</p><p className="mt-1 text-sm text-muted-foreground">{booth.attendant.email}</p><p className="text-sm text-muted-foreground">{booth.attendant.phone || "Phone missing"}</p></div> : <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No attendant is assigned.</p>}<Separator className="my-4" /><div className="flex items-center gap-2 text-sm font-semibold"><History size={15} /> Assignment history</div><div className="mt-2 max-h-40 space-y-2 overflow-auto">{booth.assignmentHistory.map((row, index) => <div key={row.id || row._id || `${row.attendantUserId || row.attendantEmail}-${row.assignedAt}-${index}`} className="flex justify-between rounded-md bg-zinc-50 p-2 text-xs"><div><p className="font-medium">{row.attendantName}</p><p className="text-muted-foreground">{row.attendantPhone}</p></div><p className="text-right text-muted-foreground">{new Date(row.assignedAt).toLocaleDateString()}<br />{row.releasedAt ? "Released" : "Current"}</p></div>)}</div></CardContent></Card>
      </div>

      <Card className="rounded-lg shadow-none"><CardHeader className="p-4 pb-2"><CardTitle className="text-base">Booth inventory</CardTitle></CardHeader><CardContent className="grid gap-2 p-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">{booth.inventory.length ? booth.inventory.map((row, index) => <div key={row.id || row._id || row.productId || row.product?.id || row.product?._id || `inventory-${index}`} className="flex items-center gap-3 rounded-lg border p-2"><div className="size-11 overflow-hidden rounded-md bg-zinc-100">{row.product?.images?.[0] && <img src={row.product.images[0]} alt="" className="size-full object-cover" />}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{row.product?.title}</p><p className="text-xs text-muted-foreground">₦{Number(row.product?.sellingPrice || 0).toLocaleString()}</p></div></div>) : <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No approved products are assigned to this booth.</p>}</CardContent></Card>

      <Card className="rounded-lg shadow-none"><CardHeader className="p-4 pb-2"><CardTitle className="text-base">Recent attributed orders</CardTitle></CardHeader><CardContent className="p-4 pt-2"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr><th className="py-2">Order</th><th>Status</th><th>Type</th><th>Payment mode</th><th className="text-right">Amount</th></tr></thead><tbody>{booth.orders.map((order, index) => { const orderId = order.id || order._id; return <tr key={orderId || order.orderCode || `order-${index}`} className={orderId ? "cursor-pointer border-b last:border-0" : "border-b last:border-0"} onClick={() => orderId && router.push(`/dashboard/orders/${orderId}`)}><td className="py-3 font-medium">{order.orderCode}</td><td><StatusBadge status={order.status} /></td><td>{order.orderType === "gift" ? "Gift" : "Standard"}</td><td>{order.paymentMode.replaceAll("_", " ")}</td><td className="text-right font-medium">₦{order.total.toLocaleString()}</td></tr>; })}</tbody></table>{!booth.orders.length && <p className="py-10 text-center text-sm text-muted-foreground">No orders have been attributed to this booth yet.</p>}</div></CardContent></Card>
    </div>
  );
}

function CredentialRotation({ title, description, onConfirm, loading }: { title: string; description: string; onConfirm: () => void; loading: boolean }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline" className="mt-3"><KeyRound size={14} /> Rotate</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}?</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={loading} onClick={onConfirm}>{loading ? "Rotating..." : "Rotate credential"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
