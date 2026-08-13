import { PublicPaymentCheckout } from "@/components/payments/PublicPaymentCheckout";

export default async function PaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicPaymentCheckout token={token} />;
}
