"use client";

/**
 * Die Mini-Zinskurve im Vergleichs-Teaser — die kleine Schwester der Kurve im Kursblatt.
 *
 * Wo eine Kategorie eine Laufzeit hat (Festgeld, Tagesgeld, Baufinanzierung), ist nicht
 * die Frage interessant, wie weit die Anbieter auseinanderliegen, sondern was die
 * LAUFZEIT ausmacht. Genau das zeigt dieses Band: der beste Wert je Anlagedauer, der
 * Höchststand betont, darunter die beiden Enden der Achse.
 *
 * 🚨 Es rechnet nichts. Die Punkte kommen als Prozentkoordinaten aus
 * `lib/faden/vergleichTeaser.ts` — dieselbe Arbeitsteilung wie beim Säulenband.
 */
import { useEffect, useState } from "react";
import type { TeaserPunkt } from "@/lib/faden/vergleichTeaser";

export default function Zinsband({ punkte, bestFuss, randFuss }: { punkte: TeaserPunkt[]; bestFuss: string; randFuss: string }) {
  // 🚨 Der Knoten im STATE, nicht im Ref — React tauscht ihn beim Wiederbeleben einer
  // Insel aus (dasselbe Muster wie in Marktband.tsx und Flugfenster.tsx).
  const [band, setBand] = useState<HTMLSpanElement | null>(null);
  const [sicht, setSicht] = useState(false);

  useEffect(() => {
    if (!band) return;
    if (typeof IntersectionObserver !== "function") { setSicht(true); return; }
    const beobachter = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSicht(true); beobachter.disconnect(); } }, { threshold: 0.06, rootMargin: "0px 0px -8%" });
    beobachter.observe(band);
    return () => beobachter.disconnect();
  }, [band]);

  // Das SVG rechnet in einem 100 × 100 Raster; `preserveAspectRatio="none"` streckt es
  // auf die Bandmaße. Die Punkte darüber sind HTML — sie müssen rund bleiben.
  const d = punkte.map((p, i) => `${i ? "L" : "M"}${p.x} ${100 - p.y}`).join(" ");
  return (
    <span className="zinsband" data-sicht={sicht ? "an" : undefined} ref={setBand}>
      <span className="zinsband__feld">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className="zinsband__linie" d={d} vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Zwei Knoten je Punkt: der äußere zentriert (translate), der innere ist der
            Kreis und darf pulsen — eine Puls-Animation überschriebe sonst die
            Zentrierung des äußeren. */}
        {punkte.map((p, i) => (
          <i
            key={i}
            className={"zinsband__punkt" + (p.best ? " ist-best" : "")}
            style={{ left: `${p.x}%`, bottom: `${p.y}%`, animationDelay: `calc(.35s + ${i} * .06s)` }}
            title={`${p.label}: ${p.wert}`}
          ><b /></i>
        ))}
      </span>
      <i className="zinsband__grund" aria-hidden="true" />
      <span className="zinsband__achse" aria-hidden="true">
        <span>{punkte[0]?.label}</span>
        <span>{punkte[punkte.length - 1]?.label}</span>
      </span>
      <span className="marktband__fuss">
        <span className="marktband__best">{bestFuss}</span>
        <span>{randFuss}</span>
      </span>
    </span>
  );
}
