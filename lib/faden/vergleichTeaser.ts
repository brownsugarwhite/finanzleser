/**
 * Die Vergleichs-Teaser der Startseite — Baustein 2 der Übergabe „Finanzleser Heute“.
 *
 * Aus dem Schnappschuss eines Vergleichs wird alles, was ein Teaser zeigt: Anzahl und
 * Stand, die Preiszeile, das Säulen-Marktband und die beiden Fußzeilen darunter.
 *
 * 🚨 NUR Klasse A. Die neun Versicherungskategorien der Klasse B liefern von financeads
 * nur Name, Versicherer, Logo und Link — keine Beiträge. Ein Säulenband und eine
 * Preiszeile ließen sich dort nur erfinden. Entscheidung des Users vom 17.09.2026:
 * die Teaser zeigen Vergleiche mit echten Zahlen; kommt aus dem Kassensturz ein
 * Klasse-B-Vergleich, fällt die Zeile auf die feste Auswahl zurück.
 *
 * 🚨 Keine einzige Abfrage an financeads. Die Daten kommen aus dem Schnappschuss in
 * WordPress (`lib/financeads/laden.ts`), der ohnehin für jede Vergleichsseite gilt und
 * 24 h im Data-Cache liegt. Titel und Adresse stehen im Werkzeugindex, der über das
 * Layout schon warm ist — also vier REST-Abrufe und sonst nichts.
 */
import { getVergleichDaten } from "@/lib/financeads/laden";
import { kategorieDef } from "@/lib/financeads/registry";
import { hauptspalte } from "@/lib/financeads/kursblatt";
import { formatGeld, formatKennwert, formatProzent, formatZahl } from "@/lib/financeads/format";
import type { SpalteDef, VergleichProdukt } from "@/lib/financeads/typen";
import type { WerkzeugVerweis } from "@/lib/faden/werkzeugIndex";
import { saeulenSkala, SOCKEL_TEASER } from "@/lib/kursblatt/saeulen";

/**
 * Die vier Vergleiche der Zeile. Breit gestreut — sparen, leihen, Gesundheit, Tier —
 * und alle vier tragen echte Zahlen (Klasse A, Schnappschuss vorhanden).
 */
export const TEASER_VERGLEICHE = [
  "tagesgeldvergleich",
  "ratenkredit-vergleich",
  "zahnzusatzversicherung-vergleich",
  "hundekrankenversicherung-vergleich",
];

/** Eine Säule: ihre Höhe in Prozent des Bandes, ob sie der Bestwert ist, und ihr Wert. */
export interface TeaserSaeule {
  /** 16–100 — die Ersparnis gegenüber dem teuersten Tarif, nie ganz null. */
  hoehe: number;
  best: boolean;
  /** Für `aria-label` und Titel — nie gerendert. */
  wert: string;
}

export interface VergleichTeaser {
  slug: string;
  titel: string;
  href: string;
  /** „14 Tarife · Stand 17. Sept.“ */
  bestand: string;
  /** „Tarife nebeneinander“ — die Mehrzahl der Kategorie, nicht immer „Tarife“. */
  mehr: string;
  /** „ab“, wo der Bestwert eine Untergrenze ist (Kredit). */
  ab: boolean;
  /** „bis zu“, wo mehr besser ist (Ertrag, Zins). */
  bis: boolean;
  /** „2,90 €“ — der Bestwert, fertig gesetzt. */
  wert: string;
  /** „im Monat“, „im Jahr“ oder leer. */
  periode: string;
  /** „bis 83 € im Jahr sparen“ — fehlt, wo sich kein ehrlicher Satz bilden lässt. */
  spanne?: string;
  saeulen: TeaserSaeule[];
  /** Höhe der Ø-Linie in Prozent und ihr Etikett („Ø 5,40 €“). */
  schnitt: number;
  schnittText: string;
  /** „Bestwert · 83 € im Jahr gespart“ bzw. „Bestwert · 1,4 Prozentpunkte mehr“. */
  bestFuss: string;
  /** „teuerster 9,80 €“ bzw. „niedrigster 0,45 %“. */
  randFuss: string;
}

/**
 * Der Zusatz hinter der Zahl — „im Monat", „im Jahr" oder, wo die Spalte keine Periode
 * nennt, ihre Kurzform („Ertrag", „eff. Zins"). Eine große Zahl ohne Wort dahinter ist
 * keine Angabe.
 *
 * 🚨 Die Periode steht im LABEL, nicht in der Einheit — dieselbe Lehre wie in
 * `eingabenSatz` (lib/financeads/kursblatt.ts): „Orders / Jahr" ist eine Stückzahl.
 * Hier greift die Regel nur auf Geld- und Prozentspalten, und dort ist sie eindeutig.
 */
function periodeAus(spalte: SpalteDef): { text: string; proJahr: number } {
  if (/\/\s*Monat/i.test(spalte.label)) return { text: "im Monat", proJahr: 12 };
  if (/\/\s*Jahr/i.test(spalte.label)) return { text: "im Jahr", proJahr: 1 };
  return { text: spalte.kurz || spalte.label, proJahr: 0 };
}

/**
 * Was die Spanne zwischen bestem und schlechtestem Angebot wert ist — einmal als Satz
 * für die Preiszeile, einmal kurz für die Fußzeile des Bandes.
 *
 * 🚨 In Euro je JAHR wird nur dort hochgerechnet, wo das Label eine Periode nennt.
 * Ein Jahresbeitrag mal zwölf wäre eine erfundene Zahl.
 * 🚨 Und die Fußzeile ist ein eigener Satz, keine Verlängerung der Preiszeile. Sie
 * stand einmal als „Bestwert · 6,23 Prozentpunkte günstiger gespart" da.
 */
function spanneSatz(spalte: SpalteDef, spanne: number, guenstiger: boolean, bestText: string): { lang: string; fuss: string } | null {
  if (spanne <= 0) return null;
  if (spalte.art === "geld") {
    const { proJahr } = periodeAus(spalte);
    const jahr = proJahr ? formatGeld(spanne * proJahr) : formatGeld(spanne);
    if (!guenstiger) return { lang: `bis ${jahr} mehr`, fuss: `Bestwert · ${jahr} Vorsprung` };
    return proJahr
      ? { lang: `bis ${jahr} im Jahr sparen`, fuss: `Bestwert · ${jahr} im Jahr gespart` }
      : { lang: `bis ${jahr} Unterschied`, fuss: `Bestwert · ${jahr} gespart` };
  }
  if (spalte.art === "prozent") {
    const punkte = `${formatZahl(spanne, 2)} Prozentpunkte`;
    // In der Fußzeile steht der Bestwert selbst: „0,68 % besser" wäre falsch (Punkte sind
    // keine Prozent), und „Pp." liest niemand.
    return {
      lang: guenstiger ? `bis ${punkte} günstiger` : `bis ${punkte} mehr`,
      fuss: `Bestwert · ${bestText}`,
    };
  }
  return null;
}

/** „Tierkrankenversicherung Vergleich“ → „Tierkrankenversicherung“: der Kicker sagt es schon. */
function ohneVergleich(titel: string): string {
  return titel.replace(/\s*[-–—·]?\s*Vergleich$/i, "").trim() || titel;
}

/**
 * Ein Teaser aus einem Schnappschuss. `null`, wenn es nichts zu zeigen gibt: Klasse B,
 * kein Schnappschuss, keine Hauptspalte oder weniger als zwei Zahlen — ein Band aus
 * einer Säule ist kein Markt.
 */
export async function teaserFuer(slug: string, verweis: WerkzeugVerweis | undefined): Promise<VergleichTeaser | null> {
  if (!verweis) return null;
  const daten = await getVergleichDaten(slug);
  if (!daten || daten.klasse !== "A") return null;
  const def = kategorieDef(daten.kategorie);
  if (!def) return null;
  const spalte = hauptspalte(def);
  if (!spalte) return null;

  const variante = daten.varianten.find((v) => v.schluessel === daten.standard) || daten.varianten[0];
  if (!variante) return null;
  const werte = variante.produkte
    .map((p: VergleichProdukt) => p.kennzahlen[spalte.key])
    .filter((w): w is number => typeof w === "number");
  if (werte.length < 2) return null;

  // Dieselbe Rechnung wie im großen Band des Kursblatts, nur mit dem kleineren Sockel.
  const { hoehe, best, rand, schnitt, guenstiger } = saeulenSkala(werte, spalte.richtung === "hoch", SOCKEL_TEASER);
  const min = Math.min(...werte);
  const max = Math.max(...werte);

  // Günstig nach teuer, also der Bestwert links.
  const sortiert = [...werte].sort((a, b) => (guenstiger ? a - b : b - a));
  const saeulen: TeaserSaeule[] = sortiert.map((w) => ({
    hoehe: hoehe(w),
    best: w === best,
    wert: formatKennwert({ ...spalte, ab: false }, w),
  }));
  // Nur EINE Säule trägt den Bestwert, auch wenn zwei Angebote gleich gut sind.
  let gesetzt = false;
  for (const s of saeulen) { if (s.best && gesetzt) s.best = false; else if (s.best) gesetzt = true; }

  const bestText = formatKennwert({ ...spalte, ab: false }, best);
  const spanne = spanneSatz(spalte, Math.abs(max - min), guenstiger, bestText);
  const periode = periodeAus(spalte).text;
  const stand = new Date(daten.stand);
  const standText = Number.isNaN(stand.getTime())
    ? ""
    : stand.toLocaleDateString("de-DE", { day: "numeric", month: "short" });

  return {
    slug,
    titel: ohneVergleich(verweis.titel),
    href: verweis.href,
    bestand: `${daten.anzahl} ${def.mehrzahl}${standText ? ` · Stand ${standText}` : ""}`,
    mehr: `${def.mehrzahl} nebeneinander`,
    ab: Boolean(spalte.ab),
    /** Wo mehr besser ist, ist der Bestwert eine OBERgrenze. */
    bis: !guenstiger,
    wert: bestText,
    periode,
    spanne: spanne?.lang,
    saeulen,
    schnitt: hoehe(schnitt),
    schnittText: `Ø ${spalte.art === "prozent" ? formatProzent(schnitt) : formatKennwert({ ...spalte, ab: false }, schnitt)}`,
    bestFuss: spanne ? spanne.fuss : `Bestwert · ${bestText}`,
    randFuss: `${guenstiger ? "teuerster" : "schwächster"} ${formatKennwert({ ...spalte, ab: false }, rand)}`,
  };
}

/**
 * Alle Teaser der Zeile.
 *
 * 🚨 Höchstens zwei Abrufe gleichzeitig. Jeder geht als REST-Anfrage ans WordPress, und
 * das verträgt keine Parallellast (CLAUDE.md, Falle 1). Vier Slugs sind in zwei Runden
 * durch; der Data-Cache hält sie danach 24 h.
 */
export async function teaserZeile(index: Map<string, WerkzeugVerweis>, slugs: string[] = TEASER_VERGLEICHE): Promise<VergleichTeaser[]> {
  const aus: (VergleichTeaser | null)[] = new Array(slugs.length).fill(null);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(2, slugs.length) }, async () => {
      while (i < slugs.length) {
        const k = i++;
        aus[k] = await teaserFuer(slugs[k], index.get(`vergleich:${slugs[k]}`));
      }
    }),
  );
  return aus.filter((t): t is VergleichTeaser => t !== null);
}
