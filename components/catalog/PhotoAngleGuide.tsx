import { cn } from "@/lib/utils";

export type Angle = "front" | "side" | "back";

/**
 * Small illustrated example of one required photo angle: a product inside a
 * camera frame, with a gold arrow showing where the camera sits. A neutral
 * sneaker is used because its three angles are easy to tell apart, and it reads
 * the same for clothing, bags and shoes.
 */
export function PhotoAngleGuide({ angle, className }: { angle: Angle; className?: string }) {
  return (
    <svg viewBox="0 0 120 84" role="img" aria-label={`Example ${angle} photo`} className={cn("h-full w-full", className)} fill="none">
      <rect width="120" height="84" rx="10" fill="#FFFDF5" />
      {/* camera frame corners */}
      {[[10, 10, 1, 1], [110, 10, -1, 1], [10, 74, 1, -1], [110, 74, -1, -1]].map(([x, y, dx, dy], index) => (
        <path key={index} d={`M${x} ${y + 9 * dy}V${y}H${x + 9 * dx}`} stroke="#FFC809" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <g stroke="#111" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {angle === "front" && (
          <>
            <rect x="35" y="55" width="50" height="8" rx="4" fill="#111" />
            <path d="M38 55C36 38 44 25 60 25C76 25 84 38 82 55Z" fill="#fff" />
            <path d="M52 34H68M50 41H70M48 48H72" />
            <path d="M52 27C55 31 65 31 68 27" />
          </>
        )}
        {angle === "side" && (
          <>
            <rect x="18" y="55" width="84" height="8" rx="4" fill="#111" />
            <path d="M20 55C20 46 30 44 38 41L47 31C53 25 62 27 66 33L76 42C92 44 100 47 100 55Z" fill="#fff" />
            <path d="M52 34L58 40M58 30L64 37M64 34L70 41" />
            <path d="M20 50H30" stroke="#FFC809" strokeWidth="3" />
          </>
        )}
        {angle === "back" && (
          <>
            <rect x="35" y="55" width="50" height="8" rx="4" fill="#111" />
            <path d="M38 55C37 39 43 28 60 28C77 28 83 39 82 55Z" fill="#fff" />
            <path d="M60 28V55" />
            <rect x="54" y="20" width="12" height="9" rx="3" fill="#fff" />
            <rect x="53" y="40" width="14" height="7" rx="1.5" fill="#FFC809" stroke="#111" strokeWidth="1.5" />
          </>
        )}
      </g>
      {/* where the camera is */}
      {angle === "front" && <path d="M60 78V70M56 73L60 69L64 73" stroke="#C99700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {angle === "side" && <path d="M8 46H18M14 42L18 46L14 50" stroke="#C99700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0" />}
      {angle === "back" && <path d="M60 6V13M56 10L60 14L64 10" stroke="#C99700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
