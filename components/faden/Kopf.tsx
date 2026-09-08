"use client";

/**
 * Zeitungskopf: Logo · Register mit Pille · Lesezeichen (Newsletter · Aktenkoffer · Konto);
 * darunter das Registerblatt. Sticky, transparent über dem progressiven Blur.
 */
import Link from "next/link";
import type { NavItem } from "@/lib/navItems";
import type { MegamenuPreload } from "@/lib/wordpress";
import { useFaden } from "./FadenProvider";
import Register from "./kopf/Register";
import Blatt from "./kopf/Blatt";

export default function Kopf({ nav, preload, onMenue }: { nav: NavItem[]; preload: MegamenuPreload; onMenue: () => void }) {
  const { koffer, navigieren, blattOeffnen } = useFaden();
  const zumWochenbrief = () => {
    const ziel = document.querySelector<HTMLElement>("#wochenbrief, .wb-rail");
    if (ziel) ziel.scrollIntoView({ block: "center", behavior: "smooth" });
    ziel?.querySelector<HTMLInputElement>("input[type=email]")?.focus();
  };
  return (
    <>
      <div className="blur" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
      <header className="kopf" id="kopf">
        <div className="kopf__innen">
          <div className="kopf__zeile">
            <Link className="logo" href="/" aria-label="finanzleser" onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigieren("/"); } }}><img src="/icons/fl_logo.svg" alt="finanzleser" /></Link>
            <Register />
            <div className="lesezeichen" aria-label="Lesezeichen">
              <button type="button" className="btn--menue" onClick={onMenue} aria-label="Menü"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
              <button type="button" className="lz-wort" onClick={zumWochenbrief} title="Leos Wochenbrief: donnerstags, ein Feld, kein Formular">Newsletter</button>
              <button type="button" className="lz-icon" id="kofferBtn" aria-label="Aktenkoffer" title="Aktenkoffer" onClick={() => navigieren("/plus/aktenkoffer")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 12h18M12 11v3" /></svg>
                {koffer.length > 0 && <i className="lz-zahl" id="kofferZahl">{koffer.length}</i>}
              </button>
              <button type="button" className="lz-icon" id="plusBtn" aria-label="Finanzleser Plus · Mein Bereich" title="Finanzleser Plus · Mein Bereich" onClick={() => blattOeffnen("plus")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
              </button>
            </div>
          </div>
        </div>
        <Blatt nav={nav} preload={preload} />
      </header>
    </>
  );
}
