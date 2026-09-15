"use client";

/**
 * Der eigene Vergleichsrechner — eine Komponente, zwei Skins.
 *
 * Wird SSR-gerendert: die Voreinstellung steht im HTML, ohne JavaScript, für Leser und
 * Suchmaschinen. Danach hydratisiert er mit demselben Zustand (kein Sprung) und liest erst
 * im Effekt den Hash (`#vgl:average_balance=20000`), der eine geteilte Einstellung trägt —
 * Hash statt Query, damit die ISR-Seite nie auf die Function fällt.
 *
 * Sortieren und Filtern laufen lokal. Preset-Chips wechseln auf eine Variante aus dem
 * Snapshot (sofort); ein freier Wert ruft /api/vergleich-daten (1–8 s, CDN-gecacht).
 *
 * `skin`: "faden" (Zeitungssatz nach Handoff Z. 759–788, app/faden-vergleich.css) oder
 * "alt" (Live-Seite, app/vergleich.css). Gleiches Markup, zwei Stylesheets.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DefLite, KennWert, VergleichDaten, VergleichQuelle, VergleichVariante } from "@/lib/financeads/typen";
import { paramSchluessel, sortiere, varianteErgaenzen } from "@/lib/financeads/normalisieren";
import { formatKennwert, formatStand } from "@/lib/financeads/format";
import Wertetabelle from "@/components/statistik/formen/Wertetabelle";
import Parameterzeile from "./Parameterzeile";
import Tarifliste from "./Tarifliste";
import Anbieterliste from "./Anbieterliste";
import VergleichSaeulen from "./VergleichSaeulen";
import { useSichtbeacon } from "./sichtbeacon";

export interface VergleichRechnerProps {
  slug: string;
  def: DefLite;
  quelle: VergleichQuelle;
  daten: VergleichDaten;
  skin: "faden" | "alt";
  /** Säulen-Statistik über der Liste (nur Faden, nur Klasse A). */
  mitSaeulen?: boolean;
}

const ANFANGS_ZEILEN = 10;

function alsStrings(p: Record<string, string | number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (v !== "" && v !== undefined && v !== null) out[k] = String(v);
  return out;
}

function hashLesen(erlaubt: Set<string>): Record<string, string> {
  if (typeof location === "undefined") return {};
  const m = location.hash.match(/^#vgl:(.+)$/);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const teil of m[1].split("&")) {
    const [k, v] = teil.split("=");
    if (k && v !== undefined && erlaubt.has(k)) out[k] = decodeURIComponent(v);
  }
  return out;
}

export default function VergleichRechner({ slug, def, quelle, daten, skin, mitSaeulen }: VergleichRechnerProps) {
  const standard = daten.varianten[0];
  const [params, setParams] = useState<Record<string, string | number>>(() => ({ ...standard.params }));
  const [geladen, setGeladen] = useState<Record<string, VergleichVariante>>({});
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState(def.sortierung[0]?.key || def.bestwert?.key || "");
  const [filterAn, setFilterAn] = useState(false);
  const [alle, setAlle] = useState(false);
  const wurzel = useRef<HTMLDivElement>(null);
  const erlaubt = useMemo(() => new Set(def.params.filter((p) => !p.fest && quelle.fest[p.key] === undefined).map((p) => p.key)), [def.params, quelle.fest]);

  // Geteilte Einstellung aus dem Hash — erst nach der Hydration, damit SSR und erster
  // Client-Render identisch bleiben.
  useEffect(() => {
    const h = hashLesen(erlaubt);
    if (Object.keys(h).length) setParams((p) => ({ ...p, ...h }));
  }, [erlaubt]);

  const schluessel = paramSchluessel(alsStrings(params));
  // Im HTML reist nur die Voreinstellung; jede andere Kombination kommt von der Datenroute
  // (aus dem Snapshot in Millisekunden, sonst live) — abgespeckt, hier wieder aufgefüllt.
  const variante: VergleichVariante | null = useMemo(() => {
    const v = daten.varianten.find((x) => x.schluessel === schluessel) || geladen[schluessel] || null;
    return v && v !== standard ? varianteErgaenzen(v, standard) : v;
  }, [daten.varianten, geladen, schluessel, standard]);

  // Freier Wert → Datenroute. Das Ergebnis wird je Schlüssel gemerkt.
  useEffect(() => {
    if (variante || !Object.keys(params).length) return;
    let aktiv = true;
    setLaedt(true); setFehler(null);
    const qs = new URLSearchParams(alsStrings(params)).toString();
    fetch(`/api/vergleich-daten/${encodeURIComponent(slug)}?${qs}`)
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return (await r.json()) as { variante: VergleichVariante }; })
      .then((j) => { if (!aktiv) return; setGeladen((g) => ({ ...g, [schluessel]: j.variante })); })
      .catch(() => { if (aktiv) setFehler("Für diese Werte konnten die Angebote gerade nicht berechnet werden."); })
      .finally(() => { if (aktiv) setLaedt(false); });
    return () => { aktiv = false; };
  }, [variante, params, schluessel, slug]);

  const onParam = useCallback((key: string, wert: string | number) => {
    setParams((p) => ({ ...p, [key]: wert }));
    setAlle(false);
  }, []);

  // Den Hash erst im Effekt schreiben: Next patcht history.replaceState und setzt dabei
  // Router-Zustand — aus einem setState-Updater heraus wäre das ein „update while rendering".
  const hashGesetzt = useRef(false);
  useEffect(() => {
    if (typeof history === "undefined") return;
    const abweichend = Object.entries(alsStrings(params)).filter(([k, v]) => standard.params[k] !== v && erlaubt.has(k));
    const hash = abweichend.length ? `#vgl:${abweichend.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}` : "";
    // Beim ersten Lauf nichts anfassen (sonst würde ein fremder Anker der Seite gelöscht).
    if (!hashGesetzt.current && !hash) return;
    if (location.hash === hash) return;
    hashGesetzt.current = true;
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
  }, [params, standard.params, erlaubt]);

  const aktuelle = variante ?? standard;
  const spalten = def.spalten;
  const haupt = spalten.find((s) => s.key === def.bestwert?.key) || spalten[spalten.length - 1];
  const mittel = spalten.filter((s) => s !== haupt);
  const sortSpalte = spalten.find((s) => s.key === sortKey) || haupt;
  const richtung = sortSpalte?.richtung || "hoch";

  const zeilen = useMemo(() => {
    let liste = aktuelle.produkte;
    if (filterAn && def.filter) liste = liste.filter((p) => p.kennzahlen[def.filter!.key] === def.filter!.wert);
    return def.klasse === "A" && sortKey ? sortiere(liste, sortKey, richtung) : liste;
  }, [aktuelle.produkte, filterAn, def.filter, def.klasse, sortKey, richtung]);

  const maximum = useMemo(() => {
    if (!haupt) return 0;
    let m = 0;
    for (const p of aktuelle.produkte) { const w = p.kennzahlen[haupt.key]; if (typeof w === "number" && Math.abs(w) > m) m = Math.abs(w); }
    return m;
  }, [aktuelle.produkte, haupt]);

  const gezeigt = alle ? zeilen.length : Math.min(zeilen.length, ANFANGS_ZEILEN);
  const kennung = aktuelle.produkte[0]?.typ || def.kategorie;
  const sichtbareIds = useMemo(() => zeilen.slice(0, gezeigt).map((p) => p.id), [zeilen, gezeigt]);
  useSichtbeacon(wurzel, slug, kennung, sichtbareIds, aktuelle === standard);

  const wertetabelle = useMemo(() => ({
    reihen: def.klasse === "A" ? spalten.map((s) => s.label) : ["Tarif"],
    // Name = Anbieter · Tarif: eindeutig je Zeile (React-Key) und im Textauszug lesbar.
    zeilen: aktuelle.produkte.map((p) => ({ name: `${p.anbieter} · ${p.tarif}`, werte: def.klasse === "A" ? spalten.map((s) => formatKennwert(s, p.kennzahlen[s.key])) : [p.tarif] })),
  }), [aktuelle.produkte, spalten, def.klasse]);

  const grund = aktuelle.bestwertGrund;

  return (
    <div className={`vgl vgl--${skin} vgl--klasse-${def.klasse.toLowerCase()}`} ref={wurzel} data-vergleich={slug}>
      <Parameterzeile def={def} quelle={quelle} params={params} onChange={onParam} laedt={laedt} />
      {fehler && <p className="vgl__fehler" role="alert">{fehler} Gezeigt wird die Voreinstellung.</p>}

      {mitSaeulen && skin === "faden" && def.klasse === "A" && haupt && (
        <VergleichSaeulen zeilen={zeilen} spalte={sortSpalte || haupt} maximum={maximum} titel={`${sortSpalte?.label || haupt.label} · die ersten ${Math.min(8, zeilen.length)} ${def.mehrzahl}`} />
      )}

      {(def.filter || (def.klasse === "A" && def.sortierung.length > 1)) && (
        <div className="vgl__filterzeile">
          {def.filter && (
            <button type="button" className="vgl__schalter" role="switch" aria-checked={filterAn} onClick={() => { setFilterAn((f) => !f); setAlle(false); }}>
              <span className="vgl__schalter-knopf" aria-hidden="true"><i /></span>
              <span>{def.filter.label}</span>
            </button>
          )}
          {def.klasse === "A" && def.sortierung.length > 1 && (
            <div className="vgl__sortieren" role="tablist" aria-label="Sortieren">
              <span className="vgl__sortieren-label">Sortieren:</span>
              {def.sortierung.map((s) => (
                <button key={s.key} type="button" role="tab" aria-selected={sortKey === s.key} className={"vgl__tab" + (sortKey === s.key ? " vgl__tab--aktiv" : "")} onClick={() => setSortKey(s.key)}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {def.klasse === "A" && haupt
        ? <Tarifliste def={def} zeilen={zeilen} haupt={haupt} mittel={mittel} best={filterAn || sortKey !== (def.sortierung[0]?.key || def.bestwert?.key) ? aktuelle.bestwert : aktuelle.bestwert} maximum={maximum} gezeigt={gezeigt} />
        : <Anbieterliste zeilen={zeilen} gezeigt={gezeigt} />}

      {zeilen.length === 0 && <p className="vgl__leer">Mit dieser Einstellung bleibt kein Angebot übrig.</p>}

      {zeilen.length > gezeigt && (
        <button type="button" className="vgl__mehr" onClick={() => setAlle(true)}>Alle {zeilen.length} {def.mehrzahl} zeigen</button>
      )}

      {(quelle.hinweis || def.hinweis) && <p className="vgl__hinweis">{quelle.hinweis || def.hinweis}</p>}

      <Wertetabelle titel={`${def.titel}: alle ${aktuelle.produkte.length} ${def.mehrzahl}`} spalte={def.einzahl} reihen={wertetabelle.reihen} zeilen={wertetabelle.zeilen} />

      <div className="vgl__fuss">
        <span className="vgl__meta">
          {zeilen.length === aktuelle.produkte.length ? `${aktuelle.produkte.length} ${def.mehrzahl}` : `${zeilen.length} von ${aktuelle.produkte.length} ${def.mehrzahl}`}
          {" · Stand "}{formatStand(daten.stand)}
          {grund ? ` · Bestwert: ${grund}` : ""}
        </span>
        <span className="vgl__quelle">Daten: financeads · Anzeige, Partnerlinks</span>
      </div>
    </div>
  );
}

export type { KennWert };
