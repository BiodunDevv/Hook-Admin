import { redirect } from "next/navigation";

export default async function PaymentFailedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/payment/${token}`);
}
