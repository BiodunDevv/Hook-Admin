import type React from "react";

type LogoTone = "dark" | "light";

type LogoProps = React.ComponentProps<"span"> & {
  tone?: LogoTone;
};

export const LogoIcon = ({ className, tone = "dark", ...props }: LogoProps) => (
  <span
    className={[
      "inline-flex size-8 items-center justify-center rounded-md text-sm font-extrabold tracking-tight",
      tone === "light" ? "bg-white text-zinc-950" : "bg-zinc-950 text-white",
      className,
    ].filter(Boolean).join(" ")}
    {...props}
  >
    h<span className="text-brand-gold">.</span>
  </span>
);

export const Logo = ({ className, tone = "dark", ...props }: LogoProps) => (
  <span
    className={[
      "inline-flex items-baseline font-extrabold tracking-tight",
      tone === "light" ? "text-white" : "text-zinc-950",
      className,
    ].filter(Boolean).join(" ")}
    {...props}
  >
    hook<span className="text-brand-gold">.</span>
  </span>
);
