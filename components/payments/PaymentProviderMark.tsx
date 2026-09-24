const LABELS: Record<string, string> = { paystack: "Paystack", monnify: "Monnify" };
const COLORS: Record<string, string> = { paystack: "bg-[#08a5a5]", monnify: "bg-[#004990]" };

export function PaymentProviderMark({ provider = "paystack" }: { provider?: string }) {
  const label = LABELS[provider] || provider;
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-lg shadow-sm ${COLORS[provider] || "bg-zinc-500"}`}>
      <span className="space-y-1" aria-hidden="true">
        <i className="block h-1 w-5 rounded-full bg-white" />
        <i className="block h-1 w-4 rounded-full bg-white" />
        <i className="block h-1 w-3 rounded-full bg-white" />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
