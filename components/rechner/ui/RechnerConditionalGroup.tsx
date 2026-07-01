"use client";

/**
 * Bedingt sichtbare Eingabegruppe — smooth ein-/ausgeklappt (Höhe + Fade).
 * Genutzt von: brutto-netto (kinderlos>23), erbschaftsteuer (Alter Kind)
 */
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";

interface RechnerConditionalGroupProps {
  visible: boolean;
  children: React.ReactNode;
  label?: string;
}

export default function RechnerConditionalGroup({ visible, children, label }: RechnerConditionalGroupProps) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const o = outer.current, inn = inner.current;
    if (!o || !inn) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (first.current) {
      first.current = false;
      gsap.set(o, { height: visible ? "auto" : 0, autoAlpha: visible ? 1 : 0 });
      return;
    }
    gsap.killTweensOf(o);
    gsap.killTweensOf(inn);
    if (visible) {
      // Ziel = die volle AUTO-Höhe des OUTER (inkl. Padding/Margins) → kein Pixel-
      // Snap am Ende, weil die animierte Höhe exakt der finalen auto-Höhe entspricht.
      gsap.set(o, { height: "auto", autoAlpha: 1, overflow: "hidden" });
      const h = o.offsetHeight;
      gsap.fromTo(o, { height: 0 }, { height: h, duration: reduce ? 0 : 0.35, ease: "power2.out", onComplete: () => { gsap.set(o, { height: "auto", overflow: "visible" }); } });
      gsap.fromTo(inn, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: reduce ? 0 : 0.3, ease: "power2.out", delay: 0.05 });
    } else {
      gsap.set(o, { height: o.offsetHeight, overflow: "hidden" });
      gsap.to(o, { height: 0, autoAlpha: 0, duration: reduce ? 0 : 0.3, ease: "power2.inOut" });
    }
  }, [visible]);

  return (
    <div className="rechner-conditional-group-outer" ref={outer}>
      <div ref={inner} className="rechner-conditional-group">
        {label && <div className="rechner-conditional-label">{label}</div>}
        {children}
      </div>
    </div>
  );
}
