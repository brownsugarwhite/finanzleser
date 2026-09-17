"use client";

/**
 * Landing-Hero wie im Prototyp (Hero „Landing“): Zierlinie mit Stern, Kicker, Titel,
 * die Suchpille exakt auf der Bildschirmmitte, ein Satz. Ruhig, viel Papier.
 * Enter fragt Leo.
 *
 * 🚨 Der Hero scrollt schlicht nach oben weg (Wunsch vom 12.09.2026). Bis dahin lag hier
 * ein scrollgebundener rAF-Loop: Titel und Werkzeugreihe verblassten, und die Suchpille
 * flog per `position: fixed` in die untere Eingabezeile. Beides ist weg. Geblieben ist
 * ein 1-px-Wächter an der Unterkante (.hero-fuss): solange er im Bild ist, hält
 * body.faden-eingabe-frei die Eingabe des Fadens unter dem Fensterrand geparkt — sonst
 * stünden zwei Suchpillen gleichzeitig da. Die Einfahrt selbst macht faden.css.
 *
 * Dazu unter der Pille die Werkzeugreihe (Rechner · Vergleiche · Checklisten, Klick
 * öffnet das Finanztools-Registerblatt) und der CTA „Finanzleser entdecken ↓", der zu
 * „Heute" scrollt. Alles steht sofort — seit dem 13.09.2026 hat der Hero keine
 * Auftrittsanimation mehr.
 *
 * Übergabe „Finanzleser Heute", Baustein 1 (17.09.2026): Die Reihe ist zentriert, drei
 * gleich breite Spalten mit Haarlinie dazwischen, je Spalte Kicker mit Werkzeugpunkt,
 * die Zahl groß und mittig, darunter der kursive Halbsatz. Kein Link-Text mehr — die
 * ganze Spalte IST der Link. Hover: Kicker in Werkzeugfarbe, Punkt schlägt doppelt,
 * Zahl wächst leicht, Unterstrich fährt aus der Mitte auf.
 *
 * 🚨 Zwei Abweichungen von der Übergabe, beide vom User:
 *   – „im Faden" hinter der Zahl fällt weg, die Zahl steht allein und mittig.
 *   – Die Werkzeugfarben kommen aus dem Tokenverzeichnis (Vergleiche türkis, Checklisten
 *     lila), nicht aus der Übergabe — dort waren Vergleiche dunkeltürkis und Checklisten
 *     grün, und Grün ist im Haus die Marke, kein Werkzeug.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFaden } from "@/components/faden/FadenProvider";
import Spark from "@/components/ui/Spark";
import FieldOutline from "@/components/ui/FieldOutline";
import LeoChatSendButton from "@/components/ui/LeoChatSendButton";
import VersichererSelect from "@/components/ui/VersichererSelect";
import type { Versicherer } from "@/lib/versicherer";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

/** Werkzeugreihe (TOOLS, 03c-hero.html:7). Reiter-Schlüssel wie REITER in kopf/Blatt.tsx; Zahlen wie im Prototyp. */
const WERKZEUGE = [
  { key: "rechner", name: "Rechner", zahl: 56, text: "Unterhalt, Rente, Steuer, Kredit" },
  { key: "vergleich", name: "Vergleiche", zahl: 43, text: "Tarife nebeneinander" },
  { key: "checkliste", name: "Checklisten", zahl: 207, text: "Schritt für Schritt, als PDF" },
] as const;
/** Der Hero gehört nur an den Anfang eines Fadens; kommt man später zur Startseite zurück, hängt sich nur „Heute“ an. */
export type HeroZahlen = Partial<Record<"rechner" | "vergleich" | "checkliste", number>>;

export default function HeroLanding({ zahlen }: { zahlen?: HeroZahlen }) {
  // Solange der Hero steht, tragen die Randspalten seinen Vorlauf (app/faden.css). Das
  // Attribut sagt genau das — `data-landing` reicht dafür nicht mehr, denn der Hero
  // bleibt auch dann stehen, wenn der Leser die Startseite längst verlassen hat.
  useEffect(() => {
    document.body.setAttribute("data-faden-hero", "");
    return () => document.body.removeAttribute("data-faden-hero");
  }, []);
  // Der Zeitungskopf gehört an den Anfang des Fadens und wird deshalb IMMER vom Strom
  // gesetzt — der Hero steht als eigene Sektion darüber, außerhalb des Rasters.
  return <HeroInnen zahlen={zahlen} />;
}

function HeroInnen({ zahlen }: { zahlen?: HeroZahlen }) {
  const { fragen, blattOeffnen } = useFaden();
  const [wert, setWert] = useState("");
  const hero = useRef<HTMLElement>(null);
  const pilleFeld = useRef<HTMLDivElement>(null);
  const pille = useRef<HTMLFormElement>(null);
  const feld = useRef<HTMLTextAreaElement>(null);
  const [versicherer, setVersicherer] = useState<Versicherer | null>(null);

  // Die Eingabe des Fadens fährt von unten herein, sobald die OBERE Pille aus dem Bild
  // gescrollt ist (Wunsch vom 13.09.2026) — nicht erst, wenn der ganze Hero durch ist.
  //
  // 🚨 Hier stand bis zum 12.09.2026 ein scrollgebundener rAF-Loop: Die Suchpille des
  // Heros flog per `position: fixed` in die untere Eingabezeile, Titel und Werkzeugreihe
  // verblassten dabei. Der Hero scrollt jetzt schlicht weg (Wunsch vom 12.09.), und die
  // untere Zeile ist unter dem Fensterrand geparkt, bis der Hero-Fuß oben aus dem Bild
  // ist. Das kostet nichts pro Frame und kann nie zwei Pillen gleichzeitig zeigen: die
  // Bedingung hängt an der Unterkante des Heros, nicht an einem Prozentwert.
  useEffect(() => {
    const el = pilleFeld.current;
    if (!el) return;
    const frei = (ja: boolean) => document.body.classList.toggle("faden-eingabe-frei", ja);
    if (!("IntersectionObserver" in window)) { frei(true); return () => frei(false); }
    const beobachter = new IntersectionObserver(([e]) => frei(!e.isIntersecting), { threshold: 0 });
    beobachter.observe(el);
    return () => { beobachter.disconnect(); frei(false); };
  }, []);

  // 🚨 Kein Einfaden mehr (Wunsch vom 13.09.2026): „Alles soll sofort da sein."
  // Hier standen Andock-Verzögerungen von 1,9 bis 2,2 s je Kachel, ein Zähler, der die
  // Dokumentenzahl über 2,6 s hochzählte, und ein CTA, der nach 2,2 s erschien. Der
  // Landing-Hero ist das Erste, was der Leser sieht — er soll ihn lesen können, nicht
  // beim Aufbauen zusehen. Geblieben ist nur Leos Schreibmaschine weiter unten im Faden.
  const senden = (e: React.FormEvent) => { e.preventDefault(); const q = wert.trim(); if (!q) return; setWert(""); fragen(q); };
  const werkzeug = (e: React.MouseEvent, key: string) => { e.preventDefault(); blattOeffnen("finanztools", key); window.scrollTo({ top: 0 }); };
  const entdecken = () => {
    const ziel = document.getElementById("kapitel-live");
    if (!ziel) return;
    const kopf = document.getElementById("kopf")?.offsetHeight || 64;
    window.scrollTo({ top: ziel.getBoundingClientRect().top + window.scrollY - kopf, behavior: reduzierteBewegung() ? "auto" : "smooth" });
  };
  return (
    <section ref={hero} className="hero-landing" aria-label="Einstieg">
      <div className="hero-landing__mitte">
        <div className="landing-oben">
          <div className="landing-zier"><i /><Spark /><i /></div>
          <span className="landing-kicker">Das digitale Finanzmagazin</span>
          <h1>Fragen Sie Ihren persönlichen Versicherungsberater Leo</h1>
        </div>
        {/* Der Wächter: solange die Pille im Bild ist, bleibt die Eingabe unten geparkt. */}
        <div className="hero-landing__pille" ref={pilleFeld}>
          <div className="suchpille-wrap">
            <FieldOutline radius={35} gap={4} mess={pille} />
            <form ref={pille} onSubmit={senden} autoComplete="off" className={"suchpille" + (wert ? " hat-text" : "")}>
              <div className="suchpille__feld">
                <label className="sr" htmlFor="hero-frage">Fragen Sie Leo oder suchen Sie im Bestand</label>
                <textarea
                  id="hero-frage"
                  ref={feld}
                  rows={1}
                  placeholder="Sende Leo eine Nachricht ..."
                  autoComplete="off"
                  value={wert}
                  onChange={(e) => { setWert(e.target.value); const ta = e.currentTarget; ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 66)}px`; }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); senden(e); } }}
                />
                <div className="suchpille__fuss">
                  <VersichererSelect value={versicherer} onChange={setVersicherer} />
                </div>
                <button type="submit" className="suchpille__senden" aria-label="Nachricht senden">
                  <LeoChatSendButton status="ready" />
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="landing-unten">
          <div className="werkzeugreihe">
            {WERKZEUGE.map((w) => (
              <Link
                key={w.key}
                className="werkzeug-k"
                href="/finanztools"
                onClick={(e) => werkzeug(e, w.key)}
                /* Der Ton der Spalte: Kicker im Hover, Puls des Punktes, Unterstrich. */
                style={{ ["--ton" as string]: `var(--tool-${w.key})` } as React.CSSProperties}
              >
                <span className="kicker kicker--tool"><i className={`dot dot--${w.key}`} />{w.name}</span>
                <b>{zahlen?.[w.key] ?? w.zahl}</b>
                <span className="werkzeug-k__sub">{w.text}</span>
                <i className="werkzeug-k__strich" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <button type="button" className="hero-cta" onClick={entdecken}>Finanzleser entdecken<i>↓</i></button>
    </section>
  );
}
