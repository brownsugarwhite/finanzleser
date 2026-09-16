/**
 * Inventur des Fadens: Welche Schriftgrade, Farben und Knopfformen gibt es wirklich?
 *
 * 🚨 Die Quelle sind DIE STYLESHEETS SELBST, zur Bauzeit gelesen. Keine gepflegte Liste,
 * kein zweiter Satz Beispiele: Was hier steht, steht auch im Faden — ändert jemand eine
 * Regel, ändert sich diese Übersicht mit. Genau darum lässt sich an ihr ablesen, was
 * doppelt ist und was zusammengelegt gehört.
 *
 * Läuft nur serverseitig (`node:fs`) und nur im Schaukasten, der ohnehin an
 * SCHAUKASTEN_AKTIV hängt.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATEIEN = [
  "faden.css", "faden-landing.css", "faden-hover.css", "kassensturz.css",
  "finanzwort.css", "spiele.css", "schlange.css", "leo-fragt.css", "statistik-formen.css",
];

export interface Fund { wert: string; stellen: { sel: string; datei: string }[] }
/** Eine Form, die sich im Schaukasten als echtes Element zeigen lässt. */
export interface Form { klasse: string; datei: string; element: "a" | "button" }

interface Regel { sel: string; block: string; datei: string }

function regeln(): Regel[] {
  const aus: Regel[] = [];
  for (const datei of DATEIEN) {
    let css: string;
    try { css = readFileSync(join(process.cwd(), "app", datei), "utf8"); } catch { continue; }
    // Kommentare raus, sonst zählt Prosa als Wert.
    const rein = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rein))) {
      const sel = m[1].trim().replace(/\s+/g, " ");
      if (sel.startsWith("@") || !sel) continue;
      aus.push({ sel, block: m[2], datei });
    }
  }
  return aus;
}

function sammeln(treffer: (r: Regel) => string[]): Fund[] {
  const map = new Map<string, { sel: string; datei: string }[]>();
  for (const r of regeln()) {
    for (const w of treffer(r)) {
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push({ sel: r.sel, datei: r.datei });
    }
  }
  return [...map.entries()]
    .map(([wert, stellen]) => ({ wert, stellen }))
    .sort((a, b) => b.stellen.length - a.stellen.length);
}

/** Schriftgrade — nur die Größe; Schnitt und Familie sind hier nicht die Frage. */
export function schriftgrade(): Fund[] {
  return sammeln(({ block }) => {
    const aus: string[] = [];
    for (const m of block.matchAll(/(?:^|;)\s*font\s*:\s*([^;]+)/g)) {
      const w = m[1];
      if (/var\(--schrift/.test(w)) { aus.push(w.trim()); continue; }
      const c = w.match(/clamp\([^)]*\)/);
      if (c) aus.push(c[0].replace(/\s+/g, ""));
      else { const g = w.match(/\d+(?:\.\d+)?(?:px|rem|em)/); if (g) aus.push(g[0]); }
    }
    for (const m of block.matchAll(/(?:^|;)\s*font-size\s*:\s*([^;]+)/g)) {
      const w = m[1].trim();
      if (w === "inherit" || w === "unset") continue;
      aus.push(/clamp|var\(/.test(w) ? w.replace(/\s+/g, "") : w);
    }
    return aus;
  });
}

/** Farbwerte, die NICHT aus einem Token kommen — die Kandidatenliste zum Zusammenlegen. */
export function harteFarben(): Fund[] {
  return sammeln(({ block, sel }) => {
    // Die Tokendefinition selbst ist keine Fundstelle, sonst zählt sich jedes Token mit.
    if (sel === ".faden-shell") return [];
    return [...block.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)]
      .map((m) => m[0].toLowerCase().replace(/\s+/g, ""))
      .filter((w) => w !== "rgba(0,0,0,0)");
  });
}

/**
 * Jede Knopf- und Linkform, die im Faden eine eigene Regel hat — als einfache Klasse,
 * damit der Schaukasten sie wirklich rendern kann. Selektoren mit Kombinatoren,
 * Pseudoklassen oder Verschachtelung fallen heraus: Die zeigt man nicht als Muster,
 * die sind Zustände.
 */
export function knopfformen(): Form[] {
  const treffer = /^\.faden-shell \.([a-z0-9_-]+(?:--[a-z0-9-]+)?)$/;
  const gesucht = /(btn|knopf|chip|textlink|pfeil-link|taste|schalter)/;
  const map = new Map<string, Form>();
  for (const { sel, datei } of regeln()) {
    const m = sel.match(treffer);
    if (!m || !gesucht.test(m[1])) continue;
    if (!map.has(m[1])) map.set(m[1], { klasse: m[1], datei, element: "button" });
  }
  return [...map.values()].sort((a, b) => a.klasse.localeCompare(b.klasse, "de"));
}
