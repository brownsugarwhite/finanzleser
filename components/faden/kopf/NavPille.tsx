"use client";

/**
 * Nav-Pille als Lupe — 1:1-Portierung aus dem Prototyp
 * (`docs/prototype/src/03-js-core.html`, Zeilen 157–185).
 *
 * 🚨 Ersetzt bewusst `lib/hooks/useNavPill` im Faden. Der Plan sah vor, den Hook der
 * alten Seite weiterzuverwenden („Behalten (unverändert): … useNavPill"). Der macht
 * aber eine andere Choreografie: er kennt weder die gegenläufige Lupenreihe noch die
 * zwei verzögerten Linien. Die abgenommene Vorlage ist der Prototyp, deshalb steht
 * hier dessen Mechanik — Werte und Reihenfolge unverändert übernommen.
 *
 * Mechanik:
 *  - Die Pille ist ein dunkles Rechteck (32 px) mit `overflow: hidden`. Darin liegt eine
 *    **weiße Kopie der kompletten Registerzeile**, 1,1-fach vergrößert, die exakt
 *    gegenläufig mitfährt (`translate(-x)`). Dadurch wirkt die Pille wie ein
 *    Vergrößerungsglas, das über der Zeile liegt.
 *  - Darüber zwei Linien (2 px und 4 px), die der Pille 40 bzw. 80 ms verzögert folgen.
 *  - Auftritt als 10-px-Punkt aus der Mitte des Eintrags (0,15 s), Gleiten mit
 *    Überschwingen (0,4 s + Weganteil), Rückzug wieder zum Punkt (0,15 s).
 */
import { useCallback, useEffect, useRef } from "react";

const PILL_H = 32;
const BACK = "cubic-bezier(.34,1.56,.64,1)";
const OUT2 = "cubic-bezier(.25,.46,.45,.94)";
const IN3 = "cubic-bezier(.55,.055,.675,.19)";

export interface LupenPille {
  reiheRef: React.RefObject<HTMLDivElement | null>;
  pilleRef: React.RefObject<HTMLDivElement | null>;
  lupeReiheRef: React.RefObject<HTMLDivElement | null>;
  linie1Ref: React.RefObject<HTMLElement | null>;
  linie3Ref: React.RefObject<HTMLElement | null>;
  knopfRef: (i: number) => (el: HTMLButtonElement | null) => void;
  /** Hover auf einem Eintrag: Pille dorthin legen. */
  zuKnopf: (i: number) => void;
  /** Mausbewegung in der Zeile zwischen den Einträgen: nächstgelegenen wählen. */
  beiBewegung: (e: React.MouseEvent) => void;
  /** Maus verlässt die Zeile. */
  beiVerlassen: () => void;
  /** Eintrag dauerhaft markieren (Blatt offen). */
  oeffnen: (i: number) => void;
  /** Markierung aufheben. */
  schliessen: () => void;
}

export function useLupenPille(anzahl: number): LupenPille {
  const reiheRef = useRef<HTMLDivElement | null>(null);
  const pilleRef = useRef<HTMLDivElement | null>(null);
  const lupeReiheRef = useRef<HTMLDivElement | null>(null);
  const linie1Ref = useRef<HTMLElement | null>(null);
  const linie3Ref = useRef<HTMLElement | null>(null);
  const knoepfe = useRef<(HTMLButtonElement | null)[]>([]);

  const sichtbar = useRef(false);
  const aktiv = useRef<HTMLButtonElement | null>(null);
  const pilleX = useRef(0);
  const zuletzt = useRef<HTMLButtonElement | null>(null);

  const knopfRef = useCallback((i: number) => (el: HTMLButtonElement | null) => { knoepfe.current[i] = el; }, []);

  /** Position eines Knopfes relativ zur Zeile (Prototyp: `pos`). */
  const pos = (b: HTMLElement) => {
    const c = reiheRef.current!.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    return { x: r.left - c.left, w: r.width };
  };

  const trans = (elm: HTMLElement | null, d: number, e: string) => {
    if (!elm) return;
    elm.style.transition = d ? ["transform", "width", "height", "opacity"].map((p) => `${p} ${d}s ${e}`).join(", ") : "none";
  };

  /** Längerer Weg = etwas längere Dauer, gedeckelt bei +0,15 s (Prototyp: `dauer`). */
  const dauer = (x: number, basis: number) => basis + Math.min(Math.abs(x - pilleX.current) / 300, 1) * 0.15;

  /** Pille als Rechteck über einen Eintrag legen (Prototyp: `lege`). */
  const lege = useCallback((x: number, w: number, d: number, e: string) => {
    const pille = pilleRef.current, lupe = lupeReiheRef.current;
    if (!pille || !lupe) return;
    trans(pille, d, e);
    pille.style.transform = `translate(${x}px,-50%)`;
    pille.style.width = `${w}px`;
    pille.style.height = `${PILL_H}px`;
    pille.style.opacity = "1";
    lupe.style.transition = d ? `transform ${d}s ${e}` : "none";
    lupe.style.transform = `translate(${-x}px,-50%)`;
    [linie3Ref.current, linie1Ref.current].forEach((l, i) => {
      trans(l, d ? d + (i ? 0.08 : 0.04) : 0, e);
      if (!l) return;
      l.style.transform = `translate(${x}px,0)`;
      l.style.width = `${w}px`;
      l.style.opacity = "1";
    });
    pilleX.current = x;
  }, []);

  /** Pille auf einen 10-px-Punkt zusammenziehen (Prototyp: `punkt`). */
  const punkt = useCallback((cx: number, d: number, e: string, op: number) => {
    const pille = pilleRef.current, lupe = lupeReiheRef.current;
    if (!pille || !lupe) return;
    trans(pille, d, e);
    pille.style.transform = `translate(${cx - 5}px,-50%)`;
    pille.style.width = "10px";
    pille.style.height = "10px";
    pille.style.opacity = String(op);
    lupe.style.transition = d ? `transform ${d}s ${e}` : "none";
    lupe.style.transform = `translate(${-(cx - 5)}px,-50%)`;
    [linie3Ref.current, linie1Ref.current].forEach((l, i) => {
      trans(l, d, e);
      if (!l) return;
      l.style.transform = `translate(${cx - 5}px,${PILL_H / 2 + (i ? 10 : 6)}px)`;
      l.style.width = "10px";
      l.style.opacity = String(op);
    });
  }, []);

  /** Pille zu einem Knopf bewegen (Prototyp: `pilleZu`). */
  const zu = useCallback((b: HTMLButtonElement) => {
    if (!reiheRef.current) return;
    const p = pos(b);
    zuletzt.current = b;
    if (!sichtbar.current) {
      sichtbar.current = true;
      punkt(p.x + p.w / 2, 0, "linear", 1);
      pilleRef.current?.getBoundingClientRect();   // Reflow erzwingen, sonst springt der erste Auftritt
      lege(p.x, p.w, 0.15, OUT2);
      return;
    }
    lege(p.x, p.w, dauer(p.x, 0.4), BACK);
  }, [lege, punkt]);

  /** Zurück zum markierten Eintrag (Prototyp: `pilleZurueck`). */
  const zurueck = useCallback(() => {
    if (!aktiv.current || zuletzt.current === aktiv.current) return;
    const p = pos(aktiv.current);
    zuletzt.current = aktiv.current;
    lege(p.x, p.w, dauer(p.x, 0.4) + 0.2, BACK);
  }, [lege]);

  /** Pille zurückziehen (Prototyp: `pilleWeg`). */
  const weg = useCallback(() => {
    if (!sichtbar.current) return;
    if (aktiv.current) { zurueck(); return; }
    sichtbar.current = false;
    punkt(pilleX.current + (pilleRef.current?.offsetWidth ?? 0) / 2, 0.15, IN3, 0);
  }, [punkt, zurueck]);

  const zuKnopf = useCallback((i: number) => {
    const b = knoepfe.current[i];
    if (b) zu(b);
  }, [zu]);

  const oeffnen = useCallback((i: number) => {
    const b = knoepfe.current[i];
    if (!b) return;
    aktiv.current = b;
    const p = pos(b);
    if (!sichtbar.current) zu(b);
    else lege(p.x, p.w, 0.35, OUT2);
    zuletzt.current = b;
  }, [lege, zu]);

  const schliessen = useCallback(() => {
    aktiv.current = null;
    if (!reiheRef.current?.matches(":hover")) weg();
  }, [weg]);

  /** Zwischen den Einträgen: den nächstgelegenen wählen (Prototyp: `mousemove`). */
  const beiBewegung = useCallback((ev: React.MouseEvent) => {
    if (!sichtbar.current) return;
    if ((ev.target as HTMLElement).closest?.("button")) return;
    const liste = knoepfe.current.filter(Boolean) as HTMLButtonElement[];
    const n = liste.length;
    if (!n) return;
    const x = ev.clientX;
    const erst = liste[0].getBoundingClientRect(), letzt = liste[n - 1].getBoundingClientRect();
    if (x < erst.left || x > letzt.right) { if (aktiv.current) zurueck(); else weg(); return; }
    for (let i = 0; i < n; i++) {
      const r = liste[i].getBoundingClientRect();
      const ende = i < n - 1 ? (r.right + liste[i + 1].getBoundingClientRect().left) / 2 : r.right;
      if (x <= ende || i === n - 1) { if (liste[i] !== zuletzt.current) zu(liste[i]); return; }
    }
  }, [zu, weg, zurueck]);

  /**
   * Lupenreihe auf die Breite der echten Zeile bringen (Prototyp: `lupeMessen`).
   * Ohne das stimmt die Kopie in der Pille nicht mit der Zeile darunter überein.
   * Auch nach dem Laden der Schriften, weil sich die Zeile dann noch verschiebt.
   */
  useEffect(() => {
    const messen = () => {
      const reihe = reiheRef.current, lupe = lupeReiheRef.current;
      if (!reihe || !lupe) return;
      lupe.style.width = `${reihe.clientWidth}px`;
      if (sichtbar.current && zuletzt.current) { const p = pos(zuletzt.current); lege(p.x, p.w, 0, "linear"); }
    };
    messen();
    window.addEventListener("resize", messen);
    document.fonts?.ready.then(messen).catch(() => {});
    return () => window.removeEventListener("resize", messen);
  }, [anzahl, lege]);

  return { reiheRef, pilleRef, lupeReiheRef, linie1Ref, linie3Ref, knopfRef, zuKnopf, beiBewegung, beiVerlassen: weg, oeffnen, schliessen };
}
