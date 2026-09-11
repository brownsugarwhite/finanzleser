"use client";

/**
 * Die Faden-Hülle um jede Seite: Kopf mit Register und Blatt, Randspalten, Strom mit
 * Eingabe, Fußnote. Unter 1440 px werden die Randspalten zu Schubladen, unter 900 px
 * ersetzt das mobile Menü das Register.
 */
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navItems";
import type { MegamenuPreload } from "@/lib/wordpress";
import type { Level } from "@/lib/faden/optionen";
import type { HeroZahlen } from "./hero/HeroLanding";
import FadenProvider from "./FadenProvider";
import Kopf from "./Kopf";
import Strom from "./Strom";
import RandLinks from "./RandLinks";
import RandRechts from "./RandRechts";
import Eingabe from "./Eingabe";
import Fussnote from "./Fussnote";
import Menue from "./kopf/Menue";
import BegriffMenue from "./glossar/BegriffMenue";
import Lesestelle from "./Lesestelle";
import TeilenDialog from "./TeilenDialog";
import Kulissen from "./Kulissen";
import Fortschritt from "./Fortschritt";
import HeroLanding from "./hero/HeroLanding";
import SchaukastenKnopf from "./SchaukastenKnopf";
import { SCHAUKASTEN_AKTIV } from "@/lib/faden/flag";

export default function FadenShell({ children, nav, preload, level, heroZahlen }: { children: ReactNode; nav: NavItem[]; preload: MegamenuPreload; level?: Level[]; heroZahlen?: HeroZahlen }) {
  const [schublade, setSchublade] = useState<"links" | "rechts" | null>(null);
  const [menue, setMenue] = useState(false);
  const pathname = usePathname();
  // 🚨 Der Landing-Hero steht als eigene Sektion VOR dem Raster — genau wie im Prototyp.
  //
  // Bis zum 10.09.2026 lag er im Strom, also INNERHALB der Mittelspalte. Damit begann er
  // erst unterhalb des Spaltenvorlaufs und war „100dvh minus Kopfhöhe" hoch — nie eine
  // echte Viewport-Sektion: beim Laden lugten die ersten Fadenelemente schon herein, und
  // ein paar Pixel Scrollen rückten die Eingabe aus der Mitte. Hier oben ist er einfach
  // 100 dvh hoch und volle Breite, der klebende Kopf liegt darüber.
  //
  // Der Riegel merkt sich, dass der Faden auf der Startseite begonnen hat: einmal
  // gesetzt, bleibt der Hero oben, egal wohin der Leser weiterblättert. Er lebt bewusst
  // NUR im Arbeitsspeicher — wer über einen Link von außen hereinkommt (oder neu lädt),
  // beginnt seinen Faden bei dem Kapitel, das er aufgerufen hat, ohne Hero darüber.
  const [heroBleibt, setHeroBleibt] = useState(false);
  useEffect(() => { if (pathname === "/") setHeroBleibt(true); }, [pathname]);
  const zeigtHero = pathname === "/" || heroBleibt;
  const zu = () => setSchublade(null);
  // 🚨 `--kopf-h` war bis hierher nur ein Rückfallwert (64 px) — gesetzt hat ihn niemand.
  // Daran hängen der Klebebereich der Randspalten, die Sprungziele und jetzt auch der
  // Hero, der um genau diese Höhe nach oben unter den Kopf gezogen wird. Also einmal
  // messen und mitführen, statt zu hoffen, dass 64 stimmt.
  useEffect(() => {
    const k = document.getElementById("kopf");
    if (!k) return;
    const messen = () => document.documentElement.style.setProperty("--kopf-h", `${Math.round(k.offsetHeight)}px`);
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(k);
    return () => ro.disconnect();
  }, []);

  // Escape schließt Menü und Schubladen (wie im Prototyp).
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenue(false); setSchublade(null); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);
  return (
    <FadenProvider level={level}>
      <div className="faden-shell">
        <Kopf nav={nav} preload={preload} onMenue={() => setMenue(true)} />
        <Menue offen={menue} onZu={() => setMenue(false)} onRand={(s) => setSchublade(s)} />
        {zeigtHero && <HeroLanding zahlen={heroZahlen} />}
        <main className="faden" id="faden">
          <RandLinks mobil={schublade === "links"} onZu={zu} />
          <Fortschritt />
          {schublade && <div className="schublade" onClick={zu} />}
          <div id="mitte">
            <div className="mobil-leiste">
              <button type="button" onClick={() => setSchublade("links")}><i>☰</i> Verlauf</button>
              <button type="button" onClick={() => setSchublade("rechts")}>Glossar <i>✦</i></button>
            </div>
            <Strom>{children}</Strom>
            <Eingabe />
          </div>
          <RandRechts mobil={schublade === "rechts"} onZu={zu} />
          {/* 🚨 Die Fußnote steht IM Raster, als zweite Zeile über alle Spalten, und die
              Randspalten spannen beide Zeilen. Nur so reicht der Klebebereich der Ränder bis
              ans Ende des Dokuments — stand die Fußnote hinter dem Raster, schob sie am
              Fadenende die klebende Randspalte um ihre Höhe nach oben (gemessen 10.09.2026:
              Oberkante −129 … 80 px, während Leo schrieb). */}
          <Fussnote />
        </main>
        <BegriffMenue />
        <Lesestelle />
        <TeilenDialog />
        <Kulissen />
        {SCHAUKASTEN_AKTIV && <SchaukastenKnopf />}
      </div>
    </FadenProvider>
  );
}
