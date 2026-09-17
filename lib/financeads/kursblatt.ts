/**
 * Was das Kursblatt aus einer Kategorie macht — reine Funktionen, kein React.
 *
 * Der Handoff zeigt zwei Seiten (Autokredit, Festgeld). Damit dieselben Sektionen für
 * alle 16 Klasse-A-Kategorien tragen, leitet sich alles aus `DefLite` ab: welche Spalte
 * das Streuband trägt, welcher Baustein einen Parameter setzt, wie die Enden der Achse
 * heißen. Kein Kategoriewissen im Markup.
 */
import type { DefLite, KennWert, ParamDef, SpalteDef, VergleichVariante } from "./typen.ts";
import { paramSchluessel } from "./normalisieren.ts";
import { formatKennwert } from "./format.ts";

/** Welcher Eingabe-Baustein setzt diesen Parameter? */
export type ParamBaustein = "lineal" | "setzzeile" | "register" | "segment";

export function bausteinFuer(p: ParamDef): ParamBaustein {
  if (p.typ === "wahl") {
    // Bis drei kurze Möglichkeiten passt der Segment-Umschalter nebeneinander
    // (K:78 „Neuwagen · Gebrauchtwagen · Umschuldung“), darüber braucht es ein Register.
    return (p.optionen?.length ?? 0) <= 3 ? "segment" : "register";
  }
  const stufen = p.schritt ? Math.round(((p.max ?? 0) - (p.min ?? 0)) / p.schritt) : 0;
  // Ein Lineal lohnt sich in einem Fenster: unter 40 Stufen gibt es nichts zu ziehen
  // (dann tippt man den Wert, den man ohnehin kennt), über 400 wird die Spur länger als
  // sechs Satzbreiten und das Treffen eines Wertes zur Geduldsprobe. Beide Enden führen
  // zur Setzzeile — die Marken der Parameter werden dort zu Vorschlägen.
  // Gegenprobe an der Übergabe: Kreditsumme 199 Stufen → Lineal (K:380), Anlagebetrag
  // 1999 Stufen → Setzzeile (F:63). Genau so steht es im Handoff.
  return stufen >= 40 && stufen <= 400 ? "lineal" : "setzzeile";
}

export interface LinealMasse {
  min: number; max: number; schritt: number;
  px: number; major: number; mittel: number;
  marken: { wert: number; label: string }[];
}

/**
 * Maße des Lineals aus einem Parameter.
 *
 * 🚨 Der Handoff nennt zwei handgewählte Konfigurationen: Kreditsumme 1.000–100.000 €
 * in 500er-Schritten mit 9 px und großem Strich alle 10.000 € (K:380), und Laufzeit
 * 12–120 Monate in 6er-Schritten mit 30 px (K:381). Die erste kommt aus dieser Ableitung
 * exakt heraus. Die zweite nicht: unsere Registry führt die Laufzeit in EINER-Schritten,
 * weil Minikredite 1–6 Monate laufen und eine feste 6er-Staffel sie auf null Angebote
 * klemmen würde (registry.ts:245). Aus 1er-Schritten wird ein feineres Lineal — dieselbe
 * Mechanik, feinere Rasterung.
 */
export function linealMasse(p: ParamDef): LinealMasse {
  const min = p.min ?? 0;
  const max = p.max ?? 100;
  const schritt = p.schritt || 1;
  const stufen = Math.max(1, Math.round((max - min) / schritt));

  // Runde Beschriftungen: Monate zählen in Jahren, alles andere dezimal.
  const monate = /monat/i.test(p.einheit ?? "");
  const kandidaten = monate ? [3, 6, 12, 24, 60] : [1, 2, 5, 10, 20, 25, 50, 100, 200, 500];
  const ziel = stufen / 12;
  const major = kandidaten.reduce((a, b) => (Math.abs(b - ziel) < Math.abs(a - ziel) ? b : a));

  // Die Spur soll gut zweieinhalb Satzbreiten lang sein: genug zum Ziehen, ohne dass der
  // Weg von einem Ende zum anderen zur Reise wird.
  const px = Math.min(40, Math.max(4, Math.round((728 * 2.5) / stufen)));

  return {
    min, max, schritt, px, major,
    mittel: major % 2 === 0 ? major / 2 : 0,
    marken: (p.presets ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v >= min && v <= max)
      .map((v) => ({ wert: v, label: markeText(v, p.einheit) })),
  };
}

function markeText(v: number, einheit?: string): string {
  if (/monat/i.test(einheit ?? "") && v >= 12 && v % 12 === 0) {
    const j = v / 12;
    return j === 1 ? "1 Jahr" : `${j} Jahre`;
  }
  return v.toLocaleString("de-DE");
}

/** Die Spalte, die das Säulenfeld trägt: die des Bestwerts. Klasse B hat keine. */
export function hauptspalte(def: DefLite): SpalteDef | undefined {
  if (!def.bestwert) return undefined;
  return def.spalten.find((s) => s.key === def.bestwert!.key);
}

/**
 * Wie die Enden der Achse heißen. „günstig/teuer“ passt, wo weniger besser ist
 * (K:96-97); wo mehr besser ist, wäre es verkehrt herum.
 */
export function achsenEnden(haupt: SpalteDef | undefined): [string, string] {
  if (!haupt) return ["", ""];
  if (haupt.richtung === "runter") return ["günstig", "teuer"];
  if (haupt.art === "geld" || haupt.art === "prozent") return ["wenig", "viel"];
  return ["niedrig", "hoch"];
}

/**
 * „20.000 € über 60 Monate“ — wofür die Liste gerade gilt (K:90).
 *
 * 🚨 Drei Regeln, die alle drei aus kaputten Sätzen entstanden sind (16.09.2026, als die
 * Registry breiter wurde):
 *
 *   1 **Laufzeit erkennt man am Label, nicht an der Einheit.** „Orders / Jahr" und
 *     „Buchungen / Monat" enthalten ein Zeitwort, sind aber Stückzahlen — daraus wurde
 *     „20.000 € über 12" und „10 über 0". Und das Alter eines Hundes hat die Einheit
 *     „Jahre", ist aber keine Dauer: „Hund über 2 Jahre" liest sich wie „älter als zwei“.
 *   2 **Eine Auswahl, die nichts einschränkt, sagt nichts.** „alle Länder", „egal",
 *     „keine", „ohne" gehören nicht in einen Satz darüber, wofür die Liste gilt.
 *     Sonst endete die Auslandskrankenversicherung auf „eine Person ohne."
 *   3 **Eine Zahl ohne Einheit braucht ihr Wort.** „12" allein ist nichts, „12 Orders /
 *     Jahr" ist eine Angabe. Und eine solche Zahl auf 0 sagt ebenfalls nichts.
 *
 * Getrennt wird mit „ · ", nur die Dauer hängt sich mit „über" an den Satz davor.
 */
export function eingabenSatz(def: DefLite, fest: Record<string, string>, params: Record<string, string | number>): string {
  const teile: string[] = [];
  const NICHTSSAGEND = /^(alle|egal|keine|ohne|beliebig)\b/i;
  for (const p of def.params) {
    if (p.fest || fest[p.key] !== undefined) continue;
    const roh = params[p.key] ?? p.standard;
    if (roh === "" || roh === undefined) continue;
    const dauer = /dauer|laufzeit|zinsbindung/i.test(p.label);
    if (p.typ === "wahl") {
      const o = p.optionen?.find((x) => String(x.wert) === String(roh));
      if (!o || NICHTSSAGEND.test(o.label)) continue;
      // „bis 30 Tage" trägt sein Verhältniswort schon — „über bis 30 Tage" wäre doppelt.
      teile.push(dauer && teile.length && !/^(bis|ab|über|unter)\b/i.test(o.label) ? `über ${o.label}` : o.label);
      continue;
    }
    const z = Number(roh);
    if (!Number.isFinite(z)) continue;
    if (!p.einheit && z === 0) continue;
    // 🚨 Eine Postleitzahl ist keine Menge: „60.311" wäre falsch gruppiert.
    const kennung = !p.einheit && /leitzahl|plz|nummer/i.test(p.label);
    const zahlText = kennung ? String(z) : z.toLocaleString("de-DE");
    const text = kennung ? `${p.label} ${zahlText}` : `${zahlText} ${p.einheit || p.label}`;
    teile.push(dauer && teile.length ? `über ${text}` : text);
  }
  return teile.join(" · ").replace(/ · (über )/g, " $1");
}

/**
 * Die Spalten neben der Hauptzahl, in der Reihenfolge, in der man sie lesen will.
 *
 * Die Registry führt sie in Datenreihenfolge (Zins, Sollzins, Laufzeit, Rate); im Satz
 * steht aber die Zahl zuerst, auf die es ankommt — beim Kredit die Monatsrate, beim
 * Festgeld der Ertrag. Welche das ist, sagt `totalLabel` (K:136: „Monatsrate" als erste
 * Punktzeile des Gewinners, in 700 19px).
 */
export function nebenspalten(def: DefLite, haupt: SpalteDef | undefined): SpalteDef[] {
  // `nurDetails` statt `schmal`: `schmal` blendet nur unter 1060 px aus und meint
  // weiterhin eine Kennzahl für den Gewinnerblock (Sollzins, Laufzeit).
  const rest = def.spalten.filter((s) => s !== haupt && !s.nurDetails);
  if (!def.totalLabel) return rest;
  const i = rest.findIndex((s) => s.kurz === def.totalLabel || s.label === def.totalLabel);
  return i > 0 ? [rest[i], ...rest.filter((_, j) => j !== i)] : rest;
}

/**
 * Die drei Zeilen der Punktführung im Gewinnerblock (K:136-138, F:122-124).
 *
 * Anders als `nebenspalten` darf hier alles stehen, was die Registry führt — auch
 * `nurDetails`-Spalten: beim Festgeld sind Endbetrag und Zinszahlung genau das, was
 * neben dem Gewinner steht, in der Angebotsliste aber nur Rauschen wäre.
 * Was schon groß dasteht oder eine eigene Listenspalte hat, fällt heraus. Gekappt wird
 * erst in der Darstellung, wenn feststeht, welche Werte es überhaupt gibt.
 */
export function podestSpalten(def: DefLite, aussen: (SpalteDef | undefined)[]): SpalteDef[] {
  const haupt = hauptspalte(def);
  const rest = def.spalten.filter((s) => s !== haupt);
  const i = def.totalLabel ? rest.findIndex((s) => s.kurz === def.totalLabel || s.label === def.totalLabel) : -1;
  const sortiert = i > 0 ? [rest[i], ...rest.filter((_, j) => j !== i)] : rest;
  // Ohne Kappung: welche drei es werden, entscheidet erst der Wert — eine Punktzeile mit
  // „–“ ist keine Zeile. So rückt beim Festgeld die Einlagensicherung nach, solange der
  // Schnappschuss Endbetrag und Zinszahlung noch nicht kennt.
  return (haupt ? [haupt, ...sortiert] : sortiert).filter((s) => !aussen.includes(s));
}

/**
 * Mehrzahl im Dativ: „12 von 12 Angeboten“ (K:177), nicht „von 12 Angebote“.
 *
 * Die deutsche Regel ist hier eindeutig genug für eine Zeile Code: der Dativ Plural
 * endet auf -n, außer die Mehrzahl endet schon auf -n oder -s.
 * Angebote → Angeboten · Tarife → Tarifen · Konten → Konten · Depots → Depots.
 */
export function dativ(mehrzahl: string): string {
  return /[ns]$/i.test(mehrzahl) ? mehrzahl : mehrzahl + "n";
}

/**
 * Wie `formatKennwert`, aber mit dem Pluszeichen, das ein Ertrag verdient: „+ 3.995 €“
 * (F:122, F:148). Es steht genau dort, wo Geld dazukommt statt wegzugehen — bei Kosten
 * und Zinssätzen wäre es falsch.
 */
export function mitVorzeichen(spalte: SpalteDef, wert: KennWert | undefined): string {
  const text = formatKennwert(spalte, wert);
  return spalte.art === "geld" && spalte.richtung === "hoch" && typeof wert === "number" && wert > 0
    ? `+ ${text}`
    : text;
}

/**
 * Die Zahl, die das Produkt kennzeichnet: groß im Gewinnerblock, Achse der Zinskurve.
 * Beim Kredit ist das der Bestwert selbst, beim Festgeld der Zins (F:118).
 */
export function kennwertSpalte(def: DefLite): SpalteDef | undefined {
  const eigen = def.kursblatt?.kennwert ? def.spalten.find((s) => s.key === def.kursblatt!.kennwert) : undefined;
  return eigen ?? hauptspalte(def);
}

// ─── Zinskurve ────────────────────────────────────────────────────────────────────────

/**
 * Der Parameter, der die Laufzeit setzt — Achse der Zinskurve.
 *
 * Generisch statt hartverdrahtet: eine Auswahlliste mit mindestens drei Einträgen, deren
 * Einheit oder Beschriftung nach Zeit klingt. Beim Festgeld sind das die sieben
 * Anlagedauern, bei der Baufinanzierung wäre es die Zinsbindung.
 */
export function laufzeitParam(def: DefLite): ParamDef | undefined {
  return def.params.find(
    (p) => p.typ === "wahl" && (p.optionen?.length ?? 0) >= 3 && /monat|jahr|dauer|laufzeit|bindung/i.test(`${p.einheit ?? ""} ${p.label}`),
  );
}

export interface KurveWert {
  /** Der Parameterwert („36“) — ein Klick auf den Punkt setzt ihn. */
  wert: string;
  label: string;
  /** Kurzform für den schmalen Satz: „3 M.“, „5 J.“ (F:239). */
  kurz: string;
  best: number;
  schnitt: number;
}

export interface Zinskurve {
  punkte: KurveWert[];
  paramKey: string;
  /**
   * Die Parameter, für die die Kurve gilt. Weicht der Leser davon ab (anderer Betrag),
   * steht das unter der Kurve — die Kurve zeigt dann den Zins, nicht seinen Ertrag.
   */
  basis: Record<string, string>;
}

/**
 * Bester und durchschnittlicher Wert je Laufzeit — aus den Varianten des Schnappschusses.
 *
 * 🚨 Diese Funktion läuft im SERVER, in VergleichKoerper, bevor die Varianten auf die
 * Voreinstellung gekürzt werden. Gemessen 15.09.2026: ins HTML und in die Insel reist nur
 * `varianten[0]` (VergleichKoerper.tsx:44) — ein voller Schnappschuss wöge bis 160 KB.
 * Im Client gäbe es also gar keine Laufzeit-Listen, aus denen sich eine Kurve rechnen
 * ließe. Das Ergebnis wiegt rund 400 Byte und hängt an `daten.kurve`; im Schnappschuss
 * steht es nicht, damit es nicht zu einer zweiten Wahrheit wird.
 *
 * 🚨 Die Kurve zeigt den ZINS, nicht den Ertrag: `presetKombinationen` variiert je
 * Variante nur einen Parameter (quelle.ts:132), die sieben Laufzeiten liegen alle beim
 * Basisbetrag. Der Zins ist betragsneutral, der Ertrag nicht — eine Ertragskurve am
 * falschen Betrag wäre schlicht gelogen.
 */
export function zinskurve(
  def: DefLite,
  varianten: VergleichVariante[],
  spalteKey: string,
  ohne?: { key: string; ist: KennWert },
): Zinskurve | null {
  const p = laufzeitParam(def);
  if (!p || !varianten.length) return null;
  const basis = varianten[0].params;
  const punkte: KurveWert[] = [];

  for (const o of p.optionen ?? []) {
    const gesucht = paramSchluessel({ ...basis, [p.key]: String(o.wert) });
    const v = varianten.find((x) => x.schluessel === gesucht);
    if (!v) continue;
    const werte = v.produkte
      .filter((q) => !ohne || !(ohne.key in q.kennzahlen) || q.kennzahlen[ohne.key] !== ohne.ist)
      .map((q) => q.kennzahlen[spalteKey])
      .filter((w): w is number => typeof w === "number");
    if (!werte.length) continue;
    punkte.push({
      wert: String(o.wert),
      label: o.label,
      kurz: kurzDauer(Number(o.wert), o.label),
      best: Math.max(...werte),
      schnitt: werte.reduce((a, b) => a + b, 0) / werte.length,
    });
  }

  // Unter drei Punkten ist es keine Kurve, sondern eine Strecke.
  return punkte.length >= 3 ? { punkte, paramKey: p.key, basis } : null;
}

function kurzDauer(m: number, label: string): string {
  if (!Number.isFinite(m)) return label;
  if (m < 12) return `${m} M.`;
  return m % 12 ? `${m} M.` : `${m / 12} J.`;
}
