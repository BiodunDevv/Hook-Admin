import { PublicPaymentCheckout } from "@/components/payments/PublicPaymentCheckout";

export default async function ProcessingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicPaymentCheckout token={token} processing />;
}
