export function PaymentProviderMark({ provider }: { provider: "paystack" | "opay" }) {
  if (provider === "opay") {
    return <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white font-black text-[#00b875] shadow-sm ring-1 ring-black/5">O</span>;
  }

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#08a5a5] shadow-sm">
      <span className="space-y-1" aria-hidden="true">
        <i className="block h-1 w-5 rounded-full bg-white" />
        <i className="block h-1 w-4 rounded-full bg-white" />
        <i className="block h-1 w-3 rounded-full bg-white" />
      </span>
      <span className="sr-only">Paystack</span>
    </span>
  );
}
