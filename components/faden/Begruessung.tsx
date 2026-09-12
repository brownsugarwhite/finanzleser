"use client";

/**
 * Leos Begrüßung auf der Landing — die Schreibmaschine im Gruß, sonst nichts.
 *
 * 🚨 Bis zum 12.09.2026 hat diese Hülle den halben Faden zurückgehalten: Nach der
 * Hydration setzte sie Kiosk, Kopfblatt, Kassensturz, Spiel und Finanzwort auf `hidden`
 * und gab sie erst gestaffelt frei, ausgelöst von einem Scroll-Listener. Wer
 * herunterscrollte, sah leere Fläche und dann Nachrücken — und `angehaengt(finanzwort)`
 * riss ihn am Ende auch noch an eine andere Stelle. Der Wunsch vom 12.09. ist eindeutig:
 * beim ersten Runterscrollen steht alles sofort da, außer es hat eine eigene
 * Intro-Animation. Leos Schreiben ist die einzige.
 *
 * Was bleibt: der Auslöser des Prototyps (Oberkante des lebenden Kapitels < 60 % der
 * Fensterhöhe), 250 ms Tippindikator, dann die Schreibmaschine. `prefers-reduced-motion`
 * überspringt beides.
 *
 * SEO bleibt unberührt: Der Server liefert den vollständigen Text; ohne JavaScript
 * passiert hier gar nichts.
 */
import { useEffect, useRef } from "react";
import { merkeKnoten } from "@/lib/faden/scrollen";
import { tippen } from "@/lib/faden/tippen";

const PAUSE = 250;

function reduziert(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Begruessung({ children }: { children: React.ReactNode }) {
  const huelle = useRef<HTMLDivElement | null>(null);
  const gelaufen = useRef(false);

  useEffect(() => {
    const wurzel = huelle.current;
    if (!wurzel || gelaufen.current) return;

    const gruss = wurzel.querySelector<HTMLElement>("#leo-gruss");
    const text = gruss?.querySelector<HTMLElement>("p");
    if (!gruss || !text) return;
    // Ohne Bewegung wird nicht getippt — dann bleibt der Absatz einfach stehen.
    if (reduziert()) { merkeKnoten(gruss); return; }

    // Ab hier ist JavaScript da: den Absatz leeren und neu schreiben.
    const vollHtml = text.innerHTML;
    // 🚨 Der Absatz fällt beim Leeren auf null zusammen und wächst beim Tippen wieder auf.
    // Früher fiel das nicht auf, weil alles darunter versteckt war; jetzt steht der Kiosk
    // direkt darunter und ruckt. Die gemessene Höhe hält den Platz, bis der Text steht.
    text.style.minHeight = `${text.getBoundingClientRect().height}px`;
    text.innerHTML = "";

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
      await new Promise((r) => setTimeout(r, PAUSE));
      if (abgebrochen) return;
      tippt.remove();
      await tippen(text, vollHtml);
      if (abgebrochen) return;
      text.style.minHeight = "";
      // 🚨 `merkeKnoten` bleibt: ohne einen bekannten „letzten Knoten" liefert `folgt()`
      // dauerhaft true, und jede spätere Leo-Antwort risse den Leser ans Fadenende —
      // egal, wo er gerade liest.
      merkeKnoten(gruss);
    };

    /**
     * Auslöser wie im Prototyp (06-js-boot.html): Oberkante des Fadens < 60 % der
     * Fensterhöhe.
     *
     * 🚨 Bezugspunkt ist das lebende Kapitel, NICHT `#faden`: in der Umsetzung umschließt
     * `main#faden` die ganze Hülle inklusive Hero — seine Oberkante liegt immer bei 0,
     * die Begrüßung liefe sofort los.
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
