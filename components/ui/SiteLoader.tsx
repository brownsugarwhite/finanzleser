"use client";

// Performanter Loader: EIN Sprite-Sheet (16 Frames à 223×100, public/assets/loader/
// loader-sprite.png) + reine CSS-steps(16)-Animation auf background-position. Kein JS
// pro Frame, kein Lottie → GPU-freundlich, ein einziger Request.
const FRAMES = 16;
const FW = 223;
const FH = 100;

interface Props {
  /** Höhe in px (Default 72); Breite proportional */
  size?: number;
}

export default function SiteLoader({ size = 72 }: Props) {
  const h = size;
  const w = Math.round((size * FW) / FH);
  const spriteW = w * FRAMES;
  return (
    <span
      className="site-loader"
      role="status"
      aria-label="Lädt"
      style={{
        width: w,
        height: h,
        backgroundSize: `${spriteW}px ${h}px`,
        ["--sprite-w" as string]: `${spriteW}px`,
      }}
    />
  );
}
