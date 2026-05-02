import { forwardRef } from "react";

type Props = {
  height?: number;
  /** "top" (Default) = Blur am oberen Rand, fadet nach unten aus.
   *  "bottom" = gespiegelt, Blur am unteren Rand, fadet nach oben aus. */
  position?: "top" | "bottom";
  /** Override default zIndex (50). */
  zIndex?: number;
  /** Override CSS position. "fixed" = viewport-relative (Default),
   *  "absolute" = nearest positioned ancestor, "sticky" = sticky in
   *  scroll-Container. */
  cssPosition?: "fixed" | "absolute" | "sticky";
};

const layers = [
  { blur: 0.5, heightPct: 100 },
  { blur: 1,   heightPct: 85  },
  { blur: 2,   heightPct: 70  },
  { blur: 4,   heightPct: 55  },
  { blur: 6,   heightPct: 40  },
  { blur: 10,  heightPct: 28  },
  { blur: 16,  heightPct: 16  },
  { blur: 24,  heightPct: 8   },
];

const ProgressiveBlur = forwardRef<HTMLDivElement, Props>(function ProgressiveBlur({
  height = 120,
  position = "top",
  zIndex = 50,
  cssPosition = "fixed",
}, ref) {
  const isBottom = position === "bottom";
  const layerAnchor = isBottom ? { bottom: 0 } : { top: 0 };
  const maskGradient = isBottom
    ? "linear-gradient(to top, black 40%, transparent 100%)"
    : "linear-gradient(to bottom, black 40%, transparent 100%)";
  const colorGradient = isBottom
    ? "linear-gradient(to top, var(--color-bg-page) 0%, transparent 100%)"
    : "linear-gradient(to bottom, var(--color-bg-page) 0%, transparent 100%)";
  // Bottom-Mode: top:"auto" muss explizit her, weil .progressive-blur in
  // app/components.css `top: 0` setzt — das würde sonst Inline-bottom:0
  // überschreiben (top + bottom + height → top wins).
  const containerAnchor = isBottom ? { top: "auto", bottom: 0 } : { top: 0 };

  return (
    <div
      ref={ref}
      // Kein className mehr — die `.progressive-blur` CSS-Klasse hat
      // hardcoded `top: 0` was auf Chrome Desktop mit unserem inline
      // `top: auto` (bottom mode) konfliktet. Alle Styles inline halten.
      style={{
        position: cssPosition,
        left: 0,
        right: 0,
        ...containerAnchor,
        height,
        zIndex,
        pointerEvents: "none",
      }}
    >
      {layers.map(({ blur, heightPct }) => (
        <div
          key={blur}
          style={{
            position: "absolute",
            ...layerAnchor,
            left: 0,
            right: 0,
            height: `${heightPct}%`,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: maskGradient,
            WebkitMaskImage: maskGradient,
          }}
        />
      ))}

      <div
        className="progressive-blur-color-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background: colorGradient,
          opacity: 1,
        }}
      />
    </div>
  );
});

export default ProgressiveBlur;
