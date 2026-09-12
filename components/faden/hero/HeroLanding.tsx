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
 * Dazu aus dem Prototyp-Gerüst (03c-hero.html:14–16, 42–43): unter der Pille die
 * Werkzeugreihe (Rechner · Vergleiche · Checklisten, docken beim Laden an, Klick öffnet
 * das Finanztools-Registerblatt), die Dokumentenzahl zählt von 0 auf 12.480 hoch, und
 * unten der CTA „Finanzleser entdecken ↓“, der nach 2,2 s erscheint und zu „Heute“ scrollt.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFaden } from "@/components/faden/FadenProvider";
import Spark from "@/components/ui/Spark";
import FieldOutline from "@/components/ui/FieldOutline";
import LeoChatSendButton from "@/components/ui/LeoChatSendButton";
import VersichererSelect from "@/components/ui/VersichererSelect";
import type { Versicherer } from "@/lib/versicherer";
import { reduzierteBewegung } from "@/lib/faden/belohnung";
import { DOKUMENTE } from "@/lib/faden/bestand";
import { Trenner, useHoverBox } from "@/components/faden/spalten/HoverBox";

/** ease() des Prototyps (03b-intro.html:6), für den Zähler. */
const glatt = (t: number) => t * t * (3 - 2 * t);

/** Werkzeugreihe (TOOLS, 03c-hero.html:7). Reiter-Schlüssel wie REITER in kopf/Blatt.tsx; Zahlen wie im Prototyp. */
const WERKZEUGE = [
  { key: "rechner", name: "Rechner", zahl: 56, text: "Unterhalt, Rente, Steuer, Kredit", ziel: "Zu den Rechnern" },
  { key: "vergleich", name: "Vergleiche", zahl: 43, text: "Tarife nebeneinander", ziel: "Zu den Vergleichen" },
  { key: "checkliste", name: "Checklisten", zahl: 207, text: "Schritt für Schritt, als PDF", ziel: "Zu den Checklisten" },
] as const;
/** Andocken wie im Prototyp-Hero „Zeitung“ (03c-hero.html:73): Startversatz und Verzögerung (s) je Kachel. */
const ANDOCK_START = ["translate3d(0,40px,0)", "translate3d(0,54px,0)", "translate3d(0,40px,0)"];
const ANDOCK_NACH = [1.9, 2.05, 2.2];

const ZAEHL_DAUER = 2.6; // s (zaehler(), 03c-hero.html:43)
const CTA_NACH = 2200; // ms (03c-hero.html:16)

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
  const fuss = useRef<HTMLElement>(null);
  const pille = useRef<HTMLFormElement>(null);
  const feld = useRef<HTMLTextAreaElement>(null);
  const [versicherer, setVersicherer] = useState<Versicherer | null>(null);
  const reihe = useRef<HTMLDivElement>(null);
  const zahl = useRef<HTMLElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  useHoverBox(reihe, ".werkzeug-k", { radius: 14, oben: 16, unten: 16 });

  // Die Eingabe des Fadens fährt von unten herein, sobald der Hero ganz durch ist.
  //
  // 🚨 Hier stand bis zum 12.09.2026 ein scrollgebundener rAF-Loop: Die Suchpille des
  // Heros flog per `position: fixed` in die untere Eingabezeile, Titel und Werkzeugreihe
  // verblassten dabei. Der Hero scrollt jetzt schlicht weg (Wunsch vom 12.09.), und die
  // untere Zeile ist unter dem Fensterrand geparkt, bis der Hero-Fuß oben aus dem Bild
  // ist. Das kostet nichts pro Frame und kann nie zwei Pillen gleichzeitig zeigen: die
  // Bedingung hängt an der Unterkante des Heros, nicht an einem Prozentwert.
  useEffect(() => {
    const el = fuss.current;
    if (!el) return;
    const frei = (ja: boolean) => document.body.classList.toggle("faden-eingabe-frei", ja);
    if (!("IntersectionObserver" in window)) { frei(true); return () => frei(false); }
    const beobachter = new IntersectionObserver(([e]) => frei(!e.isIntersecting), { threshold: 0 });
    beobachter.observe(el);
    return () => { beobachter.disconnect(); frei(false); };
  }, []);

  // Beim Laden: Kacheln docken an (kachelnAndocken), der Zähler läuft (zaehler), der CTA blendet ein.
  useLayoutEffect(() => {
    const reduziert = reduzierteBewegung();
    const timer: ReturnType<typeof setTimeout>[] = [];
    const kacheln = Array.from(reihe.current?.querySelectorAll<HTMLElement>(".werkzeug-k") ?? []);
    // Die Trennlinien gehören zu den Kacheln: Trenner i-1 steht zwischen Kachel i-1 und i
    // und kommt mit der ANKOMMENDEN Kachel i. Sonst stünden drei Striche im leeren Raum,
    // bevor überhaupt etwas angedockt ist.
    const trenner = Array.from(reihe.current?.querySelectorAll<HTMLElement>(".trenner--voll") ?? []);
    if (reduziert) {
      kacheln.forEach((k) => { k.style.transition = "none"; k.classList.add("da"); });
      // Die Bewegung sitzt am `::before`, nicht am Element — abgeschaltet wird sie per Media-Query in faden-hover.css.
      trenner.forEach((t) => t.classList.add("da"));
    } else {
      kacheln.forEach((k, i) => { k.style.transform = ANDOCK_START[i] ?? ""; });
      timer.push(setTimeout(() => {
        kacheln.forEach((k, i) => {
          timer.push(setTimeout(() => { k.classList.add("da"); trenner[i - 1]?.classList.add("da"); }, (ANDOCK_NACH[i] ?? 2.2) * 1000));
        });
      }, 40));
    }
    timer.push(setTimeout(() => cta.current?.classList.add("da"), reduziert ? 0 : CTA_NACH));

    const z = zahl.current;
    const fmt = (v: number) => v.toLocaleString("de-DE");
    let raf = 0;
    if (z) {
      if (reduziert) z.textContent = fmt(DOKUMENTE);
      else {
        const t0 = performance.now();
        z.textContent = fmt(0);
        const zaehlen = () => {
          const t = (performance.now() - t0) / 1000;
          z.textContent = fmt(Math.round(DOKUMENTE * glatt(Math.min(1, t / ZAEHL_DAUER))));
          if (t < ZAEHL_DAUER) raf = requestAnimationFrame(zaehlen);
        };
        raf = requestAnimationFrame(zaehlen);
      }
    }
    return () => {
      timer.forEach(clearTimeout);
      if (raf) cancelAnimationFrame(raf);
      if (z) z.textContent = fmt(DOKUMENTE);
    };
  }, []);

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
        <div className="hero-landing__pille">
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
          <div className="werkzeugreihe" ref={reihe}>
            {WERKZEUGE.map((w, i) => (
              <Fragment key={w.key}>
                {i > 0 && <Trenner voll />}
                <Link className="werkzeug-k" href="/finanztools" onClick={(e) => werkzeug(e, w.key)}>
                  <span className="kicker kicker--tool"><i className={`dot dot--${w.key}`} />{w.name}</span>
                  <b>{zahlen?.[w.key] ?? w.zahl}<small>im Faden</small></b>
                  <span>{w.text}</span>
                  <span className="pfeil-link">{w.ziel}<i /></span>
                </Link>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <button type="button" className="hero-cta" ref={cta} onClick={entdecken}>Finanzleser entdecken<i>↓</i></button>
      {/* 1-px-Wächter an der Unterkante: solange er im Bild ist, bleibt die Eingabe unten geparkt. */}
      <i ref={fuss} className="hero-fuss" aria-hidden="true" />
    </section>
  );
}
