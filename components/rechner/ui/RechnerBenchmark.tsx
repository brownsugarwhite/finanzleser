"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";

interface Props {
  value: number;
  average: number;
  max?: number;
  unit?: string;
  valueLabel?: string;
  averageLabel?: string;
  heading?: string;
  animateKey?: number;
}

function Bar({ name, amount, pct, unit, color, animateKey }: { name: string; amount: number; pct: number; unit: string; color: string; animateKey: number }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const fmt = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 0 });
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const o = { p: 0 };
    const apply = () => { if (fillRef.current) fillRef.current.style.width = `${o.p}%`; };
    if (reduce) { o.p = pct; apply(); return; }
    gsap.fromTo(o, { p: 0 }, { p: pct, duration: 0.8, ease: "power2.out", onUpdate: apply });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, animateKey]);
  return (
    <div className="rechner-bench-bar" style={{ ["--bar" as string]: color }}>
      <div className="rechner-bench-fill" ref={fillRef} />
      {/* Name liegt über der Füllung → Page-Farbe. Wert steht am Bar-Ende über dem Track → Bar-Farbe. */}
      <div className="rechner-bench-text">
        <span className="rechner-bench-name">{name}</span>
        <span className="rechner-bench-val">{fmt(amount)}{unit}</span>
      </div>
    </div>
  );
}

/** „Dein Deutschlandvergleich" — zwei dicke Balken mit kontrastdynamischem Text. */
export default function RechnerBenchmark({
  value,
  average,
  max,
  unit = "",
  valueLabel = "Dein Wert",
  averageLabel = "Durchschnitt",
  heading = "Dein Deutschlandvergleich",
  animateKey = 0,
}: Props) {
  const scale = max ?? (Math.max(value, average) * 1.15 || 1);
  return (
    <div className="rechner-benchmark">
      {heading && <p className="rechner-bench-heading">{heading}</p>}
      <Bar name={valueLabel} amount={value} pct={Math.min(100, (value / scale) * 100)} unit={unit} color="var(--color-brand-secondary)" animateKey={animateKey} />
      <Bar name={averageLabel} amount={average} pct={Math.min(100, (average / scale) * 100)} unit={unit} color="var(--color-text-primary)" animateKey={animateKey} />
    </div>
  );
}
