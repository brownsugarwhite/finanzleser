"use client";

/**
 * Statistik im Abschnitt: Torte, Säulen oder Balken mit Legende (antippen blendet aus,
 * Überfahren hebt hervor), Umschalter (Jahr, Gruppe) und Regler mit Neuberechnung
 * über einen Rechner der Seite. Das SSR-HTML zeigt den Endzustand (kein Layout-
 * Sprung); GSAP animiert beim ersten Eintritt ins Bild. Quelle, Stand und Kennzeichen
 * „Sekundärquelle“ stehen immer dabei.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import gsap, { ScrollTrigger } from "@/lib/gsapConfig";
import type { FadenStatistik, StatistikWert } from "@/lib/types";
import { useRates } from "@/lib/hooks/useRates";
import { rechne, formatWert } from "@/lib/statistik/formeln";
import Torte from "./Torte";
import Saeulen from "./Saeulen";
import Balken from "./Balken";

export const FARBEN = ["var(--stat-1)", "var(--stat-2)", "var(--stat-3)", "var(--stat-4)", "var(--stat-5)", "var(--stat-6)"];

export interface Segment extends StatistikWert { farbe: string; aus: boolean; hervor: boolean; ihr?: boolean }

export default function StatistikKarte({ st }: { st: FadenStatistik }) {
  const rates = useRates();
  const [reihe, setReihe] = useState(0);
  const [aus, setAus] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);
  const [regler, setRegler] = useState(st.regler?.start ?? 0);
  const wurzel = useRef<HTMLElement>(null);
  const aktuelle = st.reihen[Math.min(reihe, st.reihen.length - 1)];

  // „Ihr Wert“ aus dem Regler: über den Rechner der Seite oder linear zum Bezugswert.
  const ihrWert = useMemo<number | null>(() => {
    const r = st.regler;
    if (!r) return null;
    if (r.formel.typ === "rechner") return rechne(r.formel, regler, rates);
    const bezug = aktuelle.werte.find((w) => w.label === r.formel.bezug);
    if (!bezug || !r.start) return null;
    return bezug.wert * (regler / r.start);
  }, [st.regler, regler, rates, aktuelle]);

  const segmente: Segment[] = useMemo(() => {
    const basis: Segment[] = aktuelle.werte.map((w, i) => ({ ...w, farbe: w.farbe || (st.art === "torte" ? FARBEN[i % FARBEN.length] : FARBEN[0]), aus: aus.has(w.label), hervor: hover === w.label }));
    if (ihrWert != null && st.art !== "torte" && st.regler?.imDiagramm) basis.push({ label: `Ihr Wert (${formatWert(regler, st.regler?.einheit)})`, wert: ihrWert, farbe: "var(--pink)", aus: false, hervor: hover === "__ihr", ihr: true });
    return basis;
  }, [aktuelle, aus, hover, ihrWert, regler, st.art, st.regler?.einheit, st.regler?.imDiagramm]);

  // Eintritt ins Bild: Stücke aus der Mitte, Säulen/Balken von der Grundlinie, Zahlen zählen hoch.
  useEffect(() => {
    const el = wurzel.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stuecke = el.querySelectorAll<HTMLElement | SVGElement>("[data-stueck]");
    const zahlen = el.querySelectorAll<HTMLElement>("[data-zahl]");
    if (!stuecke.length) return;
    const ctx = gsap.context(() => {
      gsap.set(stuecke, { scale: st.art === "torte" ? 0.2 : st.art === "saeulen" ? undefined : undefined, scaleY: st.art === "saeulen" ? 0 : undefined, scaleX: st.art === "balken" ? 0 : undefined, opacity: st.art === "torte" ? 0 : 1, transformOrigin: st.art === "torte" ? "100px 100px" : st.art === "saeulen" ? "50% 100%" : "0% 50%" });
      ScrollTrigger.create({
        trigger: el, start: "top 80%", once: true,
        onEnter: () => {
          gsap.to(stuecke, { scale: 1, scaleY: 1, scaleX: 1, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.09 });
          zahlen.forEach((z, i) => {
            const ziel = Number(z.dataset.zahl); const einheit = z.dataset.einheit || "";
            if (!Number.isFinite(ziel)) return;
            const o = { v: 0 };
            gsap.to(o, { v: ziel, duration: 0.8, delay: 0.1 + i * 0.09, ease: "power2.out", onUpdate: () => { z.textContent = formatWert(o.v, einheit); }, onComplete: () => { z.textContent = formatWert(ziel, einheit); } });
          });
        },
      });
    }, el);
    return () => ctx.revert();
  }, [st.art]);

  const umschalten = (label: string) => setAus((alt) => { const n = new Set(alt); if (n.has(label)) n.delete(label); else n.add(label); return n; });
  const sekundaer = !!st.quelle?.sekundaer;

  return (
    <section ref={wurzel} className={`kasten kasten--statistik kasten--statistik-${st.art}`} aria-label={st.titel}>
      <span className="kicker kicker--gruen">Statistik{st.quelle?.name ? ` · ${st.quelle.name.split(/[,(;]/)[0].trim()}` : ""}{st.quelle?.stand ? ` · Stand ${st.quelle.stand}` : ""}{sekundaer && <em className="statistik__sekundaer">Sekundärquelle</em>}</span>
      <h3 className="statistik__titel">{st.titel}</h3>
      {st.untertitel && <p className="statistik__unter">{st.untertitel}</p>}
      {st.reihen.length > 1 && (
        <div className="umschalter" role="tablist" aria-label={st.umschalter?.label || "Auswahl"}>
          {st.umschalter?.label && <span className="umschalter__label">{st.umschalter.label}</span>}
          {st.reihen.map((r, i) => <button key={r.key} type="button" role="tab" aria-selected={i === reihe} className={"chip" + (i === reihe ? " chip--aktiv" : "")} onClick={() => setReihe(i)}>{r.label}</button>)}
        </div>
      )}
      {st.art === "torte" && <Torte segmente={segmente} einheit={st.einheit} onHover={setHover} onToggle={umschalten} />}
      {st.art === "saeulen" && <Saeulen segmente={segmente} einheit={st.einheit} onHover={setHover} onToggle={umschalten} />}
      {st.art === "balken" && <Balken segmente={segmente} einheit={st.einheit} onHover={setHover} onToggle={umschalten} />}
      {st.regler && (
        <div className="regler">
          <label>
            <span className="regler__label">{st.regler.label}</span>
            <b className="regler__wert">{formatWert(regler, st.regler.einheit)}</b>
            <input type="range" min={st.regler.min} max={st.regler.max} step={st.regler.schritt} value={regler} onChange={(e) => setRegler(Number(e.target.value))} aria-label={st.regler.label} />
          </label>
          <span className="regler__ergebnis">{ihrWert == null ? "Für diesen Wert liegt keine Berechnung vor." : <>{st.regler.ergebnis || "Ihr Wert"}: <b>{formatWert(ihrWert, st.regler.ergebnisEinheit ?? st.einheit)}</b></>}</span>
        </div>
      )}
      {st.hinweis && <p className="statistik__hinweis">{st.hinweis}</p>}
      {st.quelle?.name && (
        <p className="quelle">Quelle: {st.quelle.url ? <a href={st.quelle.url} target="_blank" rel="noopener noreferrer" data-faden-aus="">{st.quelle.name}</a> : st.quelle.name}{st.quelle.stand ? `, Stand ${st.quelle.stand}` : ""}{sekundaer ? " (Sekundärquelle)" : ""}</p>
      )}
    </section>
  );
}
