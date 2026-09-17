"use client";

/**
 * Die Brücke am Ende eines Rechners: vom eigenen Ergebnis zu den Angeboten, die dazu
 * passen.
 *
 * Vorlage: README des Handoffs, Seite 2, letzter Block — „Für 20.000 € über 60 Monate
 * gibt es im Autokredit-Vergleich aktuell Angebote ab 0,68 % – das wären 340 € im Monat."
 * plus Pille „Angebote ansehen" und Strich-Link „In den Aktenkoffer" → „Im Aktenkoffer ✓".
 *
 * 🚨 Die beiden Zahlen im Satz sind nicht ausgedacht und auch nicht die Voreinstellung
 * des Vergleichs: sie kommen für GENAU die eingegebene Summe und Laufzeit aus
 * `/api/vergleich-daten/<slug>?kurz=1&…`. Gemessen am 16.09.2026 für 20.000 € über
 * 60 Monate: 20 Angebote, ab 0,68 %, ab 339 € im Monat — der Handoff nennt 340 €, das
 * ist dieselbe Zahl gerundet.
 *
 * 🚨 Der Abruf startet ERST, wenn das Ergebnis offen ist. Vorher hat der Leser nichts
 * gerechnet, und ein Abruf im Server-Render würde die ganze Route auf das Minimum seines
 * `revalidate` ziehen (Regel 11 in CLAUDE.md).
 */
import { useState } from "react";
import type { MouseEvent } from "react";
import { useFadenOptional } from "@/components/faden/FadenProvider";
import PilleCTA from "@/components/kursblatt/teile/PilleCTA";
import { StrichLink } from "@/components/kursblatt/teile/Kleinteile";
import type { MarktKurz, RechnerSchema, Werte } from "@/lib/rechner/schema";

export interface BrueckeProps<W extends Werte, E> {
  bruecke: NonNullable<RechnerSchema<W, E>["bruecke"]>;
  /** Titel des Rechners — Rückfallbeschriftung im Aktenkoffer. */
  rechnerTitel: string;
  werte: W;
  ergebnis: E;
  /** Was der Vergleich zu genau diesen Eingaben sagt; fehlt, solange er lädt. */
  markt?: MarktKurz;
}

/**
 * 🚨 Die Brücke holt die Marktzahlen NICHT mehr selbst. Sie standen hier, und damit kam
 * das Ergebnis darüber nicht an sie heran — die Säulen „Ihre Rate im Marktvergleich"
 * blieben leer, obwohl die Zahlen zwei Bauteile weiter schon geladen waren. Jetzt holt
 * `KursblattRechner` sie einmal (lib/kursblatt/useMarkt.ts) und reicht sie an beide.
 */
export default function Bruecke<W extends Werte, E>({ bruecke, rechnerTitel, werte, ergebnis, markt }: BrueckeProps<W, E>) {
  const faden = useFadenOptional();
  const [abgelegt, setAbgelegt] = useState(false);

  const uebernahme = bruecke.uebernimm(werte);
  const hash = `#vgl:${Object.entries(uebernahme).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")}`;

  const ablegen = (e: MouseEvent<HTMLButtonElement>) => {
    if (!faden || abgelegt) return;
    faden.inDenKoffer(bruecke.koffer?.(werte, ergebnis) ?? rechnerTitel, e.currentTarget);
    setAbgelegt(true);
  };

  return (
    <div className="kb-bruecke">
      <span className="kb__kicker kb__kicker--werkzeug kb__kicker--vergleich">
        <i aria-hidden="true" />
        Passende Angebote
      </span>
      <p className="kb-bruecke__satz">{bruecke.satz(werte, ergebnis, markt)}</p>
      <div className="kb-bruecke__aktionen">
        <PilleCTA
          text="Angebote ansehen" glyph="hoch" werkzeug="tuerkis"
          href={`/finanztools/vergleiche/${bruecke.slug}${hash}`}
        />
        {faden ? (
          <StrichLink
            text={abgelegt ? "Im Aktenkoffer ✓" : "In den Aktenkoffer"}
            onClick={ablegen}
            erledigt={abgelegt}
          />
        ) : (
          <StrichLink text="Alle Rechner" href="/finanztools/rechner" />
        )}
      </div>
    </div>
  );
}
