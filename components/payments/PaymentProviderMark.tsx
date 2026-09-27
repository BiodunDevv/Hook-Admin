const LABELS: Record<string, string> = { paystack: "Paystack", monnify: "Monnify" };

/** Real provider wordmarks (Paystack's badge, Monnify's logo), sourced as static SVGs, not redrawn icons. */
const BADGES: Record<string, { src: string; className: string }> = {
  paystack: {
    src: "/brand/paystack-wordmark.svg",
    className: "border border-zinc-200 bg-white",
  },
  monnify: {
    src: "/brand/monnify-logo-white.svg",
    className: "bg-[#004990]",
  },
};

const SIZES = {
  // Compact chip alongside a text label.
  sm: { box: "h-10 w-16 px-3", img: "h-3.5" },
  // Large enough to stand alone as the only identifier — the wordmark already says the name.
  lg: { box: "h-16 w-36 px-5", img: "h-6" },
} as const;

export function PaymentProviderMark({ provider = "paystack", size = "sm" }: { provider?: string; size?: keyof typeof SIZES }) {
  const label = LABELS[provider] || provider;
  const badge = BADGES[provider];
  const scale = SIZES[size];
  if (!badge) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-lg bg-zinc-500 shadow-sm ${scale.box}`}>
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg shadow-sm ${scale.box} ${badge.className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, not a Next-optimizable photo */}
      <img src={badge.src} alt={label} className={`w-auto ${scale.img}`} />
    </span>
  );
}
