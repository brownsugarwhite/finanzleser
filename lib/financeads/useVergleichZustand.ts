"use client";

/**
 * Der Zustand eines Vergleichs — Parameter, Nachladen, Sortieren, Filtern, Sichtkontakt.
 *
 * Herausgelöst aus components/vergleich/VergleichRechner.tsx, damit die alte Liste und
 * der Kursblatt-Satz denselben Kern teilen. Der Haken ist die einzige Stelle, an der
 * `/api/vergleich-daten` gerufen, der Hash geschrieben und der Sichtkontakt gemeldet
 * wird — drei Dinge, die in zwei Hüllen zweimal zu führen eine Einladung zum Auseinander-
 * laufen wäre. Am Sichtkontakt hängt die Vergütung.
 *
 * Alles hier ist Zustand, nichts ist Darstellung: der Haken rendert nichts und kennt
 * keine Klassennamen.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DefLite, FilterDef, SpalteDef, VergleichDaten, VergleichProdukt, VergleichQuelle, VergleichVariante } from "./typen.ts";
import { paramSchluessel, sortiere, varianteErgaenzen } from "./normalisieren.ts";
import { useSichtbeacon } from "@/components/vergleich/sichtbeacon";

/** Wie viele Zeilen ohne „Alle zeigen“ stehen. */
export const ANFANGS_ZEILEN = 10;

function alsStrings(p: Record<string, string | number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (v !== "" && v !== undefined && v !== null) out[k] = String(v);
  return out;
}

/** Geteilte Einstellung aus dem Hash: `#vgl:average_balance=20000&months=36`. */
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

export interface VergleichZustand {
  /** Wurzelknoten — der Sichtbeacon beobachtet ihn. */
  wurzel: React.RefObject<HTMLDivElement | null>;
  params: Record<string, string | number>;
  setParam: (key: string, wert: string | number) => void;
  /** Voreinstellung (reist im HTML) und die Variante zu den aktuellen Parametern. */
  standard: VergleichVariante;
  aktuelle: VergleichVariante;
  laedt: boolean;
  fehler: string | null;
  sortKey: string;
  setSortKey: (k: string) => void;
  /**
   * Filter, die in DIESEN Daten überhaupt etwas unterscheiden. Ein Schnappschuss, der vor
   * einer Registry-Erweiterung gebaut wurde, kennt die neuen Kennzahlen noch nicht — ein
   * Chip darauf würde die Liste auf null klemmen, ohne dass jemand versteht, warum.
   */
  chips: FilterDef[];
  /** Aktive Filter je Schlüssel. */
  filter: Record<string, boolean>;
  schalte: (key: string) => void;
  /** Wie viele Angebote jeder Filter übrig ließe — für die Zahl am Chip. */
  treffer: Record<string, number>;
  alle: boolean;
  zeigeAlle: () => void;
  /** Gefiltert und sortiert. */
  zeilen: VergleichProdukt[];
  gezeigt: number;
  /** Spalte des Bestwerts — trägt Streuband und Balken. */
  haupt?: SpalteDef;
  /** Die übrigen Spalten, in Registry-Reihenfolge. */
  mittel: SpalteDef[];
  sortSpalte?: SpalteDef;
  /** Größter Betrag der Hauptspalte — Bezugsgröße der Balken. */
  maximum: number;
}

export function useVergleichZustand({
  slug, def, quelle, daten,
}: {
  slug: string;
  def: DefLite;
  quelle: VergleichQuelle;
  daten: VergleichDaten;
}): VergleichZustand {
  const standard = daten.varianten[0];
  const [params, setParams] = useState<Record<string, string | number>>(() => ({ ...standard.params }));
  const [geladen, setGeladen] = useState<Record<string, VergleichVariante>>({});
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState(def.sortierung[0]?.key || def.bestwert?.key || "");
  const [filter, setFilter] = useState<Record<string, boolean>>({});
  const [alle, setAlle] = useState(false);
  const wurzel = useRef<HTMLDivElement>(null);
  const erlaubt = useMemo(
    () => new Set(def.params.filter((p) => !p.fest && quelle.fest[p.key] === undefined).map((p) => p.key)),
    [def.params, quelle.fest],
  );

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

  const setParam = useCallback((key: string, wert: string | number) => {
    setParams((p) => ({ ...p, [key]: wert }));
    setAlle(false);
  }, []);

  const schalte = useCallback((key: string) => {
    setFilter((f) => ({ ...f, [key]: !f[key] }));
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
  const mittel = useMemo(() => spalten.filter((s) => s !== haupt), [spalten, haupt]);
  const sortSpalte = spalten.find((s) => s.key === sortKey) || haupt;
  const richtung = sortSpalte?.richtung || "hoch";

  // Nur Chips, deren Kennzahl in den Daten vorkommt (siehe Kommentar oben).
  const chips = useMemo(
    () => (def.filter ?? []).filter((f) => aktuelle.produkte.some((p) => f.key in p.kennzahlen)),
    [def.filter, aktuelle.produkte],
  );

  const trifft = useCallback(
    (p: VergleichProdukt, aktiv: Record<string, boolean>) =>
      chips.every((f) => !aktiv[f.key] || p.kennzahlen[f.key] === f.wert),
    [chips],
  );

  const zeilen = useMemo(() => {
    const liste = aktuelle.produkte.filter((p) => trifft(p, filter));
    return def.klasse === "A" && sortKey ? sortiere(liste, sortKey, richtung) : liste;
  }, [aktuelle.produkte, filter, trifft, def.klasse, sortKey, richtung]);

  // Was ein Chip übrig ließe, wenn man ihn ZUSÄTZLICH anlegt — die Zahl daneben soll
  // sagen, worauf man sich einlässt, nicht wie viele es insgesamt gibt.
  const treffer = useMemo(() => {
    const out: Record<string, number> = {};
    for (const f of chips) {
      out[f.key] = aktuelle.produkte.filter((p) => trifft(p, { ...filter, [f.key]: true })).length;
    }
    return out;
  }, [aktuelle.produkte, chips, filter, trifft]);

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

  return {
    wurzel, params, setParam, standard, aktuelle, laedt, fehler,
    sortKey, setSortKey, chips, filter, schalte, treffer,
    alle, zeigeAlle: () => setAlle(true),
    zeilen, gezeigt, haupt, mittel, sortSpalte, maximum,
  };
}
