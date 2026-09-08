"use client";

/**
 * Landing-Hero: Zierlinie, Kicker, Titel, Suchpille exakt auf der Bildschirmmitte, ein
 * Satz, drei Vorschläge, die Werkzeugreihe und der Pfeil ins Kapitel „Heute“.
 * Ruhig, viel Papier (Prototyp, Runde 10). Enter fragt Leo. Der Flug der Pille kommt mit dem Feinschliff.
 */
import { useEffect, useRef, useState } from "react";
import { useFaden, zumKapitelScrollen } from "@/components/faden/FadenProvider";

export interface HeroVorschlag { text: string; href: string }
const ZIEL: Record<HeroWerkzeug["typ"], string> = { rechner: "Zu den Rechnern", vergleich: "Zu den Vergleichen", checkliste: "Zu den Checklisten" };

export interface HeroWerkzeug { typ: "rechner" | "vergleich" | "checkliste"; label: string; zahl: number; beschreibung: string; href: string }

export default function HeroLanding({ vorschlaege, werkzeuge }: { vorschlaege: HeroVorschlag[]; werkzeuge: HeroWerkzeug[] }) {
  const { fragen } = useFaden();
  const [wert, setWert] = useState("");
  const ref = useRef<HTMLElement>(null);
  // Solange der Hero mit seiner eigenen Pille im Bild ist, bleibt die Eingabe unten weg.
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { document.body.classList.toggle("faden-hero-sichtbar", e.intersectionRatio > 0.3); }, { threshold: [0, 0.3, 0.6] });
    io.observe(el);
    return () => { io.disconnect(); document.body.classList.remove("faden-hero-sichtbar"); };
  }, []);
  // Enter im Hero fragt Leo; die Antwort erscheint unter dem Kapitel „Heute“ (LeoStrom rollt hin).
  const senden = (e: React.FormEvent) => { e.preventDefault(); const q = wert.trim(); if (!q) return; setWert(""); fragen(q); };
  return (
    <section ref={ref} className="hero-landing" aria-label="Einstieg">
      <div className="hero-landing__mitte">
        <div className="landing-oben">
          <div className="landing-zier"><i /><span className="kicker">Finanzleser · Das digitale Finanzmagazin</span><i /></div>
          <h1>Fragen Sie Leo. Er hat die Bedingungen gelesen.</h1>
        </div>
        <div className="suchpille-wrap hero-landing__pille">
          <form onSubmit={senden} autoComplete="off" className={"suchpille" + (wert ? " hat-text" : "")}>
            <label className="sr" htmlFor="hero-frage">Fragen Sie Leo oder suchen Sie im Bestand</label>
            <input id="hero-frage" type="text" placeholder="Was kann ich für Sie tun?" autoComplete="off" value={wert} onChange={(e) => setWert(e.target.value)} />
            <button type="submit" className="senden">Fragen</button>
          </form>
        </div>
        <div className="landing-unten">
          <p className="landing-sub">Steuern, Finanzen, Versicherungen, Recht: Ratgeber, Rechner, Checklisten und Vergleiche, mit Quelle und Seite. Kostenlos, ohne Anmeldung.</p>
          <div className="hero-chips">
            {vorschlaege.map((v) => <a key={v.href} className="chip chip--still" href={v.href}>{v.text}</a>)}
          </div>
          <div className="werkzeugreihe">
            {werkzeuge.map((w, i) => (
              <span key={w.typ} className="werkzeugreihe__paar">
                {i > 0 && <span className="trenner" />}
                <a className="werkzeug-k da" href={w.href}>
                  <span className="kicker kicker--tool"><i className={`dot dot--${w.typ}`} />{w.label}</span>
                  <b>{w.zahl}<small>im Faden</small></b>
                  <span>{w.beschreibung}</span>
                  <span className="pfeil-link">{ZIEL[w.typ]}<i /></span>
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>
      <button type="button" className="hero-cta da" onClick={zumKapitelScrollen}>Finanzleser entdecken<i>↓</i></button>
    </section>
  );
}
