"use client";

import { useParams, useSearchParams } from "next/navigation";
import { PartnerNegotiationChat } from "@/components/partner/PartnerNegotiationChat";

export default function PartnerNegotiationPage() {
  const { id } = useParams<{ id: string }>();
  const customerId = useSearchParams().get("customerId") || "";
  return <PartnerNegotiationChat negotiationId={id} customerId={customerId} />;
}
