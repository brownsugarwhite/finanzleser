"use client";
import { useRef, useCallback, useEffect, useState } from "react";

/* ── Types ──────────────────────────────────────── */

export interface CardState {
  dataIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  contentOpacity: number;
  descOpacity: number;
  bookmarkOpacity: number;
  borderOpacity: number;
  titleFontSize: number;
}

interface Slot {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

interface UseRevolverSliderOptions {
  count: number;                    // number of items (3)
  initialIndex: number;             // which item starts on top
  containerWidth: number;           // measured container width
  topCardHeight: number;            // measured expanded card height
  onActiveChange?: (index: number) => void;
}

/* ── Math helpers (from reference) ── */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sw = (t: number, a: number, b: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x); // smoothstep
};

/* ── Hook ───────────────────────────────────────── */

export function useRevolverSlider({
  count,
  initialIndex,
  containerWidth: W,
  topCardHeight: TH,
  onActiveChange,
}: UseRevolverSliderOptions) {
  /* ── Layout (stored in ref to keep callbacks stable) ── */
  const layout = useRef({ W: 0, TH: 0, GAP: 20, BW: 0, BH: 0, BY: 0, STAGE_H: 0, DRAG_PX: 0, SLOT: [] as Slot[] });
  {
    const GAP = 23;
    const BW = (W - GAP) / 2;
    const BH = Math.round(BW * 0.75) - 40;
    const BY = TH + GAP;
    layout.current = {
      W, TH, GAP, BW, BH, BY,
      STAGE_H: TH + GAP + BH,
      DRAG_PX: W * 1.4,
      SLOT: [
        { cx: W / 2, cy: TH / 2, w: W, h: TH },
        { cx: BW + GAP + BW / 2, cy: BY + BH / 2, w: BW, h: BH },
        { cx: BW / 2, cy: BY + BH / 2, w: BW, h: BH },
      ],
    };
  }

  /* ── Mutable state (rAF-driven, no React re-renders during animation) ── */
  const order = useRef<number[]>([
    initialIndex % count,
    (initialIndex + 1) % count,
    (initialIndex + 2) % count,
  ]);
  const rot = useRef(0);
  const vel = useRef(0);
  const sparkleRot = useRef(0);
  const raf = useRef<number | null>(null);
  const dragging = useRef(false);
  const x0 = useRef(0);
  const rotStart = useRef(0);
  const samples = useRef<{ t: number; p: number }[]>([]);
  const didDrag = useRef(false);
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;

  const CW_TO = [1, 2, 0];
  const CCW_TO = [2, 0, 1];

  /* ── React state for rendering ── */
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [sparkleRotation, setSparkleRotation] = useState(0);
  const [sparkleOpacity, setSparkleOpacity] = useState(1);
  const [activeDataIndex, setActiveDataIndex] = useState(initialIndex);

  /* ── Morph interpolation (from reference) ── */

  const morph = useCallback((from: number, to: number, t: number): { cx: number; cy: number; w: number; h: number } => {
    const { SLOT, TH: lTH, BH: lBH } = layout.current;
    const fs = SLOT[from], ts = SLOT[to];

    // Both bottom slots — simple arc
    if (from !== 0 && to !== 0) {
      const s = sw(t, 0, 1);
      const sq = Math.sin(s * Math.PI);
      return {
        cx: lerp(fs.cx, ts.cx, s),
        cy: fs.cy + lBH * 0.06 * sq,
        w: lerp(fs.w, ts.w, s) * (1 + sq * 0.16),
        h: fs.h * (1 - sq * 0.10),
      };
    }

    const midH = lTH + lBH * 0.4;
    const midCy = midH / 2;

    // Bottom → Top
    if (from !== 0) {
      const hRise = sw(t, 0.00, 0.44);
      const hFall = sw(t, 0.47, 0.92);
      const h = hFall > 0 ? lerp(midH, ts.h, hFall) : lerp(fs.h, midH, hRise);
      const cy = hFall > 0 ? lerp(midCy, ts.cy, hFall) : lerp(fs.cy, midCy, hRise);
      return {
        cx: lerp(fs.cx, ts.cx, sw(t, 0.68, 1.00)),
        cy, w: lerp(fs.w, ts.w, sw(t, 0.68, 1.00)), h,
      };
    }

    // Top → Bottom
    const w = lerp(fs.w, ts.w, sw(t, 0.00, 0.22));
    const cx = lerp(fs.cx, ts.cx, sw(t, 0.00, 0.22));
    const hRise = sw(t, 0.18, 0.52);
    const hFall = sw(t, 0.55, 1.00);
    const h = hFall > 0 ? lerp(midH, ts.h, hFall) : lerp(fs.h, midH, hRise);
    const cy = hFall > 0 ? lerp(midCy, ts.cy, hFall) : lerp(fs.cy, midCy, hRise);
    return { cx, cy, w, h };
  }, []);

  /* ── Commit rotation ── */

  const commit = useCallback((cw: boolean) => {
    sparkleRot.current += cw ? 120 : -120;
    const o = order.current;
    order.current = cw ? [o[2], o[0], o[1]] : [o[1], o[2], o[0]];
  }, []);

  /* ── Render to React state ── */

  const render = useCallback(() => {
    const t = Math.min(1, Math.abs(rot.current));
    const NEXT = rot.current >= 0 ? CW_TO : CCW_TO;

    const states: CardState[] = order.current.map((ci, si) => {
      const ts = NEXT[si];
      const { cx, cy, w, h } = morph(si, ts, t);

      let contentOpacity: number;
      if (si === 0 && ts === 0) contentOpacity = 1;
      else if (si === 0 && ts !== 0) contentOpacity = 1 - Math.pow(t, 5);
      else if (si !== 0 && ts === 0) contentOpacity = Math.pow(t, 2);
      else contentOpacity = 0;

      // descOpacity: description+button fade faster, tied to width shrink
      let descOpacity: number;
      if (si === 0 && ts === 0) descOpacity = 1;
      else if (si === 0 && ts !== 0) {
        const { SLOT } = layout.current;
        const wProgress = (SLOT[0].w - w) / (SLOT[0].w - SLOT[ts].w);
        descOpacity = Math.max(0, 1 - wProgress);
      }
      else if (si !== 0 && ts === 0) {
        const { SLOT } = layout.current;
        const wProgress = (w - SLOT[si].w) / (SLOT[0].w - SLOT[si].w);
        descOpacity = Math.max(0, wProgress);
      }
      else descOpacity = 0;

      // bookmarkOpacity: fades out early (with desc), fades in late (with content)
      let bookmarkOpacity: number;
      if (si === 0 && ts === 0) bookmarkOpacity = 1;
      else if (si === 0 && ts !== 0) bookmarkOpacity = descOpacity; // out early
      else if (si !== 0 && ts === 0) bookmarkOpacity = contentOpacity; // in late
      else bookmarkOpacity = 0;

      let titleFontSize: number;
      if (si === 0 && ts === 0) titleFontSize = 24;
      else if (si === 0 && ts !== 0) {
        // Shrink early, synced with bookmark/desc fadeout
        const shrinkT = Math.min(1, t * 5);
        titleFontSize = 24 - 8 * shrinkT;
      }
      else if (si !== 0 && ts === 0) titleFontSize = 16 + 8 * t;
      else titleFontSize = 16;

      const borderOpacity = contentOpacity;

      return {
        dataIndex: ci,
        x: cx - w / 2,
        y: cy - h / 2,
        w, h,
        zIndex: (si === 0 && ts === 0) ? 10 : si !== 0 ? 20 : 15,
        contentOpacity,
        descOpacity,
        bookmarkOpacity,
        borderOpacity,
        titleFontSize,
      };
    });

    setCardStates(states);
    setSparkleRotation(sparkleRot.current + rot.current * 120);
    setSparkleOpacity(1);
    setActiveDataIndex(order.current[0]);
  }, [morph]);

  /* ── Detent snap (spring physics) ── */

  const detentSnap = useCallback((target: number, initVel = 0) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    vel.current = initVel;
    let snapTo = target;
    let lastTime = performance.now();

    const step = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 16.667, 3); // normalize to 60fps, cap at 3x
      lastTime = now;

      vel.current += (snapTo - rot.current) * 0.004 * dt;
      vel.current *= Math.pow(0.94, dt);
      rot.current += vel.current * dt;

      if (rot.current >= 1) {
        commit(true);
        rot.current -= 1;
        if (snapTo >= 0.5) snapTo = Math.max(0, snapTo - 1);
      }
      if (rot.current <= -1) {
        commit(false);
        rot.current += 1;
        if (snapTo <= -0.5) snapTo = Math.min(0, snapTo + 1);
      }

      render();

      if (Math.abs(snapTo - rot.current) < 0.0008 && Math.abs(vel.current) < 0.0008) {
        rot.current = snapTo;
        if (Math.abs(snapTo) > 0.98) {
          commit(snapTo > 0);
          rot.current = 0;
        }
        render();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    step();
  }, [commit, render]);

  /* ── Click handler for bottom cards ── */

  const handleCardClick = useCallback((dataIndex: number) => {
    const si = order.current.indexOf(dataIndex);
    if (si === 1) detentSnap(-1, 0);
    else if (si === 2) detentSnap(1, 0);
    // Notify parent immediately with the clicked card's index
    onActiveChangeRef.current?.(dataIndex);
  }, [detentSnap]);

  /* ── Pointer event handlers ── */

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    didDrag.current = false;
    x0.current = e.clientX;
    rotStart.current = rot.current;
    samples.current = [];
    if (raf.current) cancelAnimationFrame(raf.current);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const now = Date.now();
    const dx = e.clientX - x0.current;
    if (Math.abs(dx) > 6) didDrag.current = true;

    let newRot = rotStart.current + dx / layout.current.DRAG_PX;

    // Wrap during drag
    while (newRot >= 1) { commit(true); newRot -= 1; rotStart.current -= 1; samples.current = []; }
    while (newRot <= -1) { commit(false); newRot += 1; rotStart.current += 1; samples.current = []; }

    rot.current = newRot;
    samples.current.push({ t: now, p: rot.current });
    while (samples.current.length > 1 && now - samples.current[0].t > 80) samples.current.shift();

    render();
  }, [commit, render]);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!didDrag.current) return;

    let rv = 0;
    if (samples.current.length >= 2) {
      const s0 = samples.current[0];
      const s1 = samples.current[samples.current.length - 1];
      rv = (s1.p - s0.p) / Math.max(s1.t - s0.t, 1) * 14;
    }
    samples.current = [];

    const projected = rot.current + rv * 5;
    const snap = projected >= 0.5 ? 1 : projected <= -0.5 ? -1 : 0;

    // Predict which card will be on top after snap and notify immediately
    if (snap !== 0) {
      const o = order.current;
      const nextOrder = snap > 0 ? [o[2], o[0], o[1]] : [o[1], o[2], o[0]];
      onActiveChangeRef.current?.(nextOrder[0]);
    }

    detentSnap(snap, Math.max(-0.012, Math.min(0.012, rv)));
  }, [detentSnap]);

  const onPointerCancel = useCallback(() => {
    dragging.current = false;
    samples.current = [];
    detentSnap(Math.round(Math.max(-1, Math.min(1, rot.current))));
  }, [detentSnap]);

  /* ── Initial render ── */

  useEffect(() => {
    render();
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [render]);

  /* ── initialIndex only used for first mount (via useRef initial value) ── */

  return {
    stageHeight: layout.current.STAGE_H,
    cardStates,
    sparkleRotation,
    sparkleOpacity,
    activeDataIndex,
    handleCardClick,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    slotLayout: layout.current,
  };
}
