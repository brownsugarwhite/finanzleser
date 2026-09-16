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
import { useEffect, useState } from "react";
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
}

export default function Bruecke<W extends Werte, E>({ bruecke, rechnerTitel, werte, ergebnis }: BrueckeProps<W, E>) {
  const [markt, setMarkt] = useState<MarktKurz | undefined>(undefined);
  const faden = useFadenOptional();
  const [abgelegt, setAbgelegt] = useState(false);

  const uebernahme = bruecke.uebernimm(werte);
  const frage = new URLSearchParams(Object.entries(uebernahme).map(([k, v]) => [k, String(v)])).toString();
  const hash = `#vgl:${Object.entries(uebernahme).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")}`;

  useEffect(() => {
    let aktiv = true;
    const abbruch = new AbortController();
    fetch(`/api/vergleich-daten/${encodeURIComponent(bruecke.slug)}?kurz=1&${frage}`, { signal: abbruch.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: MarktKurz | null) => { if (aktiv && j?.bestwert) setMarkt(j); })
      // Antwortet der Partner nicht, bleibt der Satz ohne Marktzahlen stehen. Eine
      // Fehlermeldung wäre hier fehl am Platz: der Leser hat sein Ergebnis längst.
      .catch(() => { /* still */ });
    return () => { aktiv = false; abbruch.abort(); };
  }, [bruecke.slug, frage]);

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
