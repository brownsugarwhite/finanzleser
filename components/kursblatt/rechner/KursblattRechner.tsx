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
import Felder from "./Felder";
import Ergebnis from "./Ergebnis";
import Bruecke from "./Bruecke";
import { useMarkt } from "@/lib/kursblatt/useMarkt";
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

  /* Was der Vergleich zu diesen Eingaben sagt — einmal geholt, von Ergebnis UND Brücke
     benutzt. Fehlt er, fällt beides auf seine Fassung ohne Marktzahlen zurück. */
  const brueckenFrage = useMemo(() => {
    if (!schema.bruecke) return "";
    const u = schema.bruecke.uebernimm(werte);
    return new URLSearchParams(Object.entries(u).map(([k, v]) => [k, String(v)])).toString();
  }, [schema, werte]);
  const markt = useMarkt(schema.bruecke?.slug, brueckenFrage);

  const setzen = useCallback((k: string, v: number | string | boolean) => {
    setWerte((w) => ({ ...w, [k]: v }));
    setErgebnis((e) => { if (e) setVeraltet(true); return e; });
    setPreset(null);
  }, []);

  /**
   * „Leo rechnet mit: ≈ 411 € · Monatsrate, unverbindlich" — die Live-Vorschau über dem
   * Ausrechnen-Knopf (Handoff Runde 2, Regel 5: im Rechner rechnet nur diese Zeile live,
   * das volle Ergebnis öffnet der Knopf).
   *
   * 🚨 Sie stand bis zum 16.09.2026 nur in EINEM der 56 Schemata — `vorschau` ist
   * optional, und ausgefüllt hatte sie allein der Kreditrechner, an dem die Vorlage
   * gebaut wurde. In den anderen 55 fehlte die Zeile deshalb ganz.
   * Statt 55 Vorschaufunktionen von Hand: aus dem Ergebnis ableiten. Jeder Rechner
   * benennt in seinen Kacheln genau eine Hauptzahl (`haupt: true`) — das IST die Zahl,
   * mit der Leo rechnet. Ein Schema, das es anders will, setzt weiterhin `vorschau`.
   */
  const vorschau = useMemo(() => {
    if (schema.vorschau) return schema.vorschau(werte);
    try {
      const bloecke = schema.ergebnis(schema.rechne(werte, rates), werte, rates, markt);
      for (const b of bloecke) {
        if (b.art !== "kacheln") continue;
        const k = b.kacheln.find((x) => x.haupt) ?? b.kacheln[0];
        if (!k) continue;
        return { vor: "Leo rechnet mit:", zahl: `≈ ${k.text(k.wert)}`, nach: `${k.label} · unverbindlich` };
      }
      return null;
    } catch {
      // Eine Eingabe, mit der sich (noch) nicht rechnen lässt, ist kein Fehler —
      // dann steht die Zeile eben nicht da.
      return null;
    }
  }, [schema, werte, rates]);

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
      /**
       * 🚨 Erst scrollen, wenn der Kasten OFFEN ist, nicht 250 ms nach dem Öffnen.
       *
       * Gemessen am 16.09.2026: das Ergebnis wächst über .75 s von 0 auf 1011 px, die
       * Seite also von 2179 auf 3012 px. Ein `scrollTo` mittendrin wird auf die Seitenhöhe
       * VON DIESEM AUGENBLICK geklemmt — und bleibt dort, auch wenn die Seite gleich
       * darauf länger wird. Der Ergebniskopf landete so auf 130 px statt der 90 px, die
       * der Handoff nennt; bei kleinerem Fenster wäre der Fehlbetrag größer.
       */
      const el = ergRef.current;
      const kasten = el?.closest(".kb-ergebnis");
      if (!el) return;
      const hin = () => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: reduzierteBewegung() ? "auto" : "smooth" });
      if (!kasten || reduzierteBewegung()) { hin(); return; }
      let schon = false;
      const einmal = () => {
        if (schon) return;
        schon = true;
        kasten.removeEventListener("transitionend", aufgeklappt);
        hin();
      };
      const aufgeklappt = (e: Event) => {
        if ((e as TransitionEvent).propertyName === "grid-template-rows") einmal();
      };
      kasten.addEventListener("transitionend", aufgeklappt);
      // Sicherheitsnetz: bleibt das Ereignis aus (unterbrochene Transition, Browser ohne
      // grid-template-rows-Animation), wird trotzdem gesprungen.
      setTimeout(einmal, 1100);
    }, verzug);
  };

  const bloecke = useMemo(() => (ergebnis ? schema.ergebnis(ergebnis, werte, rates, markt) : []), [ergebnis, werte, schema, rates, markt]);

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
          <Bruecke bruecke={schema.bruecke} rechnerTitel={schema.titel} werte={werte} ergebnis={ergebnis} markt={markt} />
        )}
      </section>
    </div>
  );
}
