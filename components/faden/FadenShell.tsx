"use client";

/**
 * Die Faden-Hülle um jede Seite: Kopf, Randspalten, Strom mit Eingabe, Fußnote.
 * Unter 1440 px werden die Randspalten zu Schubladen (mobile Leiste über dem Strom).
 */
import { useState, type ReactNode } from "react";
import FadenProvider from "./FadenProvider";
import Kopf from "./Kopf";
import Strom from "./Strom";
import RandLinks from "./RandLinks";
import RandRechts from "./RandRechts";
import Eingabe from "./Eingabe";
import Fussnote from "./Fussnote";

export default function FadenShell({ children }: { children: ReactNode }) {
  const [schublade, setSchublade] = useState<"links" | "rechts" | null>(null);
  const zu = () => setSchublade(null);
  return (
    <FadenProvider>
      <div className="faden-shell">
        <Kopf />
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
      </div>
    </FadenProvider>
  );
}
