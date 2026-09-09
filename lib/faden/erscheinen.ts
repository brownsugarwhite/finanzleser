"use client";

/**
 * Erscheinen: Inhalte tauchen beim Scrollen auf, statt einfach dazustehen.
 *
 * Ein Element bekommt `data-erscheint="herz|gleiten|stufen|kopf"` und ist bis zu seinem
 * Auftritt unsichtbar. Kommt es ins Bild, setzt dieses Modul die Klasse `ist-da` — den
 * Rest macht CSS (app/zeitung.css).
 *
 * Vier Dinge stehen hier bewusst anders als im Design-Prototyp, alle aus demselben
 * Grund: **im Faden wandert Markup durch den Schnappschuss**. Ein gelesenes Kapitel wird
 * eingefroren (`greifen()` = roher `innerHTML`-Lesezugriff), liegt als Zeichenkette in
 * `sessionStorage` und kommt beim Aufklappen zurück ins Dokument. Alles, was zum
 * Zeitpunkt des Einfrierens am Element klebte, kommt mit.
 *
 *  1. **Die Bearbeitungsmarke liegt in einer `WeakSet`, nicht als Attribut.** Der
 *     Prototyp setzt `data-beob="1"`. Das landete im Schnappschuss — ein Abschnitt, der
 *     vor dem Einfrieren nie sichtbar wurde, käme mit der Marke zurück, würde deshalb
 *     nie beobachtet und bliebe **dauerhaft auf `opacity: 0`**. Eine WeakSet kennt nur
 *     die Knoten dieser Sitzung; das wieder eingehängte HTML sind andere Knoten.
 *
 *  2. **Der Fertig-Zustand ist eine Klasse.** Die DARF mitwandern: schon gesehen bleibt
 *     gesehen. Nur was der Leser noch nie im Bild hatte, tritt beim Aufklappen neu auf.
 *
 *  3. **Animiert wird über CSS, nicht über `el.style.animation`.** Inline-Styles wandern
 *     sonst mit in den Schnappschuss und frieren dort eine Animation ein, die längst
 *     gelaufen ist.
 *
 *  4. **Die Attribute heißen `data-erscheint` und `data-zaehler`** — `data-zahl` und
 *     `data-stueck` sind vergeben: components/statistik/StatistikKarte.tsx greift beide
 *     und lässt GSAP `textContent` darauf schreiben. Zwei Zählwerke auf einem Knoten
 *     ergeben flackernde Zahlen.
 */
import { useEffect } from "react";
import { reduzierteBewegung } from "./belohnung";

/** Auftrittsart. `stufen` staffelt die Kinder, `kopf` zieht Linien und Spark mit hoch. */
export type Erscheinung = "herz" | "gleiten" | "stufen" | "kopf";

const MARKE = new WeakSet<Element>();
let io: IntersectionObserver | null = null;
let mo: MutationObserver | null = null;
let nutzer = 0;
let geplant = 0;

/** Zahl im Format der Seite: deutsche Trennzeichen, feste Nachkommastellen, Einheit dahinter. */
function zahlFormat(wert: number, nachkomma: number, einheit: string): string {
  const z = wert.toLocaleString("de-DE", { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma });
  return einheit ? `${z} ${einheit}` : z;
}

/** Zählwerk: von 0 auf den Zielwert, ease-out, ~1,3 s. */
function zaehlen(el: HTMLElement): void {
  const ziel = Number(el.dataset.zaehler);
  if (!Number.isFinite(ziel)) return;
  const nachkomma = Number(el.dataset.nachkomma) || 0;
  const einheit = el.dataset.einheit || "";
  // Im verborgenen Tab läuft kein Bildtakt — das Zählwerk bliebe auf „0" stehen und
  // zeigte eine falsche Zahl, sobald der Leser zurückkommt. Dann lieber gleich das
  // Ergebnis: die Bewegung hätte ohnehin niemand gesehen.
  if (document.visibilityState === "hidden") { el.textContent = zahlFormat(ziel, nachkomma, einheit); return; }
  const dauer = 1300 * tempo();
  const start = performance.now();
  const schritt = (jetzt: number) => {
    const t = Math.min(1, (jetzt - start) / dauer);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = zahlFormat(ziel * e, nachkomma, einheit);
    if (t < 1) requestAnimationFrame(schritt);
    else el.textContent = zahlFormat(ziel, nachkomma, einheit);
  };
  requestAnimationFrame(schritt);
}

/** Tempo aus `--tempo` an der Hülle (ruhig 1.35 · normal 1 · lebhaft .65). */
function tempo(): number {
  if (typeof document === "undefined") return 1;
  const shell = document.querySelector<HTMLElement>(".faden-shell");
  const roh = shell && getComputedStyle(shell).getPropertyValue("--tempo").trim();
  const n = roh ? Number(roh) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Auftritt auslösen. Die Staffelungs-Indizes werden als `--i` gesetzt, weil CSS keinen
 * Geschwisterzähler kennt; ein Index ist stabil und darf mit in den Schnappschuss.
 */
function zeigen(el: HTMLElement): void {
  if (el.dataset.erscheint === "stufen") {
    Array.from(el.children).forEach((kind, i) => (kind as HTMLElement).style.setProperty("--i", String(i)));
  }
  el.querySelectorAll<HTMLElement>("[data-zeichnen]").forEach((p, i) => p.style.setProperty("--i", String(i)));
  el.classList.add("ist-da");
  el.querySelectorAll<HTMLElement>("[data-zaehler]").forEach(zaehlen);
  // Diagramme starten ihre eigenen Übergänge, sobald der Rahmen steht — nicht schon
  // beim Aufdecken, sonst laufen Balken und Text gegeneinander.
  const an = el.matches("[data-an]") ? [el] : [];
  el.querySelectorAll<HTMLElement>("[data-an]").forEach((n) => an.push(n));
  if (an.length) setTimeout(() => an.forEach((n) => n.classList.add("ist-an")), 250 * tempo());
}

/** Ohne Auftritt sofort sichtbar — für reduzierte Bewegung, Druck und Tests. */
export function sofort(wurzel: ParentNode | null): void {
  if (!wurzel) return;
  wurzel.querySelectorAll<HTMLElement>("[data-erscheint]:not(.ist-da)").forEach((el) => el.classList.add("ist-da"));
  wurzel.querySelectorAll<HTMLElement>("[data-an]:not(.ist-an)").forEach((el) => el.classList.add("ist-an"));
  wurzel.querySelectorAll<HTMLElement>("[data-zaehler]").forEach((el) => {
    const ziel = Number(el.dataset.zaehler);
    if (Number.isFinite(ziel)) el.textContent = zahlFormat(ziel, Number(el.dataset.nachkomma) || 0, el.dataset.einheit || "");
  });
}

/**
 * Alles unterhalb der Wurzel anmelden. Mehrfach aufrufbar — schon Bekanntes wird
 * übersprungen, und was bereits `ist-da` trägt (aus einem Schnappschuss), bleibt es.
 */
export function beobachte(wurzel: ParentNode | null): void {
  if (!wurzel || typeof window === "undefined") return;
  if (reduzierteBewegung() || !("IntersectionObserver" in window)) { sofort(wurzel); return; }
  if (!io) {
    io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        io!.unobserve(e.target);
        zeigen(e.target as HTMLElement);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  }
  wurzel.querySelectorAll<HTMLElement>("[data-erscheint]").forEach((el) => {
    if (MARKE.has(el)) return;
    MARKE.add(el);
    if (el.classList.contains("ist-da")) return; // aus dem Schnappschuss: schon gesehen
    io!.observe(el);
  });
}

/**
 * Neuanmeldungen bündeln.
 *
 * 🚨 Bewusst `setTimeout`, nicht `requestAnimationFrame` — anders als sonst im Faden
 * (lib/faden/useAbschnittAktiv.ts, components/faden/Fortschritt.tsx). In einem
 * verborgenen Tab feuert rAF gar nicht. Die Sperre unten bliebe dann gesetzt und
 * SCHLUCKTE jede weitere Mutation; Inhalte, die im Hintergrund nachströmen, blieben
 * unangemeldet und damit auf `opacity: 0` stehen. Nachgemessen: `visibilityState
 * "hidden"` → kein einziger Frame in 1,8 s, `geplant` blieb hängen.
 *
 * Der Bildtakt bringt hier auch nichts: `beobachte()` liest nur und meldet an, es wird
 * nichts gezeichnet und nichts gemessen.
 */
function anstossen(): void {
  if (geplant) return;
  geplant = window.setTimeout(() => { geplant = 0; beobachte(document.getElementById("strom")); }, 0);
}

/**
 * React-Anbindung.
 *
 * Ohne Argumente hängt sich der Hook an `#strom` und meldet Nachwuchs selbst an — das
 * deckt drei Einbauwege in einem: serverseitig gerenderte Kapitel, per `innerHTML`
 * eingehängte Schnappschüsse und die per Portal nachgereichten Insel-Körper.
 *
 * 🚨 Der MutationObserver braucht `subtree: true`. Die Werkzeuge kommen über
 * `next/dynamic` asynchron und tief im Baum an (components/faden/kette/InselnBeleben.tsx);
 * ohne `subtree` sähe der Beobachter sie nie.
 *
 * Mit `wurzel` und `stand` meldet der Hook zusätzlich gezielt einen Teilbaum an, sobald
 * dessen Inhalt wechselt — dafür ist `stand` da, nicht als Schlüssel, sondern als Anlass.
 */
export function useErscheinen(wurzel?: HTMLElement | null, stand?: string): void {
  useEffect(() => {
    nutzer += 1;
    if (nutzer === 1) {
      const strom = document.getElementById("strom");
      if (strom) {
        mo = new MutationObserver(anstossen);
        mo.observe(strom, { childList: true, subtree: true });
      }
      beobachte(strom);
    }
    return () => {
      nutzer -= 1;
      if (nutzer) return;
      mo?.disconnect(); mo = null;
      io?.disconnect(); io = null;
      if (geplant) { clearTimeout(geplant); geplant = 0; }
    };
  }, []);

  useEffect(() => {
    if (wurzel) beobachte(wurzel);
  }, [wurzel, stand]);
}
