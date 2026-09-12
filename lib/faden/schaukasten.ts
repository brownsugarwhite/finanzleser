/**
 * Daten für den Schaukasten (app/schaukasten).
 *
 * Zwei Dinge, die die Bausteine-Seite braucht:
 *  - `STATISTIKEN`: je eine Statistik in jeder der drei Arten, mit Umschalter und Hinweis.
 *  - `schaukastenWerkzeuge()`: die Slugs für die Werkzeugkarten, aus dem ECHTEN Bestand
 *    (`getWerkzeugIndex`) — damit dort echte Karten stehen und nichts bricht, wenn im CMS
 *    ein einzelnes Werkzeug verschwindet. Vergleiche sind bewusst nicht dabei.
 *
 * 🚨 Hier stand bis zum 10.09.2026 ein erfundener Ratgeber als Blindtext. Der ist weg:
 * der Vorlage-Beitrag ist jetzt eine echte Kopie im CMS (`vorlage-test`, angelegt mit
 * `tools/vorlage-test.mjs`), damit sich alles im CMS umstellen und testen lässt.
 */
import type { FadenStatistik } from "@/lib/types";
import { getWerkzeugIndex } from "./werkzeugIndex";

/** Erster vorhandener Slug einer Werkzeugsorte — bevorzugt der genannte. */
function slugFuer(index: Map<string, unknown>, typ: string, wunsch: string[]): string {
  for (const w of wunsch) if (index.has(`${typ}:${w}`)) return w;
  for (const key of index.keys()) if (key.startsWith(`${typ}:`)) return key.slice(typ.length + 1);
  return wunsch[0] || "";
}

export const STATISTIKEN: FadenStatistik[] = [
  {
    abschnitt: "heading-3",
    art: "saeulen",
    titel: "Strompreis für Haushalte",
    untertitel: "Cent je Kilowattstunde, Jahresmittel",
    einheit: "ct/kWh",
    quelle: { name: "Schaukasten – Beispieldaten", url: "https://www.finanzleser.de", stand: "2026" },
    reihen: [
      { key: "gesamt", label: "Gesamtpreis", werte: [
        { label: "2021", wert: 31.9 }, { label: "2022", wert: 37.3 }, { label: "2023", wert: 41.2 },
        { label: "2024", wert: 39.0 }, { label: "2025", wert: 36.4 }, { label: "2026", wert: 34.8 },
      ] },
      { key: "netz", label: "davon Netzentgelte", werte: [
        { label: "2021", wert: 7.9 }, { label: "2022", wert: 8.4 }, { label: "2023", wert: 10.7 },
        { label: "2024", wert: 11.6 }, { label: "2025", wert: 11.2 }, { label: "2026", wert: 10.9 },
      ] },
    ],
    umschalter: { label: "Reihe" },
    hinweis: "Beispieldaten für den Schaukasten — keine echte Erhebung.",
  },
  {
    abschnitt: "heading-4",
    art: "torte",
    titel: "Woraus sich der Strompreis zusammensetzt",
    einheit: "%",
    quelle: { name: "Schaukasten – Beispieldaten", url: "https://www.finanzleser.de", stand: "2026" },
    reihen: [
      { key: "anteile", label: "Anteile", werte: [
        { label: "Beschaffung und Vertrieb", wert: 44 },
        { label: "Netzentgelte", wert: 31 },
        { label: "Steuern und Abgaben", wert: 17 },
        { label: "Messstellenbetrieb", wert: 8 },
      ] },
    ],
  },
  {
    abschnitt: "heading-5",
    art: "balken",
    titel: "Ersparnis nach Maßnahme",
    untertitel: "Euro im Jahr, Haushalt mit 3.500 kWh",
    einheit: "€/Jahr",
    quelle: { name: "Schaukasten – Beispieldaten", url: "https://www.finanzleser.de", stand: "2026" },
    reihen: [
      { key: "spar", label: "Ersparnis", werte: [
        { label: "Anbieterwechsel", wert: 310 },
        { label: "Kühlschrank ersetzen", wert: 95 },
        { label: "LED statt Halogen", wert: 72 },
        { label: "Stand-by abschalten", wert: 58 },
        { label: "Wäsche bei 30 °C", wert: 34 },
      ] },
    ],
    hinweis: "Beispieldaten für den Schaukasten — keine echte Erhebung.",
  },
];

/** Ohne „vergleich": Vergleiche behandelt der Kunde gesondert (Wunsch 10.09.2026). */
export type WerkzeugSlugs = Record<"rechner" | "checkliste" | "dokumente", string>;

/**
 * Werkzeuge für die Bausteine-Seite: die Slugs und ein Stück Gutenberg-HTML, das nur
 * aus deren Blöcken besteht. Das HTML ist der Schlüssel für `getArticleToolData()` —
 * die Funktion liest die Werkzeuge aus dem Inhalt eines Beitrags, hier bekommt sie einen
 * Inhalt, der ausschließlich daraus besteht.
 */
export async function schaukastenWerkzeuge(): Promise<{ slugs: WerkzeugSlugs; content: string }> {
  const index = await getWerkzeugIndex();
  const rechner = slugFuer(index, "rechner", ["strompreis", "brutto-netto", "haushaltsrechner"]);
  const checkliste = slugFuer(index, "checkliste", ["stromanbieter-wechseln", "photovoltaik-foerderung"]);
  const dokumente = slugFuer(index, "dokumente", ["kuendigung-stromvertrag", "kuendigung-kfz"]);
  const content = [
    `<div data-finanzleser-rechner="${rechner}"></div>`,
    `<div data-finanzleser-checkliste="${checkliste}"></div>`,
    `<div data-finanzleser-dokumente="${dokumente}"></div>`,
  ].join("\n");
  return { slugs: { rechner, checkliste, dokumente }, content };
}
