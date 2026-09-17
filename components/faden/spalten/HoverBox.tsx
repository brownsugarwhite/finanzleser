"use client";

/**
 * Hover-Box: ein SVG-Rahmen, der sich in drei Schritten um die Karte zeichnet, auf der
 * die Maus liegt — erst die beiden senkrechten Kanten nach außen (Schritt 0), dann die
 * Waagerechten (1), dann die Ecken zurück (2). Beim Verlassen läuft alles rückwärts.
 * Innerhalb der Reihe wartet der Rahmen 250 ms, bevor er die nächste Karte zeichnet.
 * Geometrie portiert aus hoverBox() im Prototyp (docs/prototype/src/03-js-core.html:307–361).
 *
 * 🚨 Aufbau und Timing kommen aus den Hooks der Live-Seite (`lib/hooks/useListHoverBox.tsx`,
 * `useSliderHoverBox.tsx`) — beides gehört zusammen:
 *
 *   • JEDE Karte hat ihren EIGENEN Rahmen mit eigener Timeline (live: `boxes`/`tls` je
 *     Index). Nur deshalb kann der alte Rahmen zurücklaufen, WÄHREND der neue zeichnet.
 *     Der frühere Port teilte sich einen einzigen Satz Pfade für alle Karten; beim
 *     Wechsel musste er sie neu belegen, und der alte Rahmen verschwand schlagartig
 *     statt zurückzulaufen.
 *   • Pausierte GSAP-Timeline, `play(0)` beim Betreten, `reverse()` beim Verlassen,
 *     danach `onReverseComplete` → 0,15 s ausblenden → Pfade leeren. `reverse()` läuft
 *     vom tatsächlichen Stand rückwärts: halb gezeichnet heißt halb so langer Rücklauf,
 *     mit gespiegeltem Easing. Vorher lief das über die Web-Animations-API mit festen
 *     Rücklauf-Verzögerungen und einem `setTimeout`, das die Pfade mittendrin löschte.
 *
 * Sparks gibt es am Rahmen keine mehr — weder an den Trennern noch an den Außenkanten.
 * Die Reihe zeigt nur Linien; die Kanten laufen deshalb durch (siehe `lTop`/`lBot`).
 */
import { useEffect, useRef, type RefObject } from "react";
import gsap from "@/lib/gsapConfig";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

const NS = "http://www.w3.org/2000/svg";
const SPARK_D = "M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z";
const NAMEN = ["lDown", "rUp", "hTop", "hBottom", "lUp", "rDown"] as const;
type Segment = (typeof NAMEN)[number];
const SCHRITT: Record<Segment, number> = { lDown: 0, rUp: 0, hTop: 1, hBottom: 1, lUp: 2, rDown: 2 };
const OFF = 11; // Spark-Mitte → Anfang der Trennerlinie (Trenner mit Lücke)
const STEP = 0.18; // s je Zeichenschritt (Live: useListHoverBox)
const EASE = "power2.out"; // Live: useListHoverBox
const FADE = 0.15; // s Ausblenden nach dem Rücklauf (Live: finishClose)

export interface HoverBoxOptionen {
  /** Eckenradius (Prototyp: 16 für die Spalten, 14 für die Werkzeugreihe). */
  radius?: number;
  /** Abstand des Rahmens über bzw. unter dem Inhalt; ohne Angabe Trenner-Abstand minus 16. */
  oben?: number;
  unten?: number;
  /** Selektor des Inhalts in der Karte, dessen Padding der Rahmen abzieht (sonst die Karte selbst). */
  inhalt?: string;
}

export interface HoverBoxSteuerung {
  /** Rahmen zurückziehen, z. B. wenn eine Spalte aufklappt (Prototyp: reihe.hoverWeg()). */
  weg: () => void;
}

/**
 * Trenner zwischen zwei Karten: zwei Linien mit Spark in der Mitte (Prototyp trenner(),
 * 03-js-core.html:19). Mit `voll` eine durchgehende Linie ohne Spark und ohne Lücke —
 * dieselbe Höhe, damit der Hover-Rahmen unverändert daran andockt. Der Spark bleibt im
 * DOM (nur `visibility: hidden`), weil die Geometrie ihn als Anker vermisst; mit
 * `display: none` hätte er keine Maße und der Rahmen fände seine Kante nicht.
 */
export function Trenner({ voll = false }: { voll?: boolean } = {}) {
  return (
    <div className={voll ? "trenner trenner--voll" : "trenner"}>
      <svg className="spark" viewBox="0 0 12 12.0005" aria-hidden="true"><path d={SPARK_D} fill="currentColor" /></svg>
    </div>
  );
}

interface Rahmen {
  g: SVGGElement;
  seg: Record<Segment, SVGPathElement>;
  tl: gsap.core.Timeline | null;
  nachbarn: Element[];
}

export function useHoverBox(containerRef: RefObject<HTMLElement | null>, itemSelector: string, opts: HoverBoxOptionen = {}): HoverBoxSteuerung {
  const { radius = 14, oben, unten, inhalt } = opts;
  const steuerung = useRef<HoverBoxSteuerung>({ weg: () => {} });

  useEffect(() => {
    const reihe = containerRef.current;
    const st = steuerung.current;
    if (!reihe || !window.matchMedia("(hover: hover)").matches) return;
    const reduziert = reduzierteBewegung();
    const dauer = reduziert ? 0 : STEP;
    const R = radius;

    /** Abstand Spark-Mitte → Ende der Trennerlinie. Beim vollen Trenner ist das die halbe
     *  Linie (sie läuft durch), sonst die Lücke plus die Länge einer der beiden Linien. */
    const reichweite = (t: Element) => {
      const h = parseFloat(getComputedStyle(t, "::before").height);
      const hh = isNaN(h) ? 70 : h;
      return t.classList.contains("trenner--voll") ? hh / 2 : OFF + hh;
    };

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "hbox"); svg.setAttribute("aria-hidden", "true");
    reihe.insertBefore(svg, reihe.firstChild);

    // Ein Rahmen je Karte (Live: boxes/tls je Index) — sonst kann der alte nicht
    // zurücklaufen, während der neue zeichnet.
    const rahmen = new Map<Element, Rahmen>();
    const rahmenFuer = (card: Element): Rahmen => {
      const da = rahmen.get(card);
      if (da) return da;
      const g = document.createElementNS(NS, "g");
      const seg = {} as Record<Segment, SVGPathElement>;
      NAMEN.forEach((n) => { const p = document.createElementNS(NS, "path"); p.setAttribute("class", "seg"); seg[n] = p; g.appendChild(p); });
      svg.appendChild(g);
      const neu: Rahmen = { g, seg, tl: null, nachbarn: [] };
      rahmen.set(card, neu);
      return neu;
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    let inReihe = false;
    let aktiv: Element | null = null;
    let unterMaus: Element | null = null;
    const dreher = new Set<Element>();

    /** Drehende Sparks aus ALLEN lebenden Rahmen zusammenrechnen (Live: syncSpins).
     *  Zwei benachbarte Karten teilen sich einen Trenner — ohne das würde der
     *  zurücklaufende Rahmen den Spark abschalten, den der neue noch braucht. */
    function syncDreht() {
      const wollen = new Set<Element>();
      rahmen.forEach((r) => { if (r.tl) r.nachbarn.forEach((sp) => wollen.add(sp)); });
      wollen.forEach((sp) => { sp.classList.add("dreht"); dreher.add(sp); });
      dreher.forEach((sp) => { if (!wollen.has(sp)) { sp.classList.remove("dreht"); dreher.delete(sp); } });
    }

    const mitte = (node: Element, rr: DOMRect) => { const r = node.getBoundingClientRect(); return { x: r.left + r.width / 2 - rr.left, y: r.top + r.height / 2 - rr.top }; };

    function geometrie(card: Element) {
      const rr = reihe!.getBoundingClientRect();
      const inh = inhalt ? (card.querySelector(inhalt) || card) : card;
      const cr0 = inh.getBoundingClientRect(); const cs = getComputedStyle(inh);
      const cr = { left: cr0.left + parseFloat(cs.paddingLeft), right: cr0.right - parseFloat(cs.paddingRight), top: cr0.top + parseFloat(cs.paddingTop), bottom: cr0.bottom - parseFloat(cs.paddingBottom) };
      const prev = card.previousElementSibling, next = card.nextElementSibling;
      const lt = prev && prev.classList.contains("trenner") ? prev : null, rt = next && next.classList.contains("trenner") ? next : null;
      const lsp = lt ? lt.querySelector(".spark") : null, rsp = rt ? rt.querySelector(".spark") : null;
      const ls = lsp ? mitte(lsp, rr) : null, rs = rsp ? mitte(rsp, rr) : null;
      const cl = cr.left - rr.left, cre = cr.right - rr.left, ct = cr.top - rr.top, cb = cr.bottom - rr.top;
      const pad = ls ? (cl - ls.x) : rs ? (rs.x - cre) : 24;
      let L = ls ? ls.x : cl - pad, Rx = rs ? rs.x : cre + pad; const sy = ls ? ls.y : rs ? rs.y : (ct + cb) / 2;
      const ob = oben != null ? oben : pad - 16, un = unten != null ? unten : pad - 16;
      const T = Math.round(ct - ob) + 0.5, B = Math.round(cb + un) + 0.5; L = Math.round(L - 0.5) + 0.5; Rx = Math.round(Rx - 0.5) + 0.5;
      const r = Math.max(4, Math.min(R, (B - T) / 3, (Rx - L) / 3));
      const LL = lt ? reichweite(lt) : 0, LR = rt ? reichweite(rt) : 0;
      // Ohne Trenner läuft die Kante durch: lTop === lBot === sy, die beiden Bögen
      // stoßen aneinander. (Früher klaffte hier eine Lücke für einen eigenen Spark.)
      const lTop = ls ? Math.max(T + r, sy - LL) : sy, lBot = ls ? Math.min(B - r, sy + LL) : sy;
      const rTop = rs ? Math.max(T + r, sy - LR) : sy, rBot = rs ? Math.min(B - r, sy + LR) : sy;
      return { L, R: Rx, T, B, r, sy, lTop, lBot, rTop, rBot, nachbarn: [lsp, rsp].filter((s): s is Element => !!s) };
    }
    function pfade(g: ReturnType<typeof geometrie>): Record<Segment, string> {
      const { L, R: Rx, T, B, r } = g;
      return {
        lDown: `M${L} ${g.lBot} L${L} ${B - r} A${r} ${r} 0 0 0 ${L + r} ${B}`,
        rUp: `M${Rx} ${g.rTop} L${Rx} ${T + r} A${r} ${r} 0 0 0 ${Rx - r} ${T}`,
        hTop: `M${Rx - r} ${T} L${L + r} ${T}`,
        hBottom: `M${L + r} ${B} L${Rx - r} ${B}`,
        lUp: `M${L + r} ${T} A${r} ${r} 0 0 0 ${L} ${T + r} L${L} ${g.lTop}`,
        rDown: `M${Rx - r} ${B} A${r} ${r} 0 0 0 ${Rx} ${B - r} L${Rx} ${g.rBot}`,
      };
    }

    /** Nach vollendetem Rücklauf: ausblenden, dann Pfade leeren (Live: finishClose). */
    function schliessen(card: Element) {
      const r = rahmen.get(card);
      if (!r) return;
      gsap.to(r.g, {
        opacity: 0, duration: reduziert ? 0 : FADE, ease: "power1.out",
        onComplete: () => {
          if (aktiv === card) return; // in der Zwischenzeit wieder betreten
          NAMEN.forEach((n) => r.seg[n].removeAttribute("d"));
          r.tl?.kill(); r.tl = null; r.nachbarn = [];
          syncDreht();
          gsap.set(r.g, { opacity: 1 });
        },
      });
    }

    function zeichne(card: Element) {
      if (reihe!.classList.contains("offen")) return;
      aktiv = card;
      const r = rahmenFuer(card);
      gsap.killTweensOf(r.g);
      gsap.set(r.g, { opacity: 1 });

      // Derselbe Rahmen lebt noch (zeichnet oder läuft zurück) → vorwärts weiterlaufen
      // statt neu aufzusetzen (Live: `existing.play()`).
      if (r.tl) { r.tl.play(); return; }

      const g = geometrie(card); const d = pfade(g);
      const tl = gsap.timeline({ paused: true, onReverseComplete: () => schliessen(card) });
      NAMEN.forEach((n) => {
        const p = r.seg[n]; p.setAttribute("d", d[n]);
        const len = p.getTotalLength() || 1;
        p.style.strokeDasharray = String(len);
        gsap.set(p, { strokeDashoffset: len });
        tl.to(p, { strokeDashoffset: 0, duration: dauer, ease: EASE }, SCHRITT[n] * dauer);
      });
      r.tl = tl; r.nachbarn = g.nachbarn;
      syncDreht();
      tl.play(0);
    }

    function weg() {
      if (!aktiv) return;
      const card = aktiv; aktiv = null;
      const r = rahmen.get(card);
      if (!r) return;
      // Bei reduzierter Bewegung hat die Timeline Dauer 0 — `reverse()` stünde schon am
      // Anfang und `onReverseComplete` käme nie. Dann direkt schließen.
      if (r.tl && !reduziert) r.tl.reverse(); else schliessen(card);
    }

    // Ereignisse delegiert am Container: gleiche Choreografie wie mouseenter/mouseleave je Karte.
    const karteVon = (t: EventTarget | null) => { const el = t instanceof Element ? t.closest(itemSelector) : null; return el && reihe!.contains(el) ? el : null; };
    const betreten = (card: Element) => { if (timer) clearTimeout(timer); const delay = inReihe ? 250 : 0; inReihe = true; if (!delay) { zeichne(card); return; } timer = setTimeout(() => zeichne(card), delay); };
    const verlassen = () => { if (timer) clearTimeout(timer); weg(); };
    const onOver = (ev: MouseEvent) => { const card = karteVon(ev.target); if (card === unterMaus) return; if (unterMaus) verlassen(); unterMaus = card; if (card) betreten(card); };
    const onOut = (ev: MouseEvent) => { if (!unterMaus) return; const zu = ev.relatedTarget; if (zu instanceof Node && unterMaus.contains(zu)) return; unterMaus = null; verlassen(); };
    const onLeave = () => { inReihe = false; if (timer) clearTimeout(timer); };
    reihe.addEventListener("mouseover", onOver);
    reihe.addEventListener("mouseout", onOut);
    reihe.addEventListener("mouseleave", onLeave);
    st.weg = () => { if (timer) clearTimeout(timer); unterMaus = null; weg(); };

    return () => {
      reihe.removeEventListener("mouseover", onOver);
      reihe.removeEventListener("mouseout", onOut);
      reihe.removeEventListener("mouseleave", onLeave);
      st.weg = () => {};
      if (timer) clearTimeout(timer);
      rahmen.forEach((r) => { gsap.killTweensOf(r.g); r.tl?.kill(); });
      rahmen.clear();
      dreher.forEach((sp) => sp.classList.remove("dreht")); dreher.clear();
      aktiv = null;
      svg.remove();
    };
  }, [containerRef, itemSelector, radius, oben, unten, inhalt]);

  return steuerung.current;
}
