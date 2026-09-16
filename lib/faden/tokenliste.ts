import type React from "react";

/**
 * Die Namen des Verzeichnisses — mit ihrer Aufgabe, nicht mit ihrem Wert.
 *
 * 🚨 HIER STEHEN KEINE WERTE. Der Schaukasten liest sie zur Laufzeit mit
 * `getComputedStyle` aus dem lebenden Baum (components/faden/SchaukastenTokens.tsx).
 * Eine abgeschriebene Liste veraltet beim ersten Umbau — und dann zeigt der Schaukasten
 * etwas anderes als die Seite.
 *
 * Wer in app/tokens.css ein Token ergänzt, trägt hier den NAMEN und die AUFGABE nach.
 * Der Wert kommt von selbst.
 */

export type Art = "farbe" | "linie" | "mass" | "schrift" | "form" | "bewegung";

/**
 * Wie eine Schriftrolle WIRKLICH aussieht, wenn sie im Satz steht. Das `font:` allein
 * reicht nicht: Versalien und Laufweite des Kickers stehen in `.kicker`, nicht im
 * Kurzschreiben — eine Probe nur mit `font:` zeigte deshalb Gemischtschrift, wo auf der
 * Seite Versalien stehen.
 */
export const SCHRIFT_ZUSATZ: Record<string, React.CSSProperties> = {
  "--schrift-kicker": { textTransform: "uppercase", letterSpacing: "var(--laufweite-kicker)", color: "var(--muted)" },
  "--schrift-mini": { color: "var(--muted)" },
  "--schrift-klein": { color: "var(--muted)" },
  "--schrift-hinweis": { color: "var(--muted)" },
  "--schrift-tabelle": { textTransform: "uppercase", letterSpacing: "var(--laufweite-band)", background: "var(--ink)", color: "var(--auf-tinte)", padding: "2px 8px" },
  "--schrift-zitat": { color: "var(--ink)" },
  "--schrift-vorspann": { color: "var(--ink)" },
  "--schrift-anriss": { color: "var(--ink)" },
  "--schrift-rubrik": { color: "var(--pink)" },
  "--schrift-wert": { color: "var(--ink)", fontVariantNumeric: "tabular-nums" },
  "--schrift-kennzahl": { color: "var(--tuerkis)", fontVariantNumeric: "tabular-nums" },
};

export interface Tokengruppe {
  titel: string;
  /** Wie die Werte gezeigt werden. */
  art: Art;
  /** Ein Satz darüber, warum es diese Gruppe gibt. */
  regel?: string;
  tokens: [name: string, aufgabe: string][];
}

export const TOKENGRUPPEN: Tokengruppe[] = [
  {
    titel: "Flächen",
    art: "farbe",
    regel: "Papierfarbe, nicht Weiß. `--paper` ist der Grund von allem; `--auflage` gibt es nur für Dinge, die über dem Papier schweben.",
    tokens: [
      ["--paper", "Die Seite. Standardgrund für alles"],
      ["--auflage", "Nur was schwebt: Menü, Dialog, Eingabefeld, Tooltip"],
      ["--auf-tinte", "Schrift und Glyph AUF einer Tintefläche — das einzige reine Weiß"],
      ["--placeholder", "Bildplatz, eine Spur dunkler als das Papier"],
      ["--raster", "Der grüne Hauch hinter Bildplätzen"],
    ],
  },
  {
    titel: "Tinte",
    art: "farbe",
    regel: "Eine Farbe, neun Deckungen. Die Prozentzahl steht im Namen, damit die Handoff-Tabelle ohne Übersetzung lesbar bleibt.",
    tokens: [
      ["--ink", "Titel, Fließtext, volle Linie"],
      ["--ink-45", "Kleine Teilstriche, Punktführung"],
      ["--ink-35", "Grundlinie einer Eingabe"],
      ["--ink-30", "Rahmen eines Segments"],
      ["--ink-25", "Kontur eines Chips"],
      ["--ink-20", "Kapitelkopf, Gleis"],
      ["--ink-16", "Blocktrenner — die häufigste Linie"],
      ["--ink-12", "Zeilen in Listen"],
      ["--ink-08", "Feinster Trenner, Gitterlinie"],
      ["--ink-05", "Hover-Grund einer Zeile"],
      ["--muted", "Kicker, Meta, Hinweis, Bildunterschrift, Rang"],
    ],
  },
  {
    titel: "Marke",
    art: "farbe",
    regel: "Die Liste des Handoffs („Farben (nur diese)“) und nichts darüber hinaus.",
    tokens: [
      ["--green", "Marke als FLÄCHE: Punkte, Haken, Knopfscheibe"],
      ["--green-ink", "Marke als SCHRIFT — kontraststark genug auf Papier"],
      ["--pink", "Zweitmarke: Rechner, Spiel, Finanzwort, Fehler"],
      ["--tuerkis", "Vergleich: Bestwert, Nadel, Kurve, CTA"],
      ["--tuerkis-hell", "Siegel „Bestwert“, Grund der Bestwertzeile"],
      ["--lila", "Checklisten"],
      ["--blau", "Dokumente"],
      ["--rot", "Fehler und Warnung"],
    ],
  },
  {
    titel: "Hauchtöne der Zustände",
    art: "farbe",
    regel: "Vier Gründe für vier Zustände — mehr Zustände gibt es nicht.",
    tokens: [
      ["--tint", "Grün: richtig, Erfolg, Marke, Fokusring"],
      ["--pink-tint", "Magenta: Rechner, Zweitmarke"],
      ["--tuerkis-hauch", "Türkis: Vergleich, Hinweis"],
      ["--rot-hauch", "Rot: falsch, Fehler"],
      ["--tuerkis-grund", "Grund der Bestwertzeile in einer Liste"],
      ["--schleier", "Hinter einer Schublade — der einzige Ort für Schwarz"],
    ],
  },
  {
    titel: "Werkzeugfarben",
    art: "farbe",
    regel: "Der Punkt vor dem Kicker, die Linie über dem Einhänger.",
    tokens: [
      ["--tool-rechner", "Rechner"],
      ["--tool-vergleich", "Vergleiche"],
      ["--tool-checkliste", "Checklisten"],
      ["--tool-dokumente", "Dokumente"],
    ],
  },
  {
    titel: "Linien",
    art: "linie",
    regel: "Fünf Stufen derselben Tinte, benannt nach ihrer AUFGABE. Wer die Deckung meint, nimmt --ink-*; wer den Trenner meint, nimmt --rule-*.",
    tokens: [
      ["--rule-soft", "Feinster Trenner (Verzeichnis)"],
      ["--rule-fein", "Zeilen in Listen"],
      ["--rule", "Blocktrenner"],
      ["--rule-mid", "Kapitelkopf, Fortschrittsgleis, Chipkontur"],
      ["--rule-strong", "Volle Tinte: Blockkopf, Knopfrand"],
    ],
  },
  {
    titel: "Strichstärken",
    art: "mass",
    regel: "Drei, und jede sagt etwas anderes: trennen · abschließen · eröffnen.",
    tokens: [
      ["--strich-haar", "Trennt"],
      ["--strich-stark", "Schließt ab, trägt die Doppellinie"],
      ["--strich-einhaenger", "Eröffnet einen Block, trägt die Werkzeugfarbe"],
    ],
  },
  {
    titel: "Abstandsleiter",
    art: "mass",
    regel: "Sieben Sprossen, mehr braucht der Satz nicht. Kein `margin: 37px`. Wer zwischen zwei Sprossen greifen will, greift zur höheren — die Zeitung atmet lieber mehr. Layoutmaße gehören NICHT hierher.",
    tokens: [
      ["--luft-xxs", "Haaransatz zwischen zwei Zeilen desselben Gedankens"],
      ["--luft-xs", "Zeilenabstand in einer Liste"],
      ["--luft-s", "Zwischen Kicker und Titel"],
      ["--luft-m", "Innerhalb eines Blocks"],
      ["--luft-l", "Zwischen zwei Teilen eines Blocks"],
      ["--luft-xl", "Zwischen zwei Blöcken"],
      ["--luft-xxl", "Zwischen zwei Kapitelteilen"],
    ],
  },
  {
    titel: "Schriftgrade",
    art: "mass",
    regel: "Die Sprossen tragen ihre Größe im Namen. EINE Halbstufe ist erlaubt: der Kicker auf 10,5 — so steht er im Handoff, und auf 11 gerundet wird er klobig.",
    tokens: [
      ["--grad-kicker", "Versalien"],
      ["--grad-11", "Legende, Achse, Rang"],
      ["--grad-12", "Fußnote, Quelle, kursiver Hinweis"],
      ["--grad-13", "Tabellenzelle, Chip"],
      ["--grad-14", "Knopf, Meta"],
      ["--grad-15", "Fließtext im Kasten, Vorspann"],
      ["--grad-16", "Fließtext im Ratgeber, Titelzeile einer Liste"],
      ["--grad-18", "Zwischentitel, Zitat"],
      ["--grad-20", "Abschnittstitel klein"],
      ["--grad-22", "Kassensturzfrage klein"],
      ["--grad-26", "Wertzeile einer Eingabe, Abschnittstitel groß"],
      ["--grad-28", "Kennzahl"],
      ["--grad-34", "Kassensturzfrage groß"],
      ["--grad-44", "Schlagzeile des Ratgebers"],
    ],
  },
  {
    titel: "Schriftrollen",
    art: "schrift",
    regel: "Jede Rolle ist ein vollständiges `font:` — Schnitt, Grad, Zeile, Familie in einem. Wer eine Rolle setzt, setzt nie zusätzlich font-size oder font-weight daneben.",
    tokens: [
      ["--schrift-kicker", "Kicker · Versalien"],
      ["--schrift-mini", "Legende, Achse, Rang"],
      ["--schrift-klein", "Fußnote, Quelle"],
      ["--schrift-hinweis", "Der kursive Halbsatz rechts"],
      ["--schrift-tabelle", "Tabellenzelle"],
      ["--schrift-text", "Fließtext im Kasten"],
      ["--schrift-fliess", "Fließtext im Ratgeber"],
      ["--schrift-zeile", "Titelzeile in einer Liste"],
      ["--schrift-vorspann", "Vorspann unter der Schlagzeile"],
      ["--schrift-wert", "Die Wertzeile einer Eingabe"],
      ["--schrift-kennzahl", "Die Zahl im Kennzahlenblock"],
      ["--schrift-zwischen", "Zwischentitel im Fließtext"],
      ["--schrift-zitat", "Zitat im Fließtext"],
      ["--schrift-rubrik", "Rubrikzeile über dem Titel"],
      ["--schrift-anriss", "Vorspann des Ratgebers"],
      ["--schrift-abschnitt", "Abschnittstitel"],
      ["--schrift-schlag", "Blockschlagzeile"],
      ["--schrift-gross", "Kassensturzfrage"],
      ["--schrift-titel", "Die Schlagzeile des Ratgebers"],
    ],
  },
  {
    titel: "Formen",
    art: "form",
    regel: "Die Zeitung hat eckige Ecken. Drei Werte, und `0` ist der Normalfall.",
    tokens: [
      ["--radius-kante", "Die einzige erlaubte Abrundung einer Fläche"],
      ["--radius-pille", "Pille, Knopf, Chip, Eingabefeld"],
      ["--radius-kreis", "Punkt, Scheibe, Siegelzahn"],
    ],
  },
  {
    titel: "Schatten",
    art: "form",
    regel: "Drei Höhen, alle in Tinte getönt — schwarzer Schatten auf warmem Papier wirkt grau und fremd.",
    tokens: [
      ["--schatten-auflage", "Liegt auf dem Papier"],
      ["--schatten-schwebend", "Menü, Randspalte"],
      ["--schatten-dialog", "Dialog, Overlay"],
      ["--schatten-oben", "Klebende Leiste, Schatten nach oben"],
      ["--schatten-blatt", "Ein Blatt auf einem Stapel"],
    ],
  },
  {
    titel: "Bewegung",
    art: "bewegung",
    regel: "Zwei Kurven tragen alles: die ruhige und die mit Überschwung (Herzschlag-Prinzip des Handoffs).",
    tokens: [
      ["--kurve", "Standard"],
      ["--ueber", "Überschwung"],
      ["--ueber-sanft", "Überschwung, gedämpft"],
      ["--klappe", "Register aufklappen"],
      ["--tempo", "Ruhig 1.35 · normal 1 · lebhaft .65"],
    ],
  },
  {
    titel: "Maße des Fadens",
    art: "mass",
    regel: "Layout, nicht Satz — deshalb eigene Namen statt der Abstandsleiter.",
    tokens: [
      ["--kopf-h", "Höhe des klebenden Kopfs"],
      ["--spalte", "Breite der Mittelspalte"],
      ["--satzbreite", "Die Breite, in der gesetzt wird (Spalte minus Padding)"],
      ["--rand-l", "Linke Randspalte"],
      ["--rand-r", "Rechte Randspalte"],
      ["--pille-h", "Höhe der Eingabepille"],
    ],
  },
];

/** Alle Namen flach — für einen einzigen getComputedStyle-Durchgang. */
export const ALLE_TOKEN = TOKENGRUPPEN.flatMap((g) => g.tokens.map(([n]) => n));
