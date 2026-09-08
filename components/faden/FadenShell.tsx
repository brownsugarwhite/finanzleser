"use client";

/**
 * Die Faden-Hülle um jede Seite: Kopf mit Register und Blatt, Randspalten, Strom mit
 * Eingabe, Fußnote. Unter 1440 px werden die Randspalten zu Schubladen, unter 900 px
 * ersetzt das mobile Menü das Register.
 */
import { useState, type ReactNode } from "react";
import type { NavItem } from "@/lib/navItems";
import type { MegamenuPreload } from "@/lib/wordpress";
import type { Level } from "@/lib/faden/optionen";
import FadenProvider from "./FadenProvider";
import Kopf from "./Kopf";
import Strom from "./Strom";
import RandLinks from "./RandLinks";
import RandRechts from "./RandRechts";
import Eingabe from "./Eingabe";
import Fussnote from "./Fussnote";
import Menue from "./kopf/Menue";
import BegriffMenue from "./glossar/BegriffMenue";

export default function FadenShell({ children, nav, preload, level }: { children: ReactNode; nav: NavItem[]; preload: MegamenuPreload; level?: Level[] }) {
  const [schublade, setSchublade] = useState<"links" | "rechts" | null>(null);
  const [menue, setMenue] = useState(false);
  const zu = () => setSchublade(null);
  return (
    <FadenProvider level={level}>
      <div className="faden-shell">
        <Kopf nav={nav} preload={preload} onMenue={() => setMenue(true)} />
        <Menue offen={menue} onZu={() => setMenue(false)} onRand={(s) => setSchublade(s)} />
        <main className="faden" id="faden">
          <RandLinks mobil={schublade === "links"} onZu={zu} />
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
        </main>
        <Fussnote />
        <BegriffMenue />
      </div>
    </FadenProvider>
  );
}
