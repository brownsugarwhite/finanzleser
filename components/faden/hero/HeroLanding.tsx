"use client";

/**
 * Landing-Hero wie im Prototyp (Hero „Landing“): Zierlinie mit Stern, Kicker, Titel,
 * die Suchpille exakt auf der Bildschirmmitte, ein Satz. Ruhig, viel Papier. Beim
 * Scrollen verblassen Titel und Satz, die Pille löst sich und fliegt an ihren Platz
 * unten; dort übernimmt die echte Eingabe des Fadens (gleiche Gestalt). Solange der
 * Hero im Bild ist, bleiben Randspalten und Eingabe weg (body.faden-hero-sichtbar).
 * Enter fragt Leo.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { useFaden } from "@/components/faden/FadenProvider";
import Spark from "@/components/ui/Spark";
import FieldOutline from "@/components/ui/FieldOutline";

const seg = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Der Hero gehört nur an den Anfang eines Fadens; kommt man später zur Startseite zurück, hängt sich nur „Heute“ an. */
export default function HeroLanding() {
  const { verlauf } = useFaden();
  if (verlauf.length) return null;
  return <HeroInnen />;
}

function HeroInnen() {
  const { fragen } = useFaden();
  const [wert, setWert] = useState("");
  const hero = useRef<HTMLElement>(null);
  const oben = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const start = useRef<{ l: number; t: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const flug = (p: number) => {
      const w = wrap.current;
      const ziel = document.getElementById("fadenPille");
      if (!w || !ziel) return;
      if (p > 0.02 && !start.current) {
        const r0 = w.getBoundingClientRect();
        start.current = { l: r0.left, t: r0.top, w: r0.width };
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
      if (sub.current) { sub.current.style.opacity = String(o); sub.current.style.transform = `translateY(${y}px)`; }
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

  const senden = (e: React.FormEvent) => { e.preventDefault(); const q = wert.trim(); if (!q) return; setWert(""); fragen(q); };
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
            <FieldOutline radius={26} gap={4} />
            <form onSubmit={senden} autoComplete="off" className={"suchpille" + (wert ? " hat-text" : "")}>
              <label className="sr" htmlFor="hero-frage">Fragen Sie Leo oder suchen Sie im Bestand</label>
              <input id="hero-frage" type="text" placeholder="Was kann ich für Sie tun?" autoComplete="off" value={wert} onChange={(e) => setWert(e.target.value)} />
              <button type="submit" className="senden">Fragen</button>
            </form>
          </div>
        </div>
        <p className="landing-sub" ref={sub}>Leo hat 12.480 Versicherungs- und Finanzdokumente gelesen und antwortet mit Quelle und Seite.</p>
      </div>
    </section>
  );
}
