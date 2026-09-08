"use client";

/**
 * Leos Begrüßung auf der Landing — Inszenierung nach dem Prototyp
 * (`docs/prototype/src/03-js-core.html` `begruessung`/`leoNachricht`/`tippen`,
 * Auslöser in `06-js-boot.html`).
 *
 * 🚨 Der Unterschied zur Vorlage war nicht das *Was*, sondern das *Wann*: In der
 * Umsetzung standen Gruß, Spalten und Finanzwort sofort vollständig im SSR-HTML.
 * Im Prototyp beginnt Leo erst zu schreiben, wenn der Leser den Faden erreicht —
 * mit Tippindikator, dann Schreibmaschine. Danach kommen die Rubrikenspalten
 * **leise** (ohne Sprung) und zuletzt das Finanzwort.
 *
 * SEO bleibt unberührt: Der Server liefert weiter den vollständigen Text. Erst nach
 * der Hydration blendet diese Hülle ihn aus und spielt die Abfolge nach. Ohne
 * JavaScript — also für Crawler und bei abgeschaltetem JS — passiert nichts und
 * alles steht sofort da.
 *
 * Abfolge und Werte 1:1 aus dem Prototyp:
 *   Auslöser  Faden-Oberkante < 60 % der Fensterhöhe (einmalig)
 *   Pause     250 ms Tippindikator
 *   Tippen    5 Zeichen je 10 ms, danach das volle HTML (Links bleiben erhalten)
 *   Spalten   leise angehängt (kein Scroll)
 *   Finanzwort danach, mit der normalen Scroll-Regel
 *
 * `prefers-reduced-motion` überspringt Tippindikator und Schreibmaschine.
 */
import { useEffect, useRef } from "react";
import { angehaengt, merkeKnoten } from "@/lib/faden/scrollen";

const PAUSE = 250;

function reduziert(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Schreibmaschine wie im Prototyp (`tippen`): 5 Zeichen je 10 ms, dann das echte HTML. */
function tippen(ziel: HTMLElement, html: string): Promise<void> {
  if (reduziert()) { ziel.innerHTML = html; return Promise.resolve(); }
  const mess = document.createElement("div");
  mess.innerHTML = html;
  const voll = mess.innerText;
  const p = document.createElement("p");
  ziel.replaceChildren(p);
  return new Promise((fertig) => {
    let i = 0;
    const schritt = () => {
      i += 5;
      p.textContent = voll.slice(0, i);
      if (i < voll.length) setTimeout(schritt, 10);
      else { ziel.innerHTML = html; fertig(); }
    };
    schritt();
  });
}

export default function Begruessung({ children }: { children: React.ReactNode }) {
  const huelle = useRef<HTMLDivElement | null>(null);
  const gelaufen = useRef(false);

  useEffect(() => {
    const wurzel = huelle.current;
    if (!wurzel || gelaufen.current) return;

    const gruss = wurzel.querySelector<HTMLElement>("#leo-gruss");
    const spalten = wurzel.querySelector<HTMLElement>(".spalten-kasten, .spalten");
    const finanzwort = wurzel.querySelector<HTMLElement>(".meldung");
    const text = gruss?.querySelector<HTMLElement>("p");
    if (!gruss || !text) return;

    // Ab hier ist JavaScript da: Abfolge übernehmen. (Ohne JS bleibt alles sichtbar.)
    const vollHtml = text.innerHTML;
    text.innerHTML = "";
    const werkzeuge = gruss.querySelector<HTMLElement>(".werkzeuge");
    if (werkzeuge) werkzeuge.hidden = true;
    if (spalten) spalten.hidden = true;
    if (finanzwort) finanzwort.hidden = true;

    const tippt = document.createElement("div");
    tippt.className = "tippt";
    tippt.setAttribute("aria-label", "Leo schreibt");
    tippt.innerHTML = "<i></i><i></i><i></i>";
    text.after(tippt);

    let abgebrochen = false;

    const spielen = async () => {
      if (gelaufen.current) return;
      gelaufen.current = true;
      window.removeEventListener("scroll", pruefen);
      if (!reduziert()) await new Promise((r) => setTimeout(r, PAUSE));
      if (abgebrochen) return;
      tippt.remove();
      await tippen(text, vollHtml);
      if (abgebrochen) return;
      if (werkzeuge) werkzeuge.hidden = false;
      merkeKnoten(gruss);
      // Spalten „leise": sie erscheinen, aber der Faden springt nicht (Prototyp: leise: true)
      if (spalten) { spalten.hidden = false; angehaengt(spalten, { leise: true }); }
      // Finanzwort zuletzt, mit der normalen Scroll-Regel
      if (finanzwort) { finanzwort.hidden = false; angehaengt(finanzwort); }
    };

    /**
     * Auslöser wie im Prototyp (06-js-boot.html): Oberkante des Fadens < 60 % der
     * Fensterhöhe.
     *
     * 🚨 Bezugspunkt ist das lebende Kapitel, NICHT `#faden`: im Prototyp ist `#faden`
     * der Faden unterhalb des Intros, in der Umsetzung umschließt `main#faden` die
     * ganze Hülle inklusive Hero — seine Oberkante liegt immer bei 0, die Begrüßung
     * liefe sofort los.
     */
    const pruefen = () => {
      const bezug = document.getElementById("kapitel-live") || wurzel;
      if (bezug.getBoundingClientRect().top < window.innerHeight * 0.6) spielen();
    };

    pruefen();                                        // schon weit genug unten (z. B. Rücksprung)
    window.addEventListener("scroll", pruefen, { passive: true });
    return () => { abgebrochen = true; window.removeEventListener("scroll", pruefen); };
  }, []);

  return <div ref={huelle}>{children}</div>;
}
