'use client';

import { useCallback, useEffect, useRef } from 'react';
import gsap from '@/lib/gsapConfig';
import type { ListHoverBoxEls } from '@/components/ui/ListHoverBox';

/* TRANSPONIERTE Variante von useSliderHoverBox: die echten Spark-Divider OBEN/UNTEN
   sind die Anker (registerSpark). Die echte Linie bleibt stehen; das Duplikat zeichnet
   nur die Verlängerung vom Linien-Ende zur Ecke (Schritt 1/3), plus die zwei Vertikalen
   (Schritt 2). Erste/letzte Card (ohne echten Divider an einer Kante) → eigene Spark + volle Kante. */
const LINE_OFF = 11;     // Spark-Mitte → Linienanfang
const SPARK_GAP = 11;    // Lücke um den (eigenen) Spark
const SIDE_LESS = 18;    // links/rechts weniger Padding als oben/unten
const DEFAULT_PAD = 24;
const STEP = 0.18;
const EASE = 'power2.out';
const SPIN_DUR = 4;

interface UseListHoverBoxOptions {
  cardSelector: string;
  enabled: boolean;
  restLen?: number;
}

export function useListHoverBox({ cardSelector, enabled, restLen = 70 }: UseListHoverBoxOptions) {
  const REAL_TIP = LINE_OFF + restLen;

  const boxes = useRef<Map<number, ListHoverBoxEls>>(new Map());
  const cards = useRef<Map<number, HTMLElement>>(new Map());
  const sparks = useRef<Map<number, SVGSVGElement>>(new Map());
  const tls = useRef<Map<number, gsap.core.Timeline>>(new Map());
  const ovSpins = useRef<Map<number, gsap.core.Tween[]>>(new Map());
  const spinning = useRef<Set<SVGSVGElement>>(new Set());
  const active = useRef<Set<number>>(new Set());
  const inRegion = useRef(false);
  const enterTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const registerBox = useCallback((i: number, els: ListHoverBoxEls | null) => {
    if (els) boxes.current.set(i, els); else boxes.current.delete(i);
  }, []);
  const registerCard = useCallback((i: number, el: HTMLElement | null) => {
    if (el) cards.current.set(i, el); else cards.current.delete(i);
  }, []);
  const registerSpark = useCallback((g: number, el: SVGSVGElement | null) => {
    if (el) sparks.current.set(g, el); else sparks.current.delete(g);
  }, []);

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
      const t = sparks.current.get(i - 1); const b = sparks.current.get(i);
      if (t) want.add(t); if (b) want.add(b);
    });
    want.forEach((el) => setSpin(el, true));
    spinning.current.forEach((el) => { if (!want.has(el)) setSpin(el, false); });
  }, [setSpin]);

  const killOvSpins = useCallback((i: number) => {
    ovSpins.current.get(i)?.forEach((t) => t.kill());
    ovSpins.current.delete(i);
  }, []);

  const finishClose = useCallback((index: number) => {
    const els = boxes.current.get(index);
    const done = () => { killOvSpins(index); active.current.delete(index); syncSpins(); };
    if (els) gsap.to(els.root, { opacity: 0, duration: 0.15, ease: 'power1.out', onComplete: done });
    else done();
  }, [killOvSpins, syncSpins]);

  const startBox = useCallback((index: number) => {
    if (!enabled) return;
    const els = boxes.current.get(index);
    const card = cards.current.get(index);
    if (!els || !card) return;
    active.current.add(index);
    syncSpins();

    const existing = tls.current.get(index);
    if (existing && (gsap.getProperty(els.root, 'opacity') as number) > 0) { existing.play(); return; }
    existing?.kill();
    killOvSpins(index);

    const rootRect = els.root.getBoundingClientRect();
    const overlayH = rootRect.height;
    if (overlayH <= 0) return;
    const content = (card.querySelector(cardSelector) as HTMLElement | null) ?? card;
    const cardW = content.offsetWidth;
    const cardH = content.offsetHeight;
    if (cardW <= 0 || cardH <= 0) return;

    const cy = overlayH / 2;
    const cardTop = cy - cardH / 2;
    const cardBottom = cy + cardH / 2;
    const center = (el: SVGSVGElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - rootRect.left, y: r.top + r.height / 2 - rootRect.top };
    };
    const topSpark = sparks.current.get(index - 1);
    const bottomSpark = sparks.current.get(index);
    const ts = topSpark ? center(topSpark) : null;
    const bs = bottomSpark ? center(bottomSpark) : null;

    const pad = ts ? (cardTop - ts.y) : bs ? (bs.y - cardBottom) : DEFAULT_PAD;
    const top = ts ? ts.y : cardTop - pad;
    const bottom = bs ? bs.y : cardBottom + pad;
    const sparkX = ts?.x ?? bs?.x ?? cardW / 2;
    const left = -(pad - SIDE_LESS);
    const right = cardW + (pad - SIDE_LESS);
    const ty = top - 0.5;
    const by = bottom - 0.5;
    const realLeftTip = sparkX - REAL_TIP;
    const realRightTip = sparkX + REAL_TIP;
    const leftExt = Math.max(realLeftTip - left, 0);
    const rightExt = Math.max(right - realRightTip, 0);

    const spinTweens: gsap.core.Tween[] = [];

    // ── Obere Kante ──
    if (ts) {
      gsap.set(els.tRight, { x: realRightTip, y: ty, width: rightExt, height: 1, transformOrigin: 'left top', scaleX: 0 });
      gsap.set(els.tLeft, { x: left, y: ty, width: leftExt, height: 1, transformOrigin: 'left top', scaleX: 0 });
      gsap.set(els.sparkT, { opacity: 0 });
    } else {
      const lLen = (sparkX - SPARK_GAP) - left;
      const rLen = right - (sparkX + SPARK_GAP);
      gsap.set(els.tRight, { x: sparkX + SPARK_GAP, y: ty, width: rLen, height: 1, transformOrigin: 'left top', scaleX: 0 });
      gsap.set(els.tLeft, { x: left, y: ty, width: lLen, height: 1, transformOrigin: 'left top', scaleX: 0 });
      gsap.set(els.sparkT, { x: sparkX - 6, y: top - 6, rotation: 0, opacity: 1 });
      spinTweens.push(gsap.to(els.sparkT, { rotation: '+=360', duration: SPIN_DUR, ease: 'none', repeat: -1 }));
    }

    // ── Untere Kante (wächst nach LINKS — Uhrzeigersinn) ──
    if (bs) {
      gsap.set(els.bLeft, { x: left, y: by, width: leftExt, height: 1, transformOrigin: 'right top', scaleX: 0 });
      gsap.set(els.bRight, { x: realRightTip, y: by, width: rightExt, height: 1, transformOrigin: 'right top', scaleX: 0 });
      gsap.set(els.sparkB, { opacity: 0 });
    } else {
      const lLen = (sparkX - SPARK_GAP) - left;
      const rLen = right - (sparkX + SPARK_GAP);
      gsap.set(els.bLeft, { x: left, y: by, width: lLen, height: 1, transformOrigin: 'right top', scaleX: 0 });
      gsap.set(els.bRight, { x: sparkX + SPARK_GAP, y: by, width: rLen, height: 1, transformOrigin: 'right top', scaleX: 0 });
      gsap.set(els.sparkB, { x: sparkX - 6, y: bottom - 6, rotation: 0, opacity: 1 });
      spinTweens.push(gsap.to(els.sparkB, { rotation: '+=360', duration: SPIN_DUR, ease: 'none', repeat: -1 }));
    }
    if (spinTweens.length) ovSpins.current.set(index, spinTweens);

    // ── Vertikale ──
    const boxH = (by + 1) - ty;
    const lx = left - 0.5;
    const rx = right - 0.5;
    gsap.set(els.vLeft, { x: lx, y: ty, width: 1, height: boxH, transformOrigin: 'center bottom', scaleY: 0 });
    gsap.set(els.vRight, { x: rx, y: ty, width: 1, height: boxH, transformOrigin: 'center top', scaleY: 0 });
    gsap.set(els.root, { opacity: 1 });

    const tl = gsap.timeline({ paused: true, onReverseComplete: () => finishClose(index) });
    tl.to([els.tRight, els.bLeft], { scaleX: 1, duration: STEP, ease: EASE }, 0);        // Schritt 1: verlängern (diagonal)
    tl.to([els.vLeft, els.vRight], { scaleY: 1, duration: STEP, ease: EASE }, STEP);     // Schritt 2: Vertikale
    tl.to([els.tLeft, els.bRight], { scaleX: 1, duration: STEP, ease: EASE }, STEP * 2); // Schritt 3: Lücke schließen
    tls.current.set(index, tl);
    tl.play(0);
  }, [enabled, cardSelector, syncSpins, killOvSpins, finishClose, REAL_TIP]);

  // Ab dem 2. Hover innerhalb der Liste (Maus hat die Liste nicht verlassen) 0,1s
  // Delay vor dem Start; der 1. Hover startet sofort. Rück-Animation immer sofort.
  const onEnter = useCallback((index: number) => {
    if (!enabled) return;
    const pending = enterTimers.current.get(index);
    if (pending) { clearTimeout(pending); enterTimers.current.delete(index); }
    const delay = inRegion.current ? 250 : 0;
    inRegion.current = true;
    if (delay === 0) { startBox(index); return; }
    const timer = setTimeout(() => { enterTimers.current.delete(index); startBox(index); }, delay);
    enterTimers.current.set(index, timer);
  }, [enabled, startBox]);

  const onLeave = useCallback((index: number) => {
    const pending = enterTimers.current.get(index);
    if (pending) { clearTimeout(pending); enterTimers.current.delete(index); }
    tls.current.get(index)?.reverse();
  }, []);

  // Maus verlässt die GANZE Liste → nächster Hover gilt wieder als „erster" (kein Delay).
  const leaveRegion = useCallback(() => {
    inRegion.current = false;
    enterTimers.current.forEach((t) => clearTimeout(t));
    enterTimers.current.clear();
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
    if (!enabled) hideActive();
  }, [enabled, hideActive]);

  return { registerBox, registerCard, registerSpark, onEnter, onLeave, leaveRegion };
}
