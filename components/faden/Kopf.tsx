"use client";

/**
 * Zeitungskopf: Logo · Register (Ratgeber · Finanztools · Service · Finanzleser Plus) ·
 * Lesezeichen (Newsletter · Aktenkoffer · Konto). Sticky, transparent über dem
 * progressiven Blur. Das Registerblatt (Themen, Listen) kommt in Meilenstein 3;
 * bis dahin führen die Registereinträge auf die bestehenden Übersichtsseiten.
 */
import Link from "next/link";
import { useFaden } from "./FadenProvider";

const REGISTER = [
  { key: "ratgeber", label: "Ratgeber", href: "/" },
  { key: "finanztools", label: "Finanztools", href: "/finanztools" },
  { key: "service", label: "Service", href: "/anbieter" },
  { key: "plus", label: "Finanzleser Plus", href: null },
] as const;

export default function Kopf() {
  const { koffer, toast, navigieren } = useFaden();
  const zumWochenbrief = () => {
    const ziel = document.querySelector<HTMLElement>("#wochenbrief, .wb-rail");
    if (ziel) ziel.scrollIntoView({ block: "center", behavior: "smooth" });
    const feld = ziel?.querySelector<HTMLInputElement>("input[type=email]");
    feld?.focus();
  };
  return (
    <>
      <div className="blur" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><b /></div>
      <header className="kopf" id="kopf">
        <div className="kopf__innen">
          <div className="kopf__zeile">
            <Link className="logo" href="/" aria-label="finanzleser" onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); navigieren("/"); } }}><img src="/icons/fl_logo.svg" alt="finanzleser" /></Link>
            <nav className="register" id="register" aria-label="Register">
              <div className="register__reihe">
                {REGISTER.map((r, i) => (
                  <span key={r.key} className="register__eintrag">
                    {i > 0 && <Spark />}
                    {r.href ? (
                      <a href={r.href} data-key={r.key}>{r.label}</a>
                    ) : (
                      <button type="button" data-key={r.key} onClick={() => toast("Finanzleser Plus kommt mit Stufe 3: Aktenkoffer, Wächter, Wochenbrief.")}>{r.label}</button>
                    )}
                  </span>
                ))}
              </div>
            </nav>
            <div className="lesezeichen" aria-label="Lesezeichen">
              <button type="button" className="lz-wort" onClick={zumWochenbrief} title="Leos Wochenbrief: donnerstags, ein Feld, kein Formular">Newsletter</button>
              <button type="button" className="lz-icon" aria-label="Aktenkoffer" title="Aktenkoffer" onClick={() => toast(koffer.length ? `Im Aktenkoffer: ${koffer.length} ${koffer.length === 1 ? "Eintrag" : "Einträge"}. Sichern kommt mit Finanzleser Plus.` : "Der Aktenkoffer ist noch leer. „In den Aktenkoffer“ steht unter jedem Ratgeber und jeder Karte.")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M3 12h18M12 11v3" /></svg>
                {koffer.length > 0 && <i className="lz-zahl">{koffer.length}</i>}
              </button>
              <button type="button" className="lz-icon" aria-label="Anmelden · Finanzleser Plus" title="Anmelden · Finanzleser Plus" onClick={() => toast("Anmelden kommt mit Finanzleser Plus (Stufe 3).")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="blatt" id="blatt" aria-label="Registerblatt" />
      </header>
    </>
  );
}

function Spark() {
  return (
    <svg className="spark" viewBox="0 0 12 12.0005" aria-hidden="true">
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="currentColor" />
    </svg>
  );
}
