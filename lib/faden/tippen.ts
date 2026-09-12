/**
 * Die Schreibmaschine des Prototyps (`tippen`, docs/prototype/src/03-js-core.html):
 * fünf Zeichen je 10 ms. Leo schreibt seine Antwort, sie steht nicht plötzlich da.
 *
 * Zwei Ausführungen, weil zwei Fälle:
 *   tippen()     — das Ziel enthält am Ende HTML (Links, Auszeichnungen). Während des
 *                  Laufs steht nur Text da, zum Schluss wird das echte HTML gesetzt.
 *   tippenText() — reiner Text in EIN Element. Nur so bleibt der Rest des Blocks
 *                  (Leos Kopf, die Quellen) stehen; `innerHTML` würde ihn wegräumen.
 *                  Nimmt `aufTakt` — damit läuft der Blick mit (siehe mitlaufen()).
 *
 * `prefers-reduced-motion` setzt in beiden Fällen sofort den vollen Inhalt.
 */
import { reduzierteBewegung } from "./belohnung";

const SCHRITT = 5;   // Zeichen je Takt
const TAKT = 10;     // ms

function lauf(voll: string, schreiben: (s: string) => void, fertig: () => void, aufTakt?: () => void): void {
  let i = 0;
  const takt = () => {
    i += SCHRITT;
    schreiben(voll.slice(0, i));
    aufTakt?.();
    if (i < voll.length) setTimeout(takt, TAKT);
    else fertig();
  };
  takt();
}

/**
 * Mitlaufen wie in einem echten Chat: Solange geschrieben wird, bleibt das Ende der
 * Antwort im Bild.
 *
 * 🚨 `behavior: "smooth"` wäre hier falsch. Jeder Takt startete eine neue weiche
 * Bewegung, die die vorige abbricht — das ruckelt. Der Text wächst schon in kleinen
 * Schritten; ein hartes `scrollBy` um genau die Differenz ist deshalb die glatte
 * Variante. Nur nachziehen, wenn das Ende wirklich unter den Rand rutscht.
 */
export function mitlaufen(ziel: HTMLElement, luft?: number): () => void {
  return () => {
    const unten = ziel.getBoundingClientRect().bottom;
    // Die Eingabe klebt fest am unteren Rand — darunter ist nichts zu lesen. Deshalb
    // hält der Blick ihre Höhe (--eingabe-h, aus Eingabe.tsx) plus etwas Luft frei.
    const grenze = window.innerHeight - (luft ?? luftUnten());
    if (unten > grenze) window.scrollBy(0, unten - grenze);
  };
}

/** Höhe der festen Eingabe plus Abstand — so viel bleibt unter dem Text frei. */
export function luftUnten(): number {
  const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--eingabe-h")) || 120;
  return h + 24;
}

export function tippen(ziel: HTMLElement, html: string): Promise<void> {
  if (reduzierteBewegung()) { ziel.innerHTML = html; return Promise.resolve(); }
  const mess = document.createElement("div");
  mess.innerHTML = html;
  const voll = mess.innerText;
  const p = document.createElement("p");
  ziel.replaceChildren(p);
  return new Promise((fertig) => {
    lauf(voll, (s) => { p.textContent = s; }, () => { ziel.innerHTML = html; fertig(); });
  });
}

export function tippenText(ziel: HTMLElement, text: string, aufTakt?: () => void): Promise<void> {
  if (reduzierteBewegung()) { ziel.textContent = text; return Promise.resolve(); }
  ziel.textContent = "";
  return new Promise((fertig) => {
    lauf(text, (s) => { ziel.textContent = s; }, () => fertig(), aufTakt);
  });
}
