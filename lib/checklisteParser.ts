import type {
  ChecklisteData,
  ChecklisteSektionData,
  ChecklistePunktData,
} from "@/components/checkliste/types";

/**
 * Parst eine Checklisten-PDF und extrahiert strukturierte Daten.
 * Arbeitet item-basiert mit pdfjs-dist für präzise Erkennung.
 *
 * PDF-Struktur (identisch für alle finanzleser-Checklisten):
 * - Sektions-Titel: einzelnes Item, Großbuchstaben mit Spacing ("R E C H T L I C H E ...")
 * - Checkpunkt-Nummer: Item mit "01"-"99"
 * - Danach: Titel-Item, dann Beschreibungs-Items
 * - Header: "finanzleser", "DAS DIGITALE", "FINANZMAGAZIN", "C H E C K L I S T E", Titel, "SCHRITT-FÜR-SCHRITT..."
 * - Footer: "Hinweis:", Disclaimer-Text, URL
 */

interface PdfItem {
  str: string;
  type: "section" | "number" | "header" | "footer" | "text";
}

function normalizeSpacedTitle(spaced: string, glyphWords?: string[]): string {
  // Wenn Glyph-Wörter vorhanden → korrekte Worttrennung
  if (glyphWords && glyphWords.length > 0) {
    // Kleine Wörter (Artikel, Präpositionen) bleiben klein – außer am Anfang
    const kleinwörter = new Set([
      "UND", "ODER", "AUF", "DER", "DIE", "DAS", "DEN", "DEM",
      "FÜR", "BEI", "MIT", "VON", "ZU", "IM", "AM", "VOR",
      "NACH", "ÜBER", "UNTER", "IN", "AN", "AUS",
    ]);

    const result: string[] = [];
    for (let i = 0; i < glyphWords.length; i++) {
      const w = glyphWords[i];

      // Bindestrich erhalten: "BANK-AUSWAHL" → "Bank-Auswahl"
      if (w.includes("-")) {
        const parts = w.split("-");
        result.push(
          parts
            .map((p) => {
              const clean = p.replace(/:/g, "").trim();
              if (!clean) return "";
              return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            })
            .filter(Boolean)
            .join("-") + (w.endsWith(":") ? ":" : "")
        );
        continue;
      }

      const hasColon = w.endsWith(":");
      const clean = w.replace(/:/g, "").trim();
      if (!clean) continue;

      // Erstes Wort immer groß, kleine Wörter danach klein
      const isFirst = i === 0;
      const isKlein = kleinwörter.has(clean);

      let word: string;
      if (!isFirst && isKlein) {
        word = clean.toLowerCase();
      } else {
        word = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      }

      result.push(word + (hasColon ? ":" : ""));
    }
    return result.join(" ");
  }
  // Fallback: Sonderzeichen trennen, Rest kollabieren
  const parts = spaced.split(/\s*[:\-]\s*/);
  const normalized = parts.map((part) => {
    const collapsed = part.replace(/ /g, "").trim();
    if (!collapsed) return "";
    return collapsed.charAt(0).toUpperCase() + collapsed.slice(1).toLowerCase();
  });
  const separator = spaced.includes(":") ? ": " : " – ";
  return normalized.filter(Boolean).join(separator);
}

function isSectionTitle(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length < 10) return false;
  const cleaned = trimmed.replace(/[\s:\-]/g, "");
  if (cleaned.length < 5) return false;
  // Großbuchstaben (inkl. Umlaute), Spaces, Doppelpunkte und Bindestriche
  return /^[A-ZÄÖÜ :\-]+$/.test(trimmed) && /^[A-ZÄÖÜ]+$/.test(cleaned);
}

function isNumber(str: string): boolean {
  return /^\d{2}$/.test(str.trim());
}

function isHeaderItem(str: string): boolean {
  const t = str.trim();
  return (
    t === "finanzleser" ||
    t === "DAS DIGITALE" ||
    t === "FINANZMAGAZIN" ||
    t === "C H E C K L I S T E" ||
    t.startsWith("SCHRITT-FÜR-SCHRITT")
  );
}

function isFooterItem(str: string): boolean {
  const t = str.trim();
  return t.startsWith("Hinweis:") || t.includes("finanzleser.de");
}

/**
 * Extrahiert Wörter aus einem showText-Operator anhand der Space-Glyphs.
 * PDF-Sektions-Titel haben zwischen Buchstaben Spacing, aber echte
 * Space-Glyphs (unicode=" ") markieren die Wortgrenzen.
 */
function extractWordsFromGlyphs(
  glyphArray: unknown[]
): string[] {
  const words: string[] = [];
  let currentWord = "";
  for (const el of glyphArray) {
    if (typeof el === "number") continue;
    const glyph = el as { unicode?: string } | null;
    if (!glyph || !glyph.unicode) continue;
    if (glyph.unicode === " ") {
      if (currentWord) words.push(currentWord);
      currentWord = "";
    } else {
      currentWord += glyph.unicode;
    }
  }
  if (currentWord) words.push(currentWord);
  return words;
}

async function extractPdfItems(buffer: Buffer): Promise<{
  items: PdfItem[];
  titel: string;
}> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const OPS = pdfjsLib.OPS;

  const allItems: PdfItem[] = [];
  let titel = "";
  let foundChecklisteMarker = false;

  // Sammle Glyph-Wörter für Sektions-Titel aus den Operatoren
  const sectionGlyphWords = new Map<number, Map<string, string[]>>();

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);

    // Schritt 1: Glyph-Wörter aus showText-Operatoren extrahieren
    const opList = await page.getOperatorList();
    const pageGlyphMap = new Map<string, string[]>();
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === OPS.showText) {
        const arr = opList.argsArray[i][0];
        if (!Array.isArray(arr) || arr.length < 20) continue;
        // Prüfe ob es ein Sektions-Titel ist (viele Glyphs mit Spacing)
        const glyphs = arr.filter(
          (el: unknown) => typeof el !== "number" && el !== null
        );
        const firstGlyph = glyphs[0] as { unicode?: string } | undefined;
        if (!firstGlyph?.unicode) continue;
        // Nur Großbuchstaben-Sequenzen
        const allUpper = glyphs.every((g: { unicode?: string }) => {
          const u = g.unicode || "";
          return u === " " || /^[A-ZÄÖÜ:\-]$/.test(u);
        });
        if (allUpper && glyphs.length >= 8) {
          const words = extractWordsFromGlyphs(arr);
          const fullStr = glyphs
            .map((g: { unicode?: string }) => g.unicode || "")
            .join("");
          // Header-Items rausfiltern
          if (
            fullStr === "DAS DIGITALE" ||
            fullStr === "FINANZMAGAZIN" ||
            fullStr === "CHECKLISTE" ||
            fullStr.startsWith("SCHRITT")
          )
            continue;
          // Key = der zusammengeklebte String ohne Spaces und Sonderzeichen
          const key = fullStr.replace(/[\s:\-]/g, "");
          if (key.length >= 5) {
            pageGlyphMap.set(key, words);
          }
        }
      }
    }
    sectionGlyphWords.set(p, pageGlyphMap);

    // Schritt 2: Text-Items klassifizieren
    const content = await page.getTextContent();
    for (const rawItem of content.items) {
      const str = (rawItem as { str?: string }).str?.trim() || "";
      if (!str) continue;

      if (isHeaderItem(str)) {
        if (str === "C H E C K L I S T E") foundChecklisteMarker = true;
        continue;
      }

      if (foundChecklisteMarker && !titel) {
        titel = str;
        foundChecklisteMarker = false;
        continue;
      }

      if (isFooterItem(str)) continue;

      if (isSectionTitle(str)) {
        // Versuche Glyph-Wörter zu finden
        const collapsed = str.replace(/[\s:\-]/g, "");
        const glyphWords = pageGlyphMap.get(collapsed);
        const normalized = normalizeSpacedTitle(str, glyphWords);
        allItems.push({ str: normalized, type: "section" });
      } else if (isNumber(str)) {
        allItems.push({ str, type: "number" });
      } else {
        allItems.push({ str, type: "text" });
      }
    }
  }

  return { items: allItems, titel };
}

function buildChecklisteFromItems(
  items: PdfItem[],
  titel: string
): ChecklisteData {
  const sektionen: ChecklisteSektionData[] = [];
  let currentSektion: ChecklisteSektionData | null = null;
  let currentPunkt: ChecklistePunktData | null = null;
  let expectingTitle = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.type === "section") {
      currentSektion = {
        titel: item.str,
        punkte: [],
      };
      sektionen.push(currentSektion);
      currentPunkt = null;
      continue;
    }

    if (item.type === "number") {
      if (!currentSektion) {
        currentSektion = { titel: "Allgemein", punkte: [] };
        sektionen.push(currentSektion);
      }
      currentPunkt = {
        nummer: item.str.trim(),
        titel: "",
        beschreibung: "",
      };
      currentSektion.punkte.push(currentPunkt);
      expectingTitle = true;
      continue;
    }

    // Text-Item
    if (currentPunkt) {
      if (expectingTitle) {
        currentPunkt.titel = item.str;
        expectingTitle = false;
      } else {
        // Beschreibung anhängen
        if (currentPunkt.beschreibung) {
          currentPunkt.beschreibung += " " + item.str;
        } else {
          currentPunkt.beschreibung = item.str;
        }
      }
    }
  }

  return { titel, sektionen };
}

export interface CheckboxPosition {
  page: number;
  x: number;
  y: number;
}

/**
 * Extrahiert die Checkbox-Mittelpositionen aus der PDF.
 * Berechnet sie relativ zu den Nummern-Textpositionen (01, 02, ...),
 * da die Checkbox immer rechts neben der Nummer steht.
 */
async function extractCheckboxPositions(
  buffer: Buffer
): Promise<CheckboxPosition[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;

  // Offset von der Nummer-Position zur Checkbox-Mitte (kalibriert)
  const OFFSET_X = 28;
  const OFFSET_Y = 1;

  const positions: CheckboxPosition[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    for (const item of content.items) {
      const str = (item as { str?: string }).str?.trim();
      if (str && /^\d{2}$/.test(str)) {
        const tx = (item as { transform: number[] }).transform;
        positions.push({
          page: p,
          x: tx[4] + OFFSET_X,
          y: tx[5] + OFFSET_Y,
        });
      }
    }
  }

  return positions;
}

/**
 * Hauptfunktion: PDF-Buffer → ChecklisteData + Checkbox-Positionen
 */
export async function parsePDF(buffer: Buffer): Promise<{
  data: ChecklisteData;
  checkboxPositions: CheckboxPosition[];
}> {
  const [{ items, titel }, checkboxPositions] = await Promise.all([
    extractPdfItems(buffer),
    extractCheckboxPositions(buffer),
  ]);
  const data = buildChecklisteFromItems(items, titel);
  return { data, checkboxPositions };
}
