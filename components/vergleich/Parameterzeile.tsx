"use client";

/**
 * Die Parameterzeile: je Parameter eine Reihe Chips (Presets, sofort aus dem Snapshot)
 * und dahinter „eigener Wert" — die freie Eingabe ruft die Datenroute (1–8 s).
 * Ein Umschalter, ein Sortierer, sonst nichts: mehr Bedienung braucht kein Vergleich.
 */
import { useEffect, useState } from "react";
import type { DefLite, ParamDef, VergleichQuelle } from "@/lib/financeads/typen";
import { presetsFuer } from "@/lib/financeads/quelle";
import { formatZahl } from "@/lib/financeads/format";

function chipText(p: ParamDef, wert: number | string): string {
  const opt = p.optionen?.find((o) => o.wert === String(wert));
  if (opt) return opt.label;
  if (typeof wert === "number" || /^\d+([.,]\d+)?$/.test(String(wert))) {
    const n = Number(String(wert).replace(",", "."));
    if (p.einheit === "€") return `${formatZahl(n, 0)} €`;
    if (p.einheit === "Monate") return n === 1 ? "1 Monat" : `${n} Monate`;
    if (p.einheit === "Jahre") return n === 1 ? "1 Jahr" : `${n} Jahre`;
    if (p.einheit === "%") return `${formatZahl(n, 0)} %`;
    return formatZahl(n, 0);
  }
  return String(wert);
}

export default function Parameterzeile({ def, quelle, params, onChange, laedt }: {
  def: DefLite;
  quelle: VergleichQuelle;
  params: Record<string, string | number>;
  onChange: (key: string, wert: string | number) => void;
  laedt: boolean;
}) {
  const sichtbar = def.params.filter((p) => !p.fest && quelle.fest[p.key] === undefined);
  if (!sichtbar.length) return null;
  return (
    <div className="vgl__parameter" aria-busy={laedt || undefined}>
      {sichtbar.map((p) => <Parameter key={p.key} p={p} presets={presetsFuer(def, quelle, p.key)} wert={params[p.key]} onChange={(w) => onChange(p.key, w)} />)}
      {laedt && <span className="vgl__laedt" role="status">Angebote werden neu berechnet …</span>}
    </div>
  );
}

function Parameter({ p, presets, wert, onChange }: { p: ParamDef; presets: (number | string)[]; wert: string | number | undefined; onChange: (w: string | number) => void }) {
  const aktuell = wert === undefined ? p.standard : wert;
  const imPreset = presets.some((x) => String(x) === String(aktuell));
  // Ohne Presets gibt es nichts zu wählen: dann steht das Eingabefeld direkt da, kein einsamer Chip „eigener Wert".
  const [frei, setFrei] = useState(presets.length === 0 || !imPreset);
  const [entwurf, setEntwurf] = useState(String(aktuell));
  useEffect(() => { setEntwurf(String(aktuell)); }, [aktuell]);

  // Freie Eingabe erst übernehmen, wenn der Leser kurz innehält — jede Änderung wäre ein Abruf.
  useEffect(() => {
    if (!frei || p.typ !== "zahl") return;
    const n = Number(entwurf.replace(",", "."));
    if (!Number.isFinite(n) || n === Number(aktuell)) return;
    const t = setTimeout(() => onChange(n), 600);
    return () => clearTimeout(t);
  }, [entwurf, frei, p.typ, aktuell, onChange]);

  const id = `vgl-param-${p.key}`;
  return (
    <div className="vgl__param">
      <span className="vgl__param-label kicker">{p.label}</span>
      {p.typ === "wahl" && !presets.length ? (
        <select className="vgl__select" value={String(aktuell)} onChange={(e) => onChange(e.target.value)} aria-label={p.label}>
          {(p.optionen || []).map((o) => <option key={o.wert} value={o.wert}>{o.label}</option>)}
        </select>
      ) : (
        <div className="vgl__chips" role="group" aria-label={p.label}>
          {presets.map((x) => (
            <button key={String(x)} type="button" className={"chip vgl__chip" + (!frei && String(x) === String(aktuell) ? " vgl__chip--aktiv" : "")} aria-pressed={!frei && String(x) === String(aktuell)} onClick={() => { setFrei(false); onChange(p.typ === "zahl" ? Number(x) : x); }}>
              {chipText(p, x)}
            </button>
          ))}
          {p.typ === "zahl" ? (
            frei ? (
              <label className="vgl__frei" htmlFor={id}>
                <input id={id} className="vgl__eingabe" type="number" inputMode="decimal" min={p.min} max={p.max} step={p.schritt} value={entwurf} onChange={(e) => setEntwurf(e.target.value)} aria-label={`${p.label}, eigener Wert`} />
                {p.einheit && <span className="vgl__einheit">{p.einheit}</span>}
              </label>
            ) : (
              <button type="button" className="chip vgl__chip vgl__chip--frei" onClick={() => setFrei(true)}>eigener Wert</button>
            )
          ) : (
            (p.optionen || []).filter((o) => !presets.some((x) => String(x) === o.wert)).length > 0 && (
              <select className="vgl__select vgl__select--mehr" value={String(aktuell)} onChange={(e) => { setFrei(true); onChange(e.target.value); }} aria-label={`${p.label}, weitere`}>
                {(p.optionen || []).map((o) => <option key={o.wert} value={o.wert}>{o.label}</option>)}
              </select>
            )
          )}
        </div>
      )}
    </div>
  );
}
