"use client";

import { useParams } from "next/navigation";
import { VendorDetailWorkspace } from "@/components/runner/VendorDetailWorkspace";

export default function RunnerVendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <VendorDetailWorkspace vendorId={id} />;
}
