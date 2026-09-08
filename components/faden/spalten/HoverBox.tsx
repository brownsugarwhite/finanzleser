"use client";

/**
 * Hover-Box: ein SVG-Rahmen, der sich in drei Schritten um die Karte zeichnet, auf der
 * die Maus liegt — erst die beiden Kanten an den Trennern nach außen (Schritt 0), dann
 * die Waagerechten (1), dann die Ecken zurück zu den Trennerlinien (2). Die Sparks der
 * benachbarten Trenner drehen mit; wo kein Trenner ist, bekommt der Rahmen einen eigenen
 * Spark. Beim Verlassen läuft alles rückwärts. Innerhalb der Reihe wartet der Rahmen
 * 250 ms, bevor er die nächste Karte zeichnet. Port von hoverBox() aus dem Prototyp
 * (docs/prototype/src/03-js-core.html:307–361); Maße, Timing und Easing 1:1.
 *
 * Abweichung: die Maus-Ereignisse hängen delegiert am Container (mouseover/mouseout
 * statt mouseenter/mouseleave je Karte), damit React die Karten neu rendern darf.
 * Nach dem Zurückziehen werden die Pfade geleert, damit kein unsichtbarer Rest bleibt.
 */
import { useEffect, useRef, type RefObject } from "react";
import { reduzierteBewegung } from "@/lib/faden/belohnung";

const NS = "http://www.w3.org/2000/svg";
const SPARK_D = "M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z";
const NAMEN = ["lDown", "rUp", "hTop", "hBottom", "lUp", "rDown"] as const;
type Segment = (typeof NAMEN)[number];
const SCHRITT: Record<Segment, number> = { lDown: 0, rUp: 0, hTop: 1, hBottom: 1, lUp: 2, rDown: 2 };
const OFF = 11; // Spark-Mitte → Anfang der Trennerlinie
const GAP = 11; // Lücke um den eigenen Spark (Karte ohne Trenner)
const STEP = 180; // ms je Zeichenschritt
const EASE = "cubic-bezier(.25,.46,.45,.94)";

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

/** Trenner zwischen zwei Karten: zwei Linien mit Spark in der Mitte (Prototyp trenner(), 03-js-core.html:19). */
export function Trenner() {
  return (
    <div className="trenner">
      <svg className="spark" viewBox="0 0 12 12.0005" aria-hidden="true"><path d={SPARK_D} fill="currentColor" /></svg>
    </div>
  );
}

export function useHoverBox(containerRef: RefObject<HTMLElement | null>, itemSelector: string, opts: HoverBoxOptionen = {}): HoverBoxSteuerung {
  const { radius = 14, oben, unten, inhalt } = opts;
  const steuerung = useRef<HoverBoxSteuerung>({ weg: () => {} });

  useEffect(() => {
    const reihe = containerRef.current;
    const st = steuerung.current;
    if (!reihe || !window.matchMedia("(hover: hover)").matches) return;
    const reduziert = reduzierteBewegung();
    const R = radius;

    const linienLaenge = (t: Element) => { const h = parseFloat(getComputedStyle(t, "::before").height); return isNaN(h) ? 70 : h; };
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "hbox"); svg.setAttribute("aria-hidden", "true");
    reihe.insertBefore(svg, reihe.firstChild);
    const seg = {} as Record<Segment, SVGPathElement>;
    NAMEN.forEach((n) => { const p = document.createElementNS(NS, "path"); p.setAttribute("class", "seg"); seg[n] = p; svg.appendChild(p); });
    const eigen = {} as Record<"l" | "r", { g: SVGGElement; p: SVGPathElement }>;
    (["l", "r"] as const).forEach((k) => { const g = document.createElementNS(NS, "g"); const p = document.createElementNS(NS, "path"); p.setAttribute("d", SPARK_D); p.setAttribute("class", "hspark"); g.appendChild(p); svg.appendChild(g); eigen[k] = { g, p }; });

    let anims: Animation[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let aufraeumer: ReturnType<typeof setTimeout> | undefined;
    let inReihe = false;
    let aktiv: Element | null = null;
    let nachbarn: Element[] = [];
    let unterMaus: Element | null = null;

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
      const LL = lt ? linienLaenge(lt) : 70, LR = rt ? linienLaenge(rt) : 70;
      const lTop = ls ? Math.max(T + r, sy - OFF - LL) : sy - GAP, lBot = ls ? Math.min(B - r, sy + OFF + LL) : sy + GAP;
      const rTop = rs ? Math.max(T + r, sy - OFF - LR) : sy - GAP, rBot = rs ? Math.min(B - r, sy + OFF + LR) : sy + GAP;
      return { L, R: Rx, T, B, r, sy, ls: !!ls, rs: !!rs, lTop, lBot, rTop, rBot, nachbarn: [lsp, rsp].filter((s): s is Element => !!s) };
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
    const stopp = () => { anims.forEach((a) => { try { a.cancel(); } catch { /* schon beendet */ } }); anims = []; };
    function zeichne(card: Element) {
      if (reihe!.classList.contains("offen")) return;
      stopp(); if (aufraeumer) clearTimeout(aufraeumer);
      const g = geometrie(card); const d = pfade(g); aktiv = card;
      NAMEN.forEach((n) => {
        const p = seg[n]; p.setAttribute("d", d[n]); const len = p.getTotalLength() || 1;
        p.style.strokeDasharray = String(len); p.style.strokeDashoffset = String(len);
        anims.push(p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: reduziert ? 0 : STEP, delay: reduziert ? 0 : SCHRITT[n] * STEP, easing: EASE, fill: "forwards" }));
      });
      nachbarn = g.nachbarn; nachbarn.forEach((sp) => sp.classList.add("dreht"));
      ([["l", g.L, !g.ls], ["r", g.R, !g.rs]] as const).forEach(([k, x, eigener]) => {
        const e = eigen[k]; e.g.setAttribute("transform", `translate(${x - 6},${g.sy - 6})`);
        e.p.style.opacity = eigener ? "1" : "0"; e.p.classList.toggle("dreht", eigener);
      });
    }
    function weg() {
      if (!aktiv) return; aktiv = null; const laufend = anims; anims = [];
      NAMEN.forEach((n) => {
        const p = seg[n]; const len = parseFloat(p.style.strokeDasharray) || 0; const jetzt = parseFloat(getComputedStyle(p).strokeDashoffset) || 0;
        laufend.forEach((a) => { try { if ((a.effect as KeyframeEffect | null)?.target === p) a.cancel(); } catch { /* schon beendet */ } });
        p.style.strokeDashoffset = String(jetzt);
        anims.push(p.animate([{ strokeDashoffset: jetzt }, { strokeDashoffset: len }], { duration: reduziert ? 0 : STEP, delay: reduziert ? 0 : (2 - SCHRITT[n]) * STEP, easing: EASE, fill: "forwards" }));
      });
      nachbarn.forEach((sp) => sp.classList.remove("dreht")); nachbarn = [];
      aufraeumer = setTimeout(() => {
        if (aktiv) return;
        (["l", "r"] as const).forEach((k) => { eigen[k].p.style.opacity = "0"; eigen[k].p.classList.remove("dreht"); });
        NAMEN.forEach((n) => seg[n].removeAttribute("d"));
      }, reduziert ? 0 : STEP * 3);
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
      if (timer) clearTimeout(timer); if (aufraeumer) clearTimeout(aufraeumer);
      stopp(); nachbarn.forEach((sp) => sp.classList.remove("dreht")); nachbarn = []; aktiv = null;
      svg.remove();
    };
  }, [containerRef, itemSelector, radius, oben, unten, inhalt]);

  return steuerung.current;
}
