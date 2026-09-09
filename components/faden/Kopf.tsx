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
import Pfad from "./kopf/Pfad";
import Lesefortschritt from "./kopf/Lesefortschritt";

export default function Kopf({ nav, preload, onMenue }: { nav: NavItem[]; preload: MegamenuPreload; onMenue: () => void }) {
  const { koffer, navigieren, blattOeffnen } = useFaden();
  const zumWochenbrief = () => {
    const ziel = document.querySelector<HTMLElement>("#wochenbrief, .wb-rail");
    if (ziel) ziel.scrollIntoView({ block: "center", behavior: "smooth" });
    ziel?.querySelector<HTMLInputElement>("input[type=email]")?.focus();
  };
  return (
    <>
      <div className="kopfblur" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
      <header className="kopf" id="kopf">
        <div className="kopf__innen">
          <div className="kopf__zeile">
            <Link className="logo" href="/" aria-label="finanzleser" onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigieren("/"); } }}><img src="/icons/fl_logo.svg" alt="finanzleser" /></Link>
            <Register />
            {/* 🚨 Eigener Wrapper mit `gap: 0`. Die Kopfzeile hat 22 px Abstand zwischen
                ihren Kindern — die rissen die Naht zwischen Zackenkante und Band auf. */}
            <div className="kopf__marke">
            <Pfad />
            {/* Die Zackenkante ist das Lesezeichen, das aus der Zeitung ragt. Das SVG hat
                `preserveAspectRatio="none"` und färbt sich über `--fill-0` — es muss also
                exakt die Höhe des Bands haben, sonst reißt die Kante ab. */}
            <img className="lz-zacken" src="/icons/lesezeichen-spikes.svg" alt="" aria-hidden="true" />
            <div className="lesezeichen" aria-label="Lesezeichen">
              <button type="button" className="lz-wort" onClick={zumWochenbrief} title="Leos Wochenbrief: donnerstags, ein Feld, kein Formular">Newsletter</button>
              <button type="button" className="lz-icon" id="kofferBtn" aria-label="Aktenkoffer" title="Aktenkoffer" onClick={() => navigieren("/plus/aktenkoffer")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 12h18M12 11v3" /></svg>
                {koffer.length > 0 && <i className="lz-zahl" id="kofferZahl">{koffer.length}</i>}
              </button>
              <button type="button" className="lz-icon" id="plusBtn" aria-label="Finanzleser Plus · Mein Bereich" title="Finanzleser Plus · Mein Bereich" onClick={() => blattOeffnen("plus")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
              </button>
              {/* Der Burger steht zuletzt — im Design ist er die äußerste Marke am Rand. */}
              <button type="button" className="lz-icon btn--menue" onClick={onMenue} aria-label="Menü"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
            </div>
            </div>
          </div>
        </div>
        <Lesefortschritt />
        <Blatt nav={nav} preload={preload} />
      </header>
    </>
  );
}
