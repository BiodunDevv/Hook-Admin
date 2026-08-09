import type React from "react";

type LogoTone = "dark" | "light";

type LogoProps = React.ComponentProps<"span"> & {
  tone?: LogoTone;
};

function markClasses(tone: LogoTone) {
  return [
    "inline-flex items-baseline font-extrabold tracking-tight",
    tone === "light" ? "text-white" : "text-zinc-950",
  ];
}

export const LogoIcon = ({ className, tone = "dark", ...props }: LogoProps) => (
  <span
    className={[...markClasses(tone), className].filter(Boolean).join(" ")}
    {...props}
  >
    hook<span className="text-brand-gold">.</span>
  </span>
);

export const Logo = ({ className, tone = "dark", ...props }: LogoProps) => (
  <span
    className={[...markClasses(tone), className].filter(Boolean).join(" ")}
    {...props}
  >
    hook<span className="text-brand-gold">.</span>
  </span>
);
