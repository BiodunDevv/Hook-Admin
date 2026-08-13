import { redirect } from "next/navigation";

export default async function PaymentSuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/payment/${token}/processing`);
}
