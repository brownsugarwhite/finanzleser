"use client";

/**
 * „Ihre Angaben“ — die Eingaben des Vergleichs, aus den Parametern der Registry gesetzt.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:62-85 (Kredit: zwei
 * Lineale und ein Segment) und „… Festgeld & Eingaben“:56-67 (Festgeld: Setzzeile und
 * zwei Register). Welcher Baustein einen Parameter setzt, entscheidet
 * `bausteinFuer` in lib/financeads/kursblatt.ts — nicht eine Liste je Kategorie.
 *
 * Lineale nehmen die volle Satzbreite, alles andere steht zu zweit nebeneinander.
 */
import Lineal from "@/components/kursblatt/eingabe/Lineal";
import Setzzeile from "@/components/kursblatt/eingabe/Setzzeile";
import Register from "@/components/kursblatt/eingabe/Register";
import Segment from "@/components/kursblatt/teile/Segment";
import { bausteinFuer, linealMasse } from "@/lib/financeads/kursblatt";
import type { DefLite, ParamDef, VergleichQuelle } from "@/lib/financeads/typen";

/** „1.000 – 100.000 €“ (K:69) — was der Parameter überhaupt zulässt. */
function bereichText(p: ParamDef): string | undefined {
  if (p.typ !== "zahl" || p.min === undefined || p.max === undefined) return undefined;
  return `${p.min.toLocaleString("de-DE")} – ${p.max.toLocaleString("de-DE")}${p.einheit ? " " + p.einheit : ""}`;
}

export interface IhreAngabenProps {
  def: DefLite;
  quelle: VergleichQuelle;
  params: Record<string, string | number>;
  onParam: (key: string, wert: string | number) => void;
  /** Lebende Beizeile je Register-Eintrag („bis 3,45 %“, „4 Angebote“). */
  meta?: (paramKey: string, wert: string) => string | undefined;
}

export default function IhreAngaben({ def, quelle, params, onParam, meta }: IhreAngabenProps) {
  // Was die Redaktion festgelegt hat, ist keine Angabe des Lesers.
  const offen = def.params.filter((p) => !p.fest && quelle.fest[p.key] === undefined);
  if (!offen.length) return null;

  const lineale = offen.filter((p) => bausteinFuer(p) === "lineal");
  const rest = offen.filter((p) => bausteinFuer(p) !== "lineal");

  return (
    <section className="kb-angaben">
      <div className="kb-angaben__kopf">
        <span className="kb__kicker kb__kicker--werkzeug">
          <i aria-hidden="true" />
          Ihre Angaben
        </span>
        <span className="kb-angaben__sofort">
          <i aria-hidden="true" />
          Ergebnis folgt sofort – kein Knopf nötig
        </span>
      </div>

      {lineale.map((p) => {
        const m = linealMasse(p);
        return (
          <div key={p.key} className="kb-angaben__breit">
            <div className="kb__feldkopf">
              <b>{p.label}</b>
              <span>{bereichText(p)}</span>
            </div>
            <Lineal
              ariaLabel={p.label}
              wert={Number(params[p.key] ?? p.standard)}
              onWert={(v) => onParam(p.key, v)}
              min={m.min} max={m.max} schritt={m.schritt}
              px={m.px} major={m.major} mittel={m.mittel}
              einheit={p.einheit} marken={m.marken} werkzeug="tuerkis"
            />
          </div>
        );
      })}

      {rest.length > 0 && (
        <div className="kb__zweispalt kb-angaben__paar">
          {rest.map((p) => {
            const baustein = bausteinFuer(p);
            if (baustein === "segment") {
              return (
                <div key={p.key} className="kb-angaben__segment">
                  <b>{p.label}</b>
                  <Segment
                    ariaLabel={p.label}
                    wert={String(params[p.key] ?? p.standard)}
                    onWert={(v) => onParam(p.key, v)}
                    optionen={(p.optionen ?? []).map((o) => ({ wert: o.wert, label: o.label }))}
                  />
                </div>
              );
            }
            if (baustein === "register") {
              return (
                <Register
                  key={p.key}
                  label={p.label}
                  wert={String(params[p.key] ?? p.standard)}
                  onWert={(v) => onParam(p.key, v)}
                  optionen={(p.optionen ?? []).map((o) => ({ wert: o.wert, label: o.label, meta: meta?.(p.key, o.wert) }))}
                  werkzeug="tuerkis"
                  maxHoehe={(p.optionen?.length ?? 0) > 8 ? "300px" : undefined}
                />
              );
            }
            return (
              <Setzzeile
                key={p.key}
                label={p.label}
                wert={Number(params[p.key] ?? p.standard)}
                onWert={(v) => onParam(p.key, v)}
                einheit={p.einheit}
                min={p.min ?? 0} max={p.max ?? 1e9} schritt={p.schritt ?? 1}
                vorschlaege={(p.presets ?? []).map(Number).filter(Number.isFinite)}
                hinweis={p.schritt && p.schritt > 1 ? `Pfeiltasten oder ‹ › ändern in ${p.schritt.toLocaleString("de-DE")}${p.einheit ? "-" + p.einheit : ""}-Schritten` : undefined}
                werkzeug="tuerkis"
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
