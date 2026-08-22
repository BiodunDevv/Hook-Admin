"use client";

import { useParams } from "next/navigation";
import { VendorDetailWorkspace } from "@/components/market-associate/VendorDetailWorkspace";

export default function MarketAssociateVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <VendorDetailWorkspace vendorId={id} />;
}
