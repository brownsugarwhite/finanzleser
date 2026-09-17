"use client";

/**
 * Das Streuband im Teaser — ein Punkt je Tarif, links der beste.
 *
 * Die dritte Form neben Säule und Kurve, und die Antwort auf dieselbe Frage, die das
 * Kursblatt ab 17 Angeboten stellt: Eine Säule braucht Breite, ein Punkt nicht. Bei 32
 * Tarifen sind die Säulen sieben Pixel breit mit einer Haarlinie dazwischen und lesen
 * sich als graue Fläche; die Punkte zeigen stattdessen, wo sich der Markt ballt und wie
 * weit der Bestwert vom Feld weg steht (Wunsch 17.09.2026).
 *
 * 🚨 Es rechnet nichts. Lage, Etage und Bestwert stehen fertig in
 * `lib/faden/vergleichTeaser.ts` — dieselbe Arbeitsteilung wie bei Marktband und
 * Zinsband. Auch die Ø-Linie kommt als Prozentwert; sie steht hier SENKRECHT, denn beim
 * Streuband trägt die Achse den Wert, nicht die Höhe.
 */
import { useEffect, useState } from "react";
import type { TeaserStreu } from "@/lib/faden/vergleichTeaser";

export default function Punktband({
  streu, schnitt, schnittText, bestFuss, randFuss,
}: {
  streu: TeaserStreu[];
  schnitt: number;
  schnittText: string;
  bestFuss: string;
  randFuss: string;
}) {
  // 🚨 Der Knoten im STATE, nicht im Ref — React tauscht ihn beim Wiederbeleben einer
  // Insel aus (dasselbe Muster wie in Marktband.tsx und Zinsband.tsx).
  const [band, setBand] = useState<HTMLSpanElement | null>(null);
  const [sicht, setSicht] = useState(false);

  useEffect(() => {
    if (!band) return;
    if (typeof IntersectionObserver !== "function") { setSicht(true); return; }
    const beobachter = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSicht(true); beobachter.disconnect(); } }, { threshold: 0.06, rootMargin: "0px 0px -8%" });
    beobachter.observe(band);
    return () => beobachter.disconnect();
  }, [band]);

  return (
    <span className="punktband" data-sicht={sicht ? "an" : undefined} ref={setBand}>
      <span className="punktband__feld">
        {/* Die Ø-Linie steht senkrecht auf der Achse, ihr Etikett hängt daran. */}
        <span
          className="punktband__schnitt"
          data-seite={schnitt > 62 ? "rechts" : undefined}
          style={{ left: `${schnitt}%` }}
          aria-hidden="true"
        >
          <em>{schnittText}</em>
        </span>
        {/* Zwei Knoten je Punkt: der äußere trägt die Lage, der innere ist der Kreis und
            darf pulsen — eine Puls-Animation überschriebe sonst die Zentrierung. */}
        {streu.map((p, i) => (
          <i
            key={i}
            className={"punktband__punkt" + (p.best ? " ist-best" : "")}
            /* 4 px über der Grundlinie, dann 12 px je Etage — dieselbe Reihenhöhe wie
               im großen Band, und vier Reihen füllen die 48 px genau aus. */
            style={{ left: `${p.x}%`, bottom: `${4 + p.etage * 12}px`, animationDelay: `calc(.2s + ${i} * .03s)` }}
            title={p.wert}
          ><b /></i>
        ))}
      </span>
      <i className="punktband__grund" aria-hidden="true" />
      <span className="marktband__fuss">
        <span className="marktband__best">{bestFuss}</span>
        <span>{randFuss}</span>
      </span>
    </span>
  );
}
