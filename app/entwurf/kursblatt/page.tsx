/**
 * Setzkasten des Kursblatts — jeder Baustein einmal, zum Anschauen und Messen.
 *
 * Vorlage: „Finanzleser Festgeld & Eingaben - Kursblatt.dc.html“:164-197 („Seite 4 ·
 * Setzkasten: Eingabe-Bausteine für Rechner“). Die Übergabe zeigt die Bausteine dort im
 * Zusammenhang eines Brutto-Netto-Rechners; diese Route zeigt zusätzlich die Zustände,
 * die im Fließtext nicht vorkommen (Fehler, Fokus, gedrückt, eng).
 *
 * Zweck ist die Abnahme, nicht die Seite: ENTWURF_AKTIV (lib/faden/flag.ts), noindex,
 * und in robots.txt gesperrt. Sie bleibt dauerhaft — es ist die einzige Stelle, an der
 * alle Bausteine nebeneinander stehen.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ENTWURF_AKTIV } from "@/lib/faden/flag";
import Zeitungskopf from "@/components/kursblatt/teile/Zeitungskopf";
import Seitenreiter from "@/components/kursblatt/teile/Seitenreiter";
import Bausteine from "./Bausteine";

export const metadata: Metadata = {
  title: "Setzkasten · Kursblatt",
  robots: { index: false, follow: false },
};

/** Datum wie im Kopf der Übergabe: „15. September 2026 · Kursblatt“. */
function heute() {
  return new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

export default function KursblattSetzkasten() {
  if (!ENTWURF_AKTIV) notFound();

  // Bewusst ein <div>: die Faden-Hülle rendert bereits ein <main id="faden">,
  // und zwei <main> in einem Dokument sind ungültig.
  return (
    <div className="kb kb--rechner">
      <Zeitungskopf links="Entwurf · Kursblatt · Setzkasten" rechts={`${heute()} · Kursblatt`}>
        <Seitenreiter
          blaetter={[
            { label: "Bausteine", aktiv: true },
            { label: "Seite 1 · Vergleich", href: "/finanztools/vergleiche/autokredit-vergleich" },
            { label: "Seite 2 · Rechner", href: "/finanztools/rechner/kredit" },
          ]}
        />
      </Zeitungskopf>

      <section style={{ paddingTop: 36 }}>
        <span className="kb__kicker kb__kicker--werkzeug">
          <i aria-hidden="true" />
          Rechner · Bausteine
        </span>
        <h1 className="kb__titel">Setzkasten</h1>
        <p className="kb__vorspann">
          Fünf Bausteine ersetzen Feld und Auswahlliste: <b>Lineal</b> für Beträge und
          Laufzeiten mit Gefühl, <b>Drehring</b> für kleine Skalen, <b>Zählwerk</b> für
          Prozente, <b>Setzzeile</b> für alles genau Bekannte, <b>Register</b> für
          Auswahllisten. Farbe folgt dem Werkzeug: Türkis im Vergleich, Magenta im Rechner.
        </p>
      </section>

      <section style={{ marginTop: 46, paddingTop: 16, borderTop: "2px solid var(--kb-werkzeug)" }}>
        <span className="kb__kicker kb__kicker--werkzeug">
          <i aria-hidden="true" />
          Lineal · Setzzeile · Register
        </span>
        <Bausteine />
      </section>

      <section style={{ marginTop: 46 }}>
        <span className="kb__kicker">Noch nicht gesetzt</span>
        <h2 className="kb__h3">Was hier nach und nach einzieht</h2>
        <p className="kb__erklaer">
          Jeder Baustein kommt als eigener Schritt und wird hier abgenommen, bevor er in
          einem Rechner oder Vergleich auftaucht.
        </p>
        <div className="kb__doppellinie" style={{ marginTop: 22, paddingTop: 12 }}>
          {[
            ["Drehring", "kleine Skalen mit festen Schritten – Laufzeit, Alter, Stunden"],
            ["Zählwerk", "Prozentwerte mit Nachkomma – Zins, Tilgung, Rendite"],
            ["Knopfmuster", "Pille, Stempel, Segment, Chip, Strich-Link, Merken"],
          ].map(([name, zweck]) => (
            <div key={name} className="kb__punktzeile">
              <span style={{ font: "600 13.5px var(--kb-serif)" }}>{name}</span>
              <i className="kb__fuehrung" aria-hidden="true" />
              <span style={{ font: "400 13px var(--kb-sans)", color: "var(--kb-grau)", textAlign: "right" }}>
                {zweck}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
