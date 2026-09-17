"use client";

/**
 * Zeilenumbrüche EINMAL ausrechnen und danach festschreiben.
 *
 * 🚨 Der Grund: Im Verzeichnis wechselt der aktive Eintrag den Schriftschnitt (400 → 600
 * bzw. 700). Ein fetterer Schnitt läuft breiter, also bricht der Browser den Text an
 * anderen Stellen um — der Eintrag wächst beim Vorbeirollen um eine Zeile und schiebt die
 * halbe Liste. Gemessen über alle 1026 Beitragstitel: 48 davon brauchen fett eine Zeile
 * mehr als mager.
 *
 * Die Lösung des Users (17.09.2026): den Text von Hand umbrechen und den automatischen
 * Umbruch abschalten. Gemessen wird in der Lage, in der der Text am breitesten läuft —
 * also im FETTEN Schnitt. Was dort passt, passt mager erst recht; und weil danach
 * `white-space: nowrap` gilt, kann kein Zustandswechsel und keine Bewegung mehr etwas am
 * Umbruch ändern. Echte `font-weight`-Werte und alle Animationen bleiben damit erhalten.
 *
 * Gemessen wird in einem versteckten Kasten mit denselben Schriftwerten und derselben
 * Breite — nicht am echten Element, denn das gehört React.
 */

/** Wo der Browser den Text im gegebenen Kasten umbricht — eine Zeichenkette je Zeile. */
function zeilenVon(kasten: HTMLElement, text: string): string[] {
  kasten.textContent = text;
  const knoten = kasten.firstChild as Text | null;
  if (!knoten) return [text];
  const bereich = document.createRange();
  bereich.selectNodeContents(knoten);
  // Ein Rechteck je Zeile (ein einzelner Textknoten, also keine Mehrfachrechtecke je Zeile).
  const kanten = [...new Set(Array.from(bereich.getClientRects()).map((r) => Math.round(r.top)))].sort((a, b) => a - b);
  if (kanten.length <= 1) return [text];
  const zeilen: string[] = [];
  let anfang = 0;
  let k = 1;
  for (let i = 1; i < text.length && k < kanten.length; i++) {
    bereich.setStart(knoten, i);
    bereich.setEnd(knoten, i + 1);
    const r = bereich.getBoundingClientRect();
    if (!r.height) continue;
    if (Math.round(r.top) >= kanten[k]) {
      zeilen.push(text.slice(anfang, i).trim());
      anfang = i;
      k++;
    }
  }
  zeilen.push(text.slice(anfang).trim());
  return zeilen.filter(Boolean);
}

/**
 * @param texte    die umzubrechenden Zeichenketten
 * @param muster   ein echtes Element derselben Art — von ihm kommen Schrift und Breite
 * @param gewicht  der Schnitt der AKTIVEN Lage (der breiteste, in dem gemessen wird)
 */
export function brichZeilen(texte: string[], muster: HTMLElement, gewicht: number): Map<string, string[]> {
  const aus = new Map<string, string[]>();
  const breite = muster.getBoundingClientRect().width;
  if (!breite || typeof document === "undefined") return aus;
  const s = getComputedStyle(muster);
  const kasten = document.createElement("div");
  // Die Schriftwerte einzeln kopieren: die `font`-Kurzform liefert nicht in jedem Browser
  // einen Wert, wenn die Teilwerte einzeln gesetzt wurden.
  Object.assign(kasten.style, {
    position: "absolute", left: "-9999px", top: "0", visibility: "hidden", pointerEvents: "none",
    whiteSpace: "normal", wordBreak: s.wordBreak, overflowWrap: s.overflowWrap, hyphens: s.hyphens,
    width: `${breite}px`,
    fontFamily: s.fontFamily, fontSize: s.fontSize, fontStyle: s.fontStyle, lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing, wordSpacing: s.wordSpacing, textTransform: s.textTransform,
    fontWeight: String(gewicht),
  });
  document.body.appendChild(kasten);
  try {
    for (const t of texte) if (t && !aus.has(t)) aus.set(t, zeilenVon(kasten, t));
  } finally {
    kasten.remove();
  }
  return aus;
}
