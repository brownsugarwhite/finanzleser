type Props = {
  height?: number;
  color?: string; // RGB values only, e.g. "255,255,255"
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

export default function ProgressiveBlur({ height = 120, color = "255,255,255" }: Props) {
  return (
    <div
      className="progressive-blur"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        zIndex: 50,
        pointerEvents: "none",
        ["--blur-height" as string]: `${height}px`,
      }}
    >
      {/* Blur layers – from softest (full height) to sharpest (top only) */}
      {layers.map(({ blur, heightPct }) => (
        <div
          key={blur}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: `${heightPct}%`,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            willChange: "transform",
          }}
        />
      ))}

      {/* White gradient overlay – handles the color/alpha fade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, rgba(${color},0.7) 0%, rgba(${color},0) 100%)`,
        }}
      />
    </div>
  );
}
