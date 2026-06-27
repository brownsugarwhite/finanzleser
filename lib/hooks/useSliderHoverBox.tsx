'use client';

import { useCallback, useEffect, useRef } from 'react';
import gsap from '@/lib/gsapConfig';
import type { HoverBoxEls } from '@/components/ui/SliderHoverBox';

/* ── Geometrie / Timing ─────────────────────────────
   Die echten 70px-Linien + der echte Spark BLEIBEN stehen (Deko wird beim Hover
   NICHT ausgeblendet, nur auf voll gezogen). Der echte Spark rotiert (CSS, endlos
   — Rotation kollidiert bei geteilter Deko nicht). Der Klon zeichnet NUR die
   Verlängerung vom 70px-Ende zur Ecke (Schritt 1) bzw. schließt die Lücke
   Ecke→70px-Linie (Schritt 3), plus die zwei Horizontalen. Nur an der ersten/
   letzten Card (keine echte Deko) zeichnet der Klon eine volle Kante + Spark. */
const REST_LEN = 70;
const LINE_OFF = 11;              // Spark-Mitte → Linienanfang
const REAL_TIP = LINE_OFF + REST_LEN; // Spark-Mitte → Ende der echten 70px-Linie
const SPARK_GAP = 11;             // Lücke um den Spark (Rand-Klon-Kante)
const TOP_LESS = 20;             // oben weniger Padding als horizontal
const BOT_LESS = 15;             // unten weniger Padding als horizontal
const DEFAULT_PAD = 24;
const STEP = 0.18;
const EASE = 'power2.out';
const SPIN_DUR = 4;

interface UseSliderHoverBoxOptions {
  cardSelector: string;
  enabled: boolean;
  onBoxClosed?: (index: number) => void;
}

export function useSliderHoverBox({ cardSelector, enabled, onBoxClosed }: UseSliderHoverBoxOptions) {
  const boxes = useRef<Map<number, HoverBoxEls>>(new Map());
  const cards = useRef<Map<number, HTMLElement>>(new Map());
  const sparks = useRef<Map<number, SVGSVGElement>>(new Map());
  const tls = useRef<Map<number, gsap.core.Timeline>>(new Map());
  const ovSpins = useRef<Map<number, gsap.core.Tween[]>>(new Map());
  const spinning = useRef<Set<SVGSVGElement>>(new Set());
  const active = useRef<Set<number>>(new Set());

  const onBoxClosedRef = useRef(onBoxClosed);
  onBoxClosedRef.current = onBoxClosed;

  const registerBox = useCallback((i: number, els: HoverBoxEls | null) => {
    if (els) boxes.current.set(i, els); else boxes.current.delete(i);
  }, []);
  const registerCard = useCallback((i: number, el: HTMLElement | null) => {
    if (el) cards.current.set(i, el); else cards.current.delete(i);
  }, []);
  const registerSpark = useCallback((g: number, el: SVGSVGElement | null) => {
    if (el) sparks.current.set(g, el); else sparks.current.delete(g);
  }, []);

  /* ── Echte Sparks: Endlos-CSS-Rotation, refcount-frei aus active-Set ── */
  const setSpin = useCallback((el: SVGSVGElement, on: boolean) => {
    if (on) {
      if (spinning.current.has(el)) return;
      el.style.animation = `fl-spark-spin ${SPIN_DUR}s linear infinite`;
      spinning.current.add(el);
    } else {
      if (!spinning.current.has(el)) return;
      el.style.animation = '';
      el.style.transform = '';
      spinning.current.delete(el);
    }
  }, []);
  const syncSpins = useCallback(() => {
    const want = new Set<SVGSVGElement>();
    active.current.forEach((i) => {
      const l = sparks.current.get(i - 1); const r = sparks.current.get(i);
      if (l) want.add(l); if (r) want.add(r);
    });
    want.forEach((el) => setSpin(el, true));
    spinning.current.forEach((el) => { if (!want.has(el)) setSpin(el, false); });
  }, [setSpin]);

  const killOvSpins = useCallback((i: number) => {
    ovSpins.current.get(i)?.forEach((t) => t.kill());
    ovSpins.current.delete(i);
  }, []);

  // Box vollständig zu: Deko zurück-faden lassen, Overlay ausblenden, Spin stoppen.
  const finishClose = useCallback((index: number) => {
    const els = boxes.current.get(index);
    onBoxClosedRef.current?.(index);
    const done = () => { killOvSpins(index); active.current.delete(index); syncSpins(); };
    if (els) gsap.to(els.root, { opacity: 0, duration: 0.15, ease: 'power1.out', onComplete: done });
    else done();
  }, [killOvSpins, syncSpins]);

  const onEnter = useCallback((index: number) => {
    if (!enabled) return;
    const els = boxes.current.get(index);
    const card = cards.current.get(index);
    if (!els || !card) return;
    active.current.add(index);
    syncSpins();

    const existing = tls.current.get(index);
    if (existing && (gsap.getProperty(els.root, 'opacity') as number) > 0) {
      existing.play();
      return;
    }
    existing?.kill();
    killOvSpins(index);

    // ── Messung ──
    const rootRect = els.root.getBoundingClientRect();
    const overlayW = rootRect.width;
    if (overlayW <= 0) return;
    const content = (card.querySelector(cardSelector) as HTMLElement | null) ?? card;
    const cardW = content.offsetWidth;
    const cardH = content.offsetHeight;
    if (cardW <= 0 || cardH <= 0) return;

    const cx = overlayW / 2;
    const cardLeft = cx - cardW / 2;
    const cardRight = cx + cardW / 2;
    const center = (el: SVGSVGElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - rootRect.left, y: r.top + r.height / 2 - rootRect.top };
    };
    const leftSpark = sparks.current.get(index - 1);
    const rightSpark = sparks.current.get(index);
    const ls = leftSpark ? center(leftSpark) : null;
    const rs = rightSpark ? center(rightSpark) : null;

    const pad = ls ? (cardLeft - ls.x) : rs ? (rs.x - cardRight) : DEFAULT_PAD;
    const left = ls ? ls.x : cardLeft - pad;
    const right = rs ? rs.x : cardRight + pad;
    const sparkY = ls?.y ?? rs?.y ?? cardH / 2;
    const top = -(pad - TOP_LESS);
    const bottom = cardH + (pad - BOT_LESS);
    const lx = left - 0.5;
    const rx = right - 0.5;
    const realTopTip = sparkY - REAL_TIP;
    const realBotTip = sparkY + REAL_TIP;
    const topExt = Math.max(realTopTip - top, 0);     // 70px-Ende → obere Ecke
    const botExt = Math.max(bottom - realBotTip, 0);  // 70px-Ende → untere Ecke

    const spinTweens: gsap.core.Tween[] = [];

    // ── Linke Kante ──
    if (ls) {
      // Verlängerung: lDown extends (Schritt1), lUp schließt Lücke (Schritt3)
      gsap.set(els.lDown, { x: lx, y: realBotTip, width: 1, height: botExt, transformOrigin: 'left top', scaleY: 0 });
      gsap.set(els.lUp,   { x: lx, y: top,        width: 1, height: topExt, transformOrigin: 'left top', scaleY: 0 });
      gsap.set(els.sparkL, { opacity: 0 });
    } else {
      const upLen = (sparkY - SPARK_GAP) - top;
      const downLen = bottom - (sparkY + SPARK_GAP);
      gsap.set(els.lDown, { x: lx, y: sparkY + SPARK_GAP, width: 1, height: downLen, transformOrigin: 'left top', scaleY: 0 });
      gsap.set(els.lUp,   { x: lx, y: top,                width: 1, height: upLen,   transformOrigin: 'left top', scaleY: 0 });
      gsap.set(els.sparkL, { x: left - 6, y: sparkY - 6, rotation: 0, opacity: 1 });
      spinTweens.push(gsap.to(els.sparkL, { rotation: '+=360', duration: SPIN_DUR, ease: 'none', repeat: -1 }));
    }

    // ── Rechte Kante ──
    if (rs) {
      gsap.set(els.rUp,   { x: rx, y: top,        width: 1, height: topExt, transformOrigin: 'left bottom', scaleY: 0 });
      gsap.set(els.rDown, { x: rx, y: realBotTip, width: 1, height: botExt, transformOrigin: 'left bottom', scaleY: 0 });
      gsap.set(els.sparkR, { opacity: 0 });
    } else {
      const upLen = (sparkY - SPARK_GAP) - top;
      const downLen = bottom - (sparkY + SPARK_GAP);
      gsap.set(els.rUp,   { x: rx, y: top,                width: 1, height: upLen,   transformOrigin: 'left bottom', scaleY: 0 });
      gsap.set(els.rDown, { x: rx, y: sparkY + SPARK_GAP, width: 1, height: downLen, transformOrigin: 'left bottom', scaleY: 0 });
      gsap.set(els.sparkR, { x: right - 6, y: sparkY - 6, rotation: 0, opacity: 1 });
      spinTweens.push(gsap.to(els.sparkR, { rotation: '+=360', duration: SPIN_DUR, ease: 'none', repeat: -1 }));
    }
    if (spinTweens.length) ovSpins.current.set(index, spinTweens);

    // ── Horizontale ──
    const boxW = (rx + 1) - lx;
    gsap.set(els.hTop,    { x: lx, y: top,    width: boxW, height: 1, transformOrigin: 'right center', scaleX: 0 });
    gsap.set(els.hBottom, { x: lx, y: bottom, width: boxW, height: 1, transformOrigin: 'left center',  scaleX: 0 });
    gsap.set(els.root, { opacity: 1 });

    const tl = gsap.timeline({ paused: true, onReverseComplete: () => finishClose(index) });
    tl.to([els.lDown, els.rUp], { scaleY: 1, duration: STEP, ease: EASE }, 0);        // Schritt 1: verlängern
    tl.to([els.hTop, els.hBottom], { scaleX: 1, duration: STEP, ease: EASE }, STEP);  // Schritt 2: Horizontale
    tl.to([els.lUp, els.rDown], { scaleY: 1, duration: STEP, ease: EASE }, STEP * 2); // Schritt 3: Lücke schließen
    tls.current.set(index, tl);
    tl.play(0);
  }, [enabled, cardSelector, syncSpins, killOvSpins, finishClose]);

  const onLeave = useCallback((index: number) => {
    tls.current.get(index)?.reverse();
  }, []);

  const hideActive = useCallback(() => {
    active.current.forEach((index) => {
      tls.current.get(index)?.kill();
      killOvSpins(index);
      const els = boxes.current.get(index);
      if (els) gsap.set(els.root, { opacity: 0 });
    });
    active.current.clear();
    syncSpins();
  }, [killOvSpins, syncSpins]);

  useEffect(() => {
    if (enabled) return;
    hideActive();
  }, [enabled, hideActive]);

  return { registerBox, registerCard, registerSpark, onEnter, onLeave, hideActive };
}
