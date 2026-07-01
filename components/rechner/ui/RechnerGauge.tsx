"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";

interface Props {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  animateKey?: number;
}

/** Ring-Anzeige: Mittelkreis (1px outline) + 5px-Ring (3px Gap) der sich füllt. */
export default function RechnerGauge({ value, max = 100, label, unit = "%", animateKey = 0 }: Props) {
  const arcRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const R = 50; // Radius des Rings
  const C = 2 * Math.PI * R;
  const pct = Math.min(1, Math.max(0, value / max));

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (arcRef.current) {
      gsap.fromTo(arcRef.current, { strokeDashoffset: C }, { strokeDashoffset: C * (1 - pct), duration: reduce ? 0 : 1, ease: "power2.out" });
    }
    if (numRef.current) {
      const o = { v: 0 };
      gsap.to(o, { v: value, duration: reduce ? 0 : 0.9, ease: "power2.out", onUpdate: () => { if (numRef.current) numRef.current.textContent = `${Math.round(o.v)}${unit}`; } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animateKey]);

  return (
    <div className="rechner-gauge">
      <svg viewBox="0 0 120 120" className="rechner-gauge-svg" aria-hidden>
        {/* Mittelkreis: 1px outline */}
        <circle cx="60" cy="60" r="44" fill="none" stroke="var(--color-text-primary)" strokeWidth="1" />
        {/* Track (5px) */}
        <circle cx="60" cy="60" r={R} fill="none" stroke="color-mix(in srgb, var(--color-text-primary) 18%, transparent)" strokeWidth="5" />
        {/* Füllung (5px) */}
        <circle
          ref={arcRef}
          cx="60" cy="60" r={R}
          fill="none" stroke="var(--color-brand-secondary)" strokeWidth="5"
          strokeDasharray={C} strokeDashoffset={C}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="rechner-gauge-center">
        <span ref={numRef} className="rechner-gauge-value">{value}{unit}</span>
        <span className="rechner-gauge-label">{label}</span>
      </div>
    </div>
  );
}
