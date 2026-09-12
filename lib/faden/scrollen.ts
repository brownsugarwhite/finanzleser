/**
 * Die Scroll-Grammatik des Fadens — Portierung aus dem Prototyp
 * (`docs/prototype/src/03-js-core.html`: `folgt`, `zeigeAnfang`, `anhaengen`, `kopfH`).
 *
 * 🚨 Der Kern, der in der Umsetzung fehlte: **Der Faden scrollt nicht bei jedem neuen
 * Inhalt, sondern nur, wenn der Leser am Ende steht.** Wer hochgescrollt etwas liest,
 * wird von einer eintreffenden Leo-Antwort nicht weggerissen. Genau das lässt den
 * Faden sonst „anders anfühlen" als die Vorlage.
 *
 * Drei Regeln, unverändert aus dem Prototyp übernommen:
 *
 *  1. `folgt()` — steht der Leser noch am Ende? Gemessen am zuletzt angehängten Knoten:
 *     dessen Unterkante muss im Bild sein (`<= innerHeight + 60`) und darf nicht schon
 *     oben herausgescrollt sein (`> 0`).
 *  2. `zeigeAnfang(node)` — rollt den Knoten unter den Kopf, aber **nur wenn nötig**:
 *     ist er ohnehin ganz sichtbar, passiert nichts. Große Knoten (> halbe Fensterhöhe)
 *     oder solche, die über den Kopf ragen, bekommen ein `scrollTo`; kleine, die nur
 *     knapp aus dem Bild ragen, ein sanftes `scrollIntoView({ block: "nearest" })`.
 *  3. `immer = true` überspringt beide Prüfungen — für Sprünge, die der Leser selbst
 *     ausgelöst hat (Navigation, eigene Frage). Dort merkt sich der Provider vorher
 *     die Lesestelle, damit der Rücksprung möglich bleibt.
 *
 * `prefers-reduced-motion` schaltet auf `auto` statt `smooth`, wie im Prototyp.
 */

/** Höhe des Zeitungskopfes; Fallback 64 px wie im Prototyp (`kopfH`). */
export function kopfHoehe(): number {
  if (typeof document === "undefined") return 64;
  const k = document.getElementById("kopf");
  return k ? k.offsetHeight : 64;
}

function reduziert(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Der zuletzt an den Faden angehängte Knoten. Bezugspunkt für `folgt()` — am
 * globalThis, damit Modul-Neuladen im Dev-Server den Stand nicht zurücksetzt.
 */
function stand(): { letzter: HTMLElement | null } {
  const g = globalThis as typeof globalThis & { __fadenScroll?: { letzter: HTMLElement | null } };
  if (!g.__fadenScroll) g.__fadenScroll = { letzter: null };
  return g.__fadenScroll;
}

/** Knoten als „zuletzt angehängt" merken (Prototyp: `letzterKnoten` in `anhaengen`). */
export function merkeKnoten(node: HTMLElement | null): void {
  stand().letzter = node;
}

/**
 * Steht der Leser noch am Ende des Fadens? (Prototyp: `folgt`)
 *
 * Ohne bekannten letzten Knoten gilt „ja" — dann gibt es nichts, wovon der Leser
 * weggerissen werden könnte.
 */
export function folgt(): boolean {
  const letzter = stand().letzter;
  if (!letzter || !document.contains(letzter)) return true;
  const r = letzter.getBoundingClientRect();
  return r.bottom <= window.innerHeight + 60 && r.bottom > 0;
}

/**
 * Knoten unter den Kopf rollen (Prototyp: `zeigeAnfang`).
 *
 * @param node   Ziel
 * @param immer  Prüfungen überspringen (vom Leser ausgelöster Sprung)
 */
export function zeigeAnfang(node: HTMLElement | null, immer = false): void {
  if (!node) return;
  // setTimeout(0) wie im Prototyp: erst nach dem Layout messen, sonst stimmt das Rechteck
  // bei gerade eingefügten Knoten noch nicht.
  setTimeout(() => {
    const r = node.getBoundingClientRect();
    const oben = kopfHoehe() + 12;
    const verhalten: ScrollBehavior = reduziert() ? "auto" : "smooth";
    if (!immer && r.top >= oben && r.bottom <= window.innerHeight) return;   // schon ganz im Bild
    if (immer || r.height > window.innerHeight * 0.5 || r.top < oben) {
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - oben), behavior: verhalten });
    } else {
      node.scrollIntoView({ block: "nearest", behavior: verhalten });
    }
  }, 0);
}

/**
 * Einen neu angehängten Knoten behandeln (Prototyp: `anhaengen`).
 *
 * @param opts.immer  Sprung erzwingen
 * @param opts.leise  gar nicht scrollen (Prototyp: `leise`)
 */
export function angehaengt(node: HTMLElement | null, opts: { immer?: boolean; leise?: boolean } = {}): void {
  if (!node) return;
  const darf = opts.immer || folgt();
  merkeKnoten(node);
  if (darf && !opts.leise) zeigeAnfang(node, !!opts.immer);
}

/**
 * Wie `zeigeAnfang`, aber mit einer Nachkorrektur.
 *
 * 🚨 Grund: Der Faden springt zu einem Kapitel, das noch strömt. Wächst der Inhalt
 * darüber nach dem Sprung — oder war das Dokument im Moment des Sprungs noch zu kurz,
 * sodass der Browser das Ziel auf das Seitenende gekappt hat —, steht der Kapitelanfang
 * hinterher nicht unter dem Kopf, sondern dahinter. Gemessen: 16 bis 67 px daneben.
 *
 * Deshalb einmal nachmessen, sobald sich das Layout beruhigt hat. Wer in der Zwischenzeit
 * selbst scrollt (Rad, Wischen, Tasten), behält die Kontrolle — dann wird nicht korrigiert.
 */
export function zeigeAnfangStabil(node: HTMLElement | null, immer = false, nachMs = 500): void {
  if (!node) return;
  zeigeAnfang(node, immer);
  nachmessen(node, nachMs);
}

/**
 * Unter den Kopf rollen — aber nur, wenn das Kapitel nicht ohnehin dort steht (Toleranz
 * 4 px). Für die Ankunft eines Kapitels, das an der Stelle des Skeletts erscheint: Stimmt
 * die Geometrie, passiert nichts, und es gibt keinen zweiten Sprung. Danach die
 * Nachkorrektur wie bei `zeigeAnfangStabil`.
 */
export function unterDenKopf(node: HTMLElement | null, nachMs = 500): void {
  if (!node) return;
  const ab = node.getBoundingClientRect().top - (kopfHoehe() + 12);
  if (Math.abs(ab) > 4) zeigeAnfang(node, true);
  nachmessen(node, nachMs);
}

/**
 * Etwas OBERHALB der Lesestelle ändern, ohne dass der Leser es merkt: Anker messen,
 * ändern, `scrollY` im selben Bild um die Differenz nachführen. Chrome und Firefox haben
 * dafür Scroll Anchoring — es greift nicht, wenn der Ankerknoten selbst ausgetauscht wird,
 * und Safari kennt es gar nicht. Deshalb ausdrücklich. React-Zustand darin per
 * `flushSync` ändern, sonst ist beim zweiten Messen noch nichts passiert.
 */
export function mitAusgleich(anker: HTMLElement | null, aendern: () => void): void {
  if (!anker) { aendern(); return; }
  const vor = anker.getBoundingClientRect().top;
  aendern();
  const d = anker.getBoundingClientRect().top - vor;
  if (Math.abs(d) >= 1) window.scrollBy({ top: d, behavior: "instant" });
}

/** Nachkorrektur, sobald sich das Layout beruhigt hat (siehe zeigeAnfangStabil). */
function nachmessen(node: HTMLElement, nachMs: number): void {
  const kopfVorher = kopfHoehe();
  let eingegriffen = false;
  const stop = () => { eingegriffen = true; };
  const opts: AddEventListenerOptions = { passive: true };
  window.addEventListener("wheel", stop, opts);
  window.addEventListener("touchmove", stop, opts);
  window.addEventListener("keydown", stop, opts);
  setTimeout(() => {
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchmove", stop);
    window.removeEventListener("keydown", stop);
    if (eingegriffen || !document.contains(node)) return;
    // 🚨 Nicht korrigieren, wenn sich der Kopf selbst geändert hat. Beim Wechsel in eine
    // Rubrik klappt BlattStart das Registerblatt auf — der Kopf wächst dann von 56 auf
    // über 1200 px. Das ist eine gewollte Änderung der Oberfläche, kein Nachrutschen des
    // Layouts; eine Korrektur darauf schöbe das Kapitel unter das aufgeklappte Blatt.
    // Der Prototyp misst dort ebenfalls nur einmal, vor dem Aufklappen.
    const kopfJetzt = kopfHoehe();
    if (Math.abs(kopfJetzt - kopfVorher) > 4) return;
    const ab = node.getBoundingClientRect().top - (kopfJetzt + 12);
    if (Math.abs(ab) <= 4) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + ab), behavior: reduziert() ? "auto" : "smooth" });
  }, nachMs);
}
