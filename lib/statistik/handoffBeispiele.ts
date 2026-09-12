/**
 * Die Beispieldaten des Design-Handoffs, unverändert.
 *
 * 🚨 BLINDTEXT. „Ø der Partner", „Partner-Bestand Finconext" — diese Zahlen sind erfundene
 * Fülldaten aus `docs/design_handoff_finanzleser_faden/Finanzleser Faden A v2 - Zeitung.dc.html`.
 * Sie stehen hier ausschließlich, damit sich der Nachbau im Schaukasten Seite an Seite mit
 * dem gerenderten Original vergleichen lässt (A/B-Abnahme). Sie dürfen NIE in einen Beitrag.
 *
 * Fundstellen im Handoff sind je Eintrag vermerkt.
 */
import type { Statistik } from "./schema";

const BLIND = { name: "Blindtext des Design-Handoffs", stand: "Design A v2" };

export const HANDOFF_BEISPIELE: Statistik[] = [
  // Zeile 889–894, Logik 1916
  {
    art: "kennzahlen-vierer",
    titel: "Auf einen Blick",
    quelle: BLIND,
    kacheln: [
      { label: "Standard", zahl: 10, einheit: "Mio. €", text: "Deckungssumme pauschal", farbe: "var(--ink)" },
      { label: "Preis", zahl: 4, einheit: "–8 €", text: "im Monat für Singles", farbe: "var(--ink)" },
      { label: "Kaum verbreitet", zahl: 15, einheit: "%", text: "der Haushalte haben keine", farbe: "var(--pink)" },
      { label: "Erledigt in", zahl: 2, einheit: "Min.", text: "Angebot bei Finconext", farbe: "var(--green-ink)" },
    ],
  },
  // Zeile 897–903, Logik 1917
  {
    art: "schrittfolge",
    titel: "So wechseln Sie den Tarif",
    quelle: BLIND,
    schritte: [
      { titel: "Bedingungen des alten Vertrags prüfen", text: "Kündigungsfrist meist drei Monate vor Hauptfälligkeit." },
      { titel: "Neuen Tarif mit 10 Mio. € wählen", text: "Komfort-Stufe eines Partners, Beginn zur Fälligkeit." },
      { titel: "Erst neu abschließen, dann kündigen", text: "So entsteht keine Lücke – auch nicht für einen Tag." },
      { titel: "Police in den Aktenkoffer legen", text: "Leo setzt den Wächter für die nächste Fälligkeit." },
    ],
  },
  // Zeile 904–914, Logik 2037
  {
    art: "abwaegung",
    titel: "Selbstbehalt vereinbaren?",
    quelle: BLIND,
    pro: ["Beitrag sinkt um 15 bis 25 Prozent.", "Kleinschäden bleiben ohne Papierkrieg.", "Schadenfreiheit hebt keine Rabatte."],
    contra: ["Bei 150 € Selbstbehalt zahlen Sie den Kratzer selbst.", "Ersparnis liegt oft unter 15 € im Jahr.", "Im Streitfall trotzdem Meldepflicht."],
  },
  // Zeile 915–921, Logik 2038
  {
    art: "begriffe",
    titel: "Aus dem Glossar",
    quelle: BLIND,
    begriffe: [
      { begriff: "Deckungssumme", text: "Höchstbetrag, den der Versicherer je Schadenfall zahlt." },
      { begriff: "Forderungsausfall", text: "Ihre eigene Police zahlt, wenn der Schädiger zahlungsunfähig ist." },
      { begriff: "Gefälligkeitsschaden", text: "Schaden bei unbezahlter Hilfe – etwa beim Umzug." },
    ],
  },
  // Zeile 927–932, Logik 2039
  {
    art: "kennzahlen-liste",
    titel: "Privathaftpflicht in Deutschland",
    quelle: BLIND,
    zeilen: [
      { name: "Haushalte mit Privathaftpflicht", wert: "85 %" },
      { name: "Ø Jahresbeitrag Single", wert: "62 €" },
      { name: "Ø Jahresbeitrag Familie", wert: "84 €" },
      { name: "Schäden je 100 Verträge", wert: "5,8" },
      { name: "Ø Schadenhöhe", wert: "1.240 €" },
    ],
  },
  // Zeile 934–942, Logik 1918
  {
    art: "zeitstrahl",
    titel: "Vom Schaden zur Zahlung",
    quelle: BLIND,
    stationen: [
      { marke: "Tag 0", text: "Schaden melden", x: 0 },
      { marke: "Tag 3", text: "Unterlagen nachreichen", x: 30 },
      { marke: "Tag 12", text: "Prüfung durch Partner", x: 62 },
      { marke: "Tag 21", text: "Zahlung", x: 100 },
    ],
  },
  // Zeile 948–965, Logik 1871
  {
    art: "kreis",
    titel: "Wofür die Hausrat zahlt",
    untertitel: "Anteil an den Leistungen 2025, GDV",
    einheit: "%",
    quelle: BLIND,
    stuecke: [
      { label: "Leitungswasser", wert: 38 },
      { label: "Einbruch", wert: 22 },
      { label: "Feuer", wert: 14 },
      { label: "Sturm und Hagel", wert: 12 },
      { label: "Elementar", wert: 8 },
      { label: "Sonstiges", wert: 6 },
    ],
  },
  // Zeile 966–985, Logik 1876
  {
    art: "saeulen",
    titel: "Jahresbeitrag Single und Familie",
    untertitel: "Ø der Partner, Tarif Komfort, in Euro",
    quelle: BLIND,
    maximum: 110,
    reihen: [{ label: "Single" }, { label: "Familie" }],
    kategorien: [
      { label: "2021", werte: [58, 74] },
      { label: "2022", werte: [60, 78] },
      { label: "2023", werte: [63, 82] },
      { label: "2024", werte: [68, 88] },
      { label: "2025", werte: [73, 94] },
      { label: "2026", werte: [76, 99] },
    ],
  },
  // Zeile 986–1004, Logik 1879
  {
    art: "spannen",
    titel: "Jahresbeitrag von bis, Median",
    untertitel: "Zehn Partner, Single, 10 Mio. € Deckung",
    einheit: "€",
    quelle: BLIND,
    skala: { von: 0, bis: 200 },
    zeilen: [
      { name: "Basis", min: 38, median: 52, max: 68 },
      { name: "Komfort", min: 52, median: 68, max: 96 },
      { name: "Premium", min: 84, median: 112, max: 158 },
      { name: "Familie", min: 60, median: 84, max: 132 },
    ],
  },
  // Zeile 624–631, Logik 1895
  {
    art: "anteilsleiste",
    titel: "Wofür die Haftpflicht zahlt",
    untertitel: "Anteil an den Leistungen 2025, Partner-Bestand",
    einheit: "%",
    quelle: BLIND,
    stuecke: [
      { label: "Personenschäden", wert: 41 },
      { label: "Sachschäden", wert: 33 },
      { label: "Mietsachschäden", wert: 16 },
      { label: "Schlüsselverlust", wert: 10 },
    ],
  },
  // Zeile 632–648, Logik 1900
  {
    art: "tabelle",
    titel: "Drei Tarifstufen unserer Partner",
    untertitel: "Single, ohne Selbstbehalt, 2026",
    quelle: BLIND,
    zeilenkopf: "Leistung",
    spalten: [{ name: "Basis" }, { name: "Komfort", tag: "Empfehlung", hervor: true }, { name: "Premium" }],
    zeilen: [
      { name: "Deckungssumme pauschal", werte: ["5 Mio. €", "10 Mio. €", "50 Mio. €"] },
      { name: "Schlüsselverlust", werte: ["–", "✓", "✓"] },
      { name: "Forderungsausfall", werte: ["–", "✓", "✓"] },
      { name: "Gefälligkeitsschäden", werte: ["–", "✓", "✓"] },
      { name: "Deliktunfähige Kinder", werte: ["–", "✓", "✓"] },
      { name: "Jahresbeitrag Single", werte: ["46 €", "68 €", "112 €"] },
    ],
    fussnote: "✓ enthalten · – nicht enthalten · Empfehlung der Redaktion: Komfort.",
  },
  // Zeile 649–668, Logik 1901–1906
  {
    art: "linien",
    titel: "Jahresbeitrag Komfort 2019–2026",
    untertitel: "Ø der Partner, Single, in Euro",
    einheit: "€",
    quelle: BLIND,
    achse: ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"],
    yAchse: { min: 50, max: 80 },
    notiz: "Inflation seit 2019",
    reihen: [
      { label: "Jahresbeitrag Komfort", werte: [58, 60, 61, 63, 66, 70, 73, 76] },
      { label: "Inflation seit 2019", werte: [58, 58.3, 60.1, 64.2, 68.1, 69.7, 71.2, 72.6] },
    ],
  },
  // Zeile 1005–1030
  {
    art: "vergleichsrechner",
    titel: "Privathaftpflicht vergleichen",
    quelle: BLIND,
    slug: "private-haftpflichtversicherung-vergleich",
  },
];
