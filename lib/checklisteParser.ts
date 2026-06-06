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
  // Leerzeichen entfernen, um Buchstaben-Sperrung ("D A S  D I G I T A L E") mitzufangen
  const c = t.replace(/ /g, "").toUpperCase();
  return (
    c === "FINANZLESER" ||
    c === "DASDIGITALE" ||
    c === "FINANZMAGAZIN" ||
    c === "CHECKLISTE" ||
    c.startsWith("SCHRITT-FÜR-SCHRITT")
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
        if (str.replace(/ /g, "").toUpperCase() === "CHECKLISTE") foundChecklisteMarker = true;
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

type Mat = [number, number, number, number, number, number];
function _matMul(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

interface DetectedBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/**
 * Erkennt quadratische Pfad-Boxen (Checkboxen, Nummernkreise) einer Seite – inkl. CTM-Tracking,
 * damit die Koordinaten in derselben Nutzer-Space wie die Text-Items liegen.
 */
async function extractBoxesOnPage(
  page: { getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[] }> },
  OPS: Record<string, number>
): Promise<DetectedBox[]> {
  const ops = await page.getOperatorList();
  let ctm: Mat = [1, 0, 0, 1, 0, 0];
  const stack: Mat[] = [];
  const seen = new Set<string>();
  const boxes: DetectedBox[] = [];

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn === OPS.save) { stack.push([...ctm]); continue; }
    if (fn === OPS.restore) { ctm = stack.pop() || [1, 0, 0, 1, 0, 0]; continue; }
    if (fn === OPS.transform) { ctm = _matMul(ctm, ops.argsArray[i] as Mat); continue; }
    if (fn !== OPS.constructPath) continue;

    const a = ops.argsArray[i] as [number[], number[]];
    const sub = a[0];
    const co = a[1];
    const xs: number[] = [];
    const ys: number[] = [];
    let ci = 0;
    const pt = (x: number, y: number) => {
      xs.push(ctm[0] * x + ctm[2] * y + ctm[4]);
      ys.push(ctm[1] * x + ctm[3] * y + ctm[5]);
    };
    for (const so of sub) {
      if (so === OPS.rectangle) {
        const x = co[ci++], y = co[ci++], w = co[ci++], h = co[ci++];
        pt(x, y); pt(x + w, y + h);
      } else if (so === OPS.moveTo || so === OPS.lineTo) {
        pt(co[ci++], co[ci++]);
      } else if (so === OPS.curveTo) {
        ci += 4; pt(co[ci++], co[ci++]);
      } else if (so === OPS.curveTo2) {
        ci += 2; pt(co[ci++], co[ci++]);
      } else if (so === OPS.curveTo3) {
        pt(co[ci++], co[ci++]); ci += 2;
      }
    }
    if (!xs.length) continue;
    const minx = Math.min(...xs), maxx = Math.max(...xs);
    const miny = Math.min(...ys), maxy = Math.max(...ys);
    const w = maxx - minx, h = maxy - miny;
    if (w > 8 && w < 60 && h > 8 && h < 60) {
      const cx = Math.round((minx + maxx) / 2);
      const cy = Math.round((miny + maxy) / 2);
      const key = `${cx},${cy}`;
      if (!seen.has(key)) { seen.add(key); boxes.push({ cx, cy, w, h }); }
    }
  }
  return boxes;
}

/**
 * Checkbox-Mittelpositionen: erkennt das echte Kästchen-Rechteck pro nummerierter Zeile.
 * Funktioniert unabhängig davon, ob die Checkbox links neben der Nummer (alte Checklisten)
 * oder rechts außen sitzt (neues Studio-Layout). Fallback auf "Nummer + 28px", falls in einer
 * Zeile kein Kästchen erkannt wird.
 */
async function extractCheckboxPositions(
  buffer: Buffer
): Promise<CheckboxPosition[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const OPS = pdfjsLib.OPS as unknown as Record<string, number>;

  const positions: CheckboxPosition[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const boxes = await extractBoxesOnPage(page, OPS);
    const content = await page.getTextContent();

    for (const item of content.items) {
      const str = (item as { str?: string }).str?.trim();
      if (!str || !/^\d{2}$/.test(str)) continue;
      const tx = (item as { transform: number[] }).transform;
      const nx = tx[4], ny = tx[5];

      // In dieser Zeile (y ≈ Nummer) das Kästchen finden, das NICHT der Nummernkreis ist
      let best: DetectedBox | null = null;
      let bestDy = Infinity;
      for (const b of boxes) {
        const dy = Math.abs(b.cy - ny);
        if (dy > 22) continue;
        if (Math.abs(b.cx - nx) < 20) continue; // Nummernkreis um die Ziffer ausschließen
        if (dy < bestDy) { best = b; bestDy = dy; }
      }

      if (best) {
        positions.push({ page: p, x: best.cx, y: best.cy });
      } else {
        positions.push({ page: p, x: nx + 28, y: ny + 1 }); // Fallback (alte Logik)
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
