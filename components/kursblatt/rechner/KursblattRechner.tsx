"use client";

/**
 * Der Rechner im Kursblatt-Satz — Hülle für ein Schema aus lib/rechner/schemata.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:234-354 (Seite 2).
 * Reihenfolge: Zeitungskopf → Werkzeug-Kicker → H2 → Vorspann → Stempel-Presets →
 * Eingaben → „Leo rechnet mit“ mit Ausrechnen-Pille → Ergebnis → Brücke in den Vergleich.
 *
 * Der Wert steht vom ersten Render an im HTML; gerechnet wird ohne Knopfdruck für die
 * Vorschau („Leo rechnet mit“), das vollständige Ergebnis öffnet der Knopf.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { useRates } from "@/lib/hooks/useRates";
import { useLauf } from "@/lib/kursblatt/useLauf";
import { reduzierteBewegung } from "@/lib/faden/belohnung";
import Zeitungskopf from "@/components/kursblatt/teile/Zeitungskopf";
import Seitenreiter from "@/components/kursblatt/teile/Seitenreiter";
import StempelPresets from "@/components/kursblatt/teile/StempelPresets";
import PilleCTA from "@/components/kursblatt/teile/PilleCTA";
import Odometer from "@/components/kursblatt/eingabe/Odometer";
import { StrichLink } from "@/components/kursblatt/teile/Kleinteile";
import Felder from "./Felder";
import Ergebnis from "./Ergebnis";
import type { RechnerSchema, Werte } from "@/lib/rechner/schema";

/** K:236 — „15. September 2026 · Kursblatt“. Rein darstellend, kein Datenstand. */
function heute() {
  return new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

export default function KursblattRechner<W extends Werte, E>({
  schema, ohneKopf = false,
}: {
  schema: RechnerSchema<W, E>;
  /** Im Artikel-Einbau trägt schon das Kapitel die Überschrift. */
  ohneKopf?: boolean;
}) {
  const [werte, setWerte] = useState<W>(schema.start);
  const [ergebnis, setErgebnis] = useState<E | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [veraltet, setVeraltet] = useState(false);
  const [preset, setPreset] = useState<string | null>(schema.presets?.[0]?.id ?? null);
  const ergRef = useRef<HTMLDivElement>(null);
  const rates = useRates();

  const lauf = useLauf(JSON.stringify(werte));

  const setzen = useCallback((k: string, v: number | string | boolean) => {
    setWerte((w) => ({ ...w, [k]: v }));
    setErgebnis((e) => { if (e) setVeraltet(true); return e; });
    setPreset(null);
  }, []);

  const vorschau = schema.vorschau?.(werte);

  const ausrechnen = () => {
    if (rechnet) return;
    setRechnet(true);
    // Der kurze Verzug ist Absicht (K:445-452): der Knopf schrumpft sichtbar, bevor sich
    // das Ergebnis öffnet — sonst wirkt der Sprung wie ein Seitenwechsel.
    const verzug = reduzierteBewegung() ? 0 : 520;
    setTimeout(() => {
      setErgebnis(schema.rechne(werte, rates));
      setRechnet(false);
      setVeraltet(false);
      setTimeout(() => {
        const el = ergRef.current;
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: reduzierteBewegung() ? "auto" : "smooth" });
      }, 250);
    }, verzug);
  };

  const bloecke = useMemo(() => (ergebnis ? schema.ergebnis(ergebnis, werte) : []), [ergebnis, werte, schema]);

  return (
    <div className="kb kb--rechner">
      {!ohneKopf && (
        <Zeitungskopf links={schema.pfad} rechts={`${heute()} · Kursblatt`}>
          <Seitenreiter
            blaetter={[
              { label: schema.titel, aktiv: true },
              ...(schema.bruecke ? [{ label: schema.bruecke.titel, href: `/finanztools/vergleiche/${schema.bruecke.slug}` }] : []),
              { label: "Alle Rechner", href: "/finanztools/rechner" },
            ]}
          />
        </Zeitungskopf>
      )}

      <section className="kb-rechner">
        <span className="kb__kicker kb__kicker--werkzeug">
          <i aria-hidden="true" />
          {schema.kicker}
        </span>
        <h2 className="kb__titel kb__titel--rechner">{schema.titel}</h2>
        <p className="kb__vorspann kb__vorspann--rechner">{schema.vorspann}</p>

        {schema.presets && schema.presets.length > 0 && (
          <div className="kb-rechner__presets">
            <StempelPresets
              presets={schema.presets.map((p) => ({ ...p, werte: p.werte as Werte }))}
              aktiv={preset}
              onWaehlen={(p) => { setWerte((w) => ({ ...w, ...(p.werte as Partial<W>) })); setPreset(p.id); setErgebnis((e) => { if (e) setVeraltet(true); return e; }); }}
            />
          </div>
        )}

        <div className="kb-rechner__felder">
          <Felder felder={schema.felder} werte={werte} setzen={setzen} />
        </div>

        <div className="kb-rechner__leo">
          {vorschau && (
            <div className="kb-rechner__vorschau">
              <span className="kb-rechner__leo-vor">{vorschau.vor}</span>
              <span className="kb-rechner__leo-zahl"><Odometer text={vorschau.zahl} /></span>
              <span className="kb-rechner__leo-nach">{vorschau.nach}</span>
            </div>
          )}
          <PilleCTA
            text={veraltet ? "Neu ausrechnen" : "Ausrechnen"}
            glyph="gleich" werkzeug="magenta" schrumpft={rechnet} onClick={ausrechnen}
          />
        </div>

        <Ergebnis bloecke={bloecke} offen={Boolean(ergebnis)} veraltet={veraltet} lauf={lauf} kopfRef={ergRef} />

        {ergebnis && schema.bruecke && (
          <div className="kb-bruecke">
            <span className="kb__kicker kb__kicker--werkzeug kb__kicker--vergleich">
              <i aria-hidden="true" />
              Passende Angebote
            </span>
            <p className="kb-bruecke__satz">{schema.bruecke.satz(werte, ergebnis)}</p>
            <div className="kb-bruecke__aktionen">
              <PilleCTA
                text="Angebote ansehen" glyph="hoch" werkzeug="tuerkis"
                href={`/finanztools/vergleiche/${schema.bruecke.slug}#vgl:${Object.entries(schema.bruecke.uebernimm(werte)).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")}`}
              />
              <StrichLink text="Alle Rechner" href="/finanztools/rechner" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
