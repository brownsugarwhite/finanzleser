import type { CSSProperties } from "react";

// Pfeilspitze aus assets/smallAroowTip.svg (viewBox 7.62 × 14.37), inline mit
// fill="currentColor", damit Farbe + Rotation vom Aufrufer geerbt werden.
const TIP_PATH =
  "M.03,13.84c-.16.44.45.74.72.36,1.35-1.87,4.75-5.02,6.62-6.49.35-.27.34-.8-.02-1.06C5.15,5.05,2.12,2.08.74.17.47-.2-.12.09.03.53c.78,2.28,2.56,4.41,3.22,5.82.26.56.28,1.15,0,1.71C2.58,9.45.71,11.93.03,13.84Z";
const TIP_W = 7.62;
const TIP_H = 14.37;

/**
 * Einheitliche Megamenü-Pfeilspitze (User-Asset). Wird im ganzen Meganav
 * (Mobile + Desktop) verwendet. Farbe via `currentColor`/`color`; Rotation
 * (z. B. `rotate-90` bei offenem Akkordeon) und Größe steuert der Aufrufer.
 */
export default function MegaArrow({
  className,
  style,
  size = 11,
}: {
  className?: string;
  style?: CSSProperties;
  size?: number;
}) {
  const width = (TIP_W / TIP_H) * size;
  return (
    <svg
      aria-hidden
      className={className}
      width={width}
      height={size}
      viewBox={`0 0 ${TIP_W} ${TIP_H}`}
      fill="none"
      style={{ display: "inline-block", flexShrink: 0, ...style }}
    >
      <path d={TIP_PATH} fill="currentColor" />
    </svg>
  );
}

/**
 * Pfeil = wachsende Linie (Schaft) + Pfeilspitze (flush am Ende, kein Versatz).
 * `active` lässt die Linie auf volle Länge wachsen (wie Desktop-Aktiv-Zustand).
 */
export function MegaArrowTrail({
  active,
  arrowSize = 8,
}: {
  active?: boolean;
  arrowSize?: number;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <span
        className={`megamenu-sub-line${active ? " megamenu-sub-line--active" : ""}`}
        style={{ height: 0, borderTop: "1px solid currentColor", flexShrink: 0 }}
      />
      <MegaArrow className="megamenu-trail-arrow" size={arrowSize} style={{ marginLeft: -3 }} />
    </span>
  );
}
