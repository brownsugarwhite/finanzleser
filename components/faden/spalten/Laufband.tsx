"use client";

/**
 * Laufband im Zeitungskopf-Satz: eine Zeile zwischen zwei Doppellinien, die Schrift
 * wandert durch eine Reihe Punkte, und die Punkte weichen ihr aus.
 *
 * Das Verfahren stammt aus dem alten Kopfbanner (components/ui/TopBanner.tsx) und ist
 * hier auf den Faden übertragen: dieselbe Mechanik, aber Tinte statt Grau und die
 * Doppellinie der Übergabe statt der alten 3-px-Balken.
 *
 * 🚨 Drei Dinge, ohne die es entweder ruckelt oder heiß läuft:
 *  1. **Zwei Kopien des Textes** in einem Gleis, das sich linear verschiebt. Eine Kopie
 *     allein hinterlässt eine Lücke, sobald sie rechts hinausläuft.
 *  2. **Die Punkte werden nicht verschoben, sondern skaliert.** Bei jedem Bild wird
 *     geprüft, welche Punkte gerade unter dem Text liegen; die schrumpfen auf 0. Nur so
 *     bleibt die Punktreihe ruhig stehen, während der Text darüber wandert.
 *  3. **Beides läuft nur, solange das Band im Bild ist** (IntersectionObserver). Sonst
 *     misst der Bildtakt dauerhaft 120 Punkte, auch wenn längst niemand hinsieht.
 *
 * `prefers-reduced-motion` hält das Band an; die Zeile bleibt mittig stehen und lesbar.
 */
import { useLayoutEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";

const PUNKT = 3;
const PUNKTE = 120;
const TEMPO = 40; // px je Sekunde
const LUFT_VORN = 4;
const LUFT_HINTEN = 10;

export default function Laufband({ text }: { text: string }) {
  const reihe = useRef<HTMLDivElement>(null);
  const gleis = useRef<HTMLDivElement>(null);
  const schrift = useRef<HTMLSpanElement>(null);
  const punkte = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const g = gleis.current, r = reihe.current, t = schrift.current;
    if (!g || !r || !t) return;

    const textBreite = t.offsetWidth;
    const reiheBreite = r.offsetWidth;
    const luecke = Math.max(0, reiheBreite - textBreite);
    (g.children[1] as HTMLElement).style.width = luecke + "px";

    const versatz = textBreite + luecke;
    const start = (reiheBreite - textBreite) / 2 - versatz;
    const strecke = Math.max(reiheBreite, versatz);
    gsap.set(g, { x: start });
    const lauf = gsap.to(g, { x: start + strecke, duration: strecke / TEMPO, ease: "none", repeat: -1 });

    const takt = () => {
      const felder = [...g.querySelectorAll<HTMLElement>("[data-kopie]")].map((el) => {
        const b = el.getBoundingClientRect();
        return { links: b.left - LUFT_VORN, rechts: b.right + LUFT_HINTEN };
      });
      for (const p of punkte.current) {
        if (!p) continue;
        const x = p.getBoundingClientRect().left + PUNKT / 2;
        const drunter = felder.some((f) => x >= f.links && x <= f.rechts);
        const stand = p.dataset.v;
        if (drunter && stand !== "0") { p.dataset.v = "0"; gsap.to(p, { scale: 0, duration: .3, overwrite: true }); }
        else if (!drunter && stand !== "1") { p.dataset.v = "1"; gsap.to(p, { scale: 1, duration: .35, overwrite: true }); }
      }
    };
    takt();
    gsap.set(r, { opacity: 1 });

    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let laeuft = false;
    const an = () => { if (laeuft || ruhig) return; laeuft = true; gsap.ticker.add(takt); lauf.resume(); };
    const aus = () => { if (!laeuft) return; laeuft = false; gsap.ticker.remove(takt); lauf.pause(); };
    if (ruhig) lauf.pause();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? an() : aus()), { threshold: 0 });
    io.observe(r);

    return () => { io.disconnect(); lauf.kill(); gsap.ticker.remove(takt); };
  }, [text]);

  return (
    <div className="laufband" aria-label={text}>
      <i className="doppellinie" />
      <div className="laufband__reihe" ref={reihe}>
        <div className="laufband__punkte" aria-hidden="true">
          {Array.from({ length: PUNKTE }, (_, i) => (
            <span key={i} data-v="1" ref={(el) => { punkte.current[i] = el; }} />
          ))}
        </div>
        <div className="laufband__gleis" ref={gleis}>
          <span data-kopie="" aria-hidden="true">{text}</span>
          <div />
          <span data-kopie="" ref={schrift}>{text}</span>
        </div>
      </div>
      <i className="doppellinie doppellinie--gedreht" />
    </div>
  );
}
