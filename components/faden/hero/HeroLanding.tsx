"use client";

/**
 * Landing-Hero wie im Prototyp (Hero „Landing“): Zierlinie mit Stern, Kicker, Titel,
 * die Suchpille exakt auf der Bildschirmmitte, ein Satz. Ruhig, viel Papier. Beim
 * Scrollen verblassen Titel und Satz, die Pille löst sich und fliegt an ihren Platz
 * unten; dort übernimmt die echte Eingabe des Fadens (gleiche Gestalt). Solange der
 * Hero im Bild ist, liegt body.faden-hero-sichtbar an — damit blendet faden.css die
 * Eingabe über dem Hero aus. Ränder und Eingabe bleiben stehen, wie im Prototyp.
 * Enter fragt Leo.
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

const seg = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
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
  const oben = useRef<HTMLDivElement>(null);
  const unten = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const pille = useRef<HTMLFormElement>(null);
  const feld = useRef<HTMLTextAreaElement>(null);
  const [versicherer, setVersicherer] = useState<Versicherer | null>(null);
  const reihe = useRef<HTMLDivElement>(null);
  const zahl = useRef<HTMLElement>(null);
  const cta = useRef<HTMLButtonElement>(null);
  const start = useRef<{ l: number; t: number; w: number; h: number } | null>(null);
  useHoverBox(reihe, ".werkzeug-k", { radius: 14, oben: 16, unten: 16 });

  useLayoutEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const flug = (p: number) => {
      const w = wrap.current;
      const ziel = document.getElementById("fadenPille");
      if (!w || !ziel) return;
      if (p > 0.02 && !start.current) {
        const r0 = w.getBoundingClientRect();
        const pille = w.querySelector<HTMLElement>(".suchpille");
        start.current = { l: r0.left, t: r0.top, w: r0.width, h: pille?.getBoundingClientRect().height ?? r0.height };
        w.classList.add("fliegt");
      }
      if (!start.current) return;
      if (p <= 0.02) { w.classList.remove("fliegt"); w.style.cssText = ""; start.current = null; ziel.style.opacity = ""; return; }
      // Ziel ist die echte Zeile, wo immer sie gerade steht (unten angeheftet oder am Ende eines kurzen Fadens).
      const echt = ziel.getBoundingClientRect();
      const zt = echt.top > 0 ? echt.top : window.innerHeight - 14 - w.offsetHeight;
      const u = ease(seg(p, 0.1, 0.88));
      const bogen = Math.sin(u * Math.PI) * 22;
      const an = u >= 0.999;
      w.style.left = `${lerp(start.current.l, echt.left, u)}px`;
      w.style.top = `${lerp(start.current.t, zt, u) + bogen}px`;
      w.style.width = `${lerp(start.current.w, echt.width, u)}px`;
      // 🚨 Auch die HÖHE wandert mit. Oben ist die Pille höher als unten; ohne das hier
      // bliebe sie auf Landing-Maß und spränge am Ende auf die Zeilenhöhe. Die Variable
      // steuert die Mindesthöhe des Feldes (faden.css), der Kasten schrumpft also weich —
      // zusammen mit der Breite wird die Pille auf dem Weg nach unten breiter und flacher.
      const zh = ziel.querySelector<HTMLElement>(".suchpille")?.getBoundingClientRect().height ?? echt.height;
      w.style.setProperty("--pille-h-landing", `${lerp(start.current.h, zh, u)}px`);
      ziel.style.opacity = an ? "" : "0";
      w.style.opacity = an ? "0" : "1";
      w.style.pointerEvents = an ? "none" : "";
    };
    const tick = () => {
      raf = 0;
      const h = hero.current;
      if (!h) return;
      const kopf = document.getElementById("kopf")?.offsetHeight || 64;
      const hoehe = Math.max(1, h.offsetHeight - kopf);
      const oben0 = h.getBoundingClientRect().top + window.scrollY;
      const p = Math.max(0, Math.min(1, (window.scrollY - oben0) / hoehe));
      const o = 1 - seg(p, 0, 0.55);
      const y = -40 * seg(p, 0, 0.6);
      if (oben.current) { oben.current.style.opacity = String(o); oben.current.style.transform = `translateY(${y}px)`; }
      if (unten.current) { unten.current.style.opacity = String(o); unten.current.style.transform = `translateY(${y}px)`; }
      document.body.classList.toggle("faden-hero-sichtbar", p < 0.88);
      if (!reduziert) flug(p); else if (wrap.current) wrap.current.style.opacity = String(o);
    };
    const anstossen = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", anstossen, { passive: true });
    window.addEventListener("resize", anstossen);
    return () => {
      window.removeEventListener("scroll", anstossen);
      window.removeEventListener("resize", anstossen);
      if (raf) cancelAnimationFrame(raf);
      document.body.classList.remove("faden-hero-sichtbar");
      const ziel = document.getElementById("fadenPille");
      if (ziel) ziel.style.opacity = "";
    };
  }, []);

  // Beim Laden: Kacheln docken an (kachelnAndocken), der Zähler läuft (zaehler), der CTA blendet ein.
  useLayoutEffect(() => {
    const reduziert = reduzierteBewegung();
    const timer: ReturnType<typeof setTimeout>[] = [];
    const kacheln = Array.from(reihe.current?.querySelectorAll<HTMLElement>(".werkzeug-k") ?? []);
    if (reduziert) {
      kacheln.forEach((k) => { k.style.transition = "none"; k.classList.add("da"); });
    } else {
      kacheln.forEach((k, i) => { k.style.transform = ANDOCK_START[i] ?? ""; });
      timer.push(setTimeout(() => { kacheln.forEach((k, i) => { timer.push(setTimeout(() => k.classList.add("da"), (ANDOCK_NACH[i] ?? 2.2) * 1000)); }); }, 40));
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
        <div className="landing-oben" ref={oben}>
          <div className="landing-zier"><i /><Spark /><i /></div>
          <span className="landing-kicker">Das digitale Finanzmagazin</span>
          <h1>Fragen Sie Ihren persönlichen Versicherungsberater Leo</h1>
        </div>
        <div className="hero-landing__pille">
          <div className="suchpille-wrap" ref={wrap}>
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
        <div className="landing-unten" ref={unten}>
          <div className="werkzeugreihe" ref={reihe}>
            {WERKZEUGE.map((w, i) => (
              <Fragment key={w.key}>
                {i > 0 && <Trenner />}
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
    </section>
  );
}
