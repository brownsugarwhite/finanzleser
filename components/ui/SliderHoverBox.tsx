'use client';

import { memo, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

/**
 * Hover-Kasten-Overlay einer einzelnen Slider-Card. Rein imperativ über GSAP
 * gesteuert (useSliderHoverBox) — KEIN React-State auf den animierten Props,
 * damit Re-Renders des Sliders (Scroll-Edge-Fade) nie gegen laufende Tweens
 * kämpfen (vgl. JSX-vs-GSAP-Anti-Pattern).
 *
 * Aufbau: Wurzel spannt von der linken bis zur rechten Spark-Position
 * (`left/right: -(gap/2 + 6)`) über die volle Reihenhöhe. Darin 4 vertikale
 * Halb-Segmente (oben/unten je Seite), 2 Horizontale und 2 Sparks. Alle
 * Positionen/Längen setzt der Hook beim Hover per Messung.
 */
export interface HoverBoxEls {
  root: HTMLDivElement;
  lUp: HTMLDivElement;
  lDown: HTMLDivElement;
  rUp: HTMLDivElement;
  rDown: HTMLDivElement;
  hTop: HTMLDivElement;
  hBottom: HTMLDivElement;
  sparkL: SVGSVGElement;
  sparkR: SVGSVGElement;
}

const SPARK_PATH =
  'M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z';

const LINE_BG = 'var(--fill-0, #334A27)';
const segBase: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 1,
  height: 1,
  background: LINE_BG,
};
const sparkBase: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  transformOrigin: 'center',
  display: 'block',
};

interface SliderHoverBoxProps {
  index: number;
  /** Slider-Gap (ART_GAP / CAT_GAP) — bestimmt den linken/rechten Überhang. */
  gap: number;
  register: (index: number, els: HoverBoxEls | null) => void;
}

function SliderHoverBoxImpl({ index, gap, register }: SliderHoverBoxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lUpRef = useRef<HTMLDivElement>(null);
  const lDownRef = useRef<HTMLDivElement>(null);
  const rUpRef = useRef<HTMLDivElement>(null);
  const rDownRef = useRef<HTMLDivElement>(null);
  const hTopRef = useRef<HTMLDivElement>(null);
  const hBottomRef = useRef<HTMLDivElement>(null);
  const sparkLRef = useRef<SVGSVGElement>(null);
  const sparkRRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const els: HoverBoxEls | null =
      rootRef.current && lUpRef.current && lDownRef.current && rUpRef.current &&
      rDownRef.current && hTopRef.current && hBottomRef.current &&
      sparkLRef.current && sparkRRef.current
        ? {
            root: rootRef.current,
            lUp: lUpRef.current,
            lDown: lDownRef.current,
            rUp: rUpRef.current,
            rDown: rDownRef.current,
            hTop: hTopRef.current,
            hBottom: hBottomRef.current,
            sparkL: sparkLRef.current,
            sparkR: sparkRRef.current,
          }
        : null;
    register(index, els);
    return () => register(index, null);
  }, [index, register]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      style={{
        position: 'absolute',
        left: -(gap / 2 + 6),
        right: -(gap / 2 + 6),
        top: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0,
      }}
    >
      <div ref={lUpRef} style={segBase} />
      <div ref={lDownRef} style={segBase} />
      <div ref={rUpRef} style={segBase} />
      <div ref={rDownRef} style={segBase} />
      <div ref={hTopRef} style={segBase} />
      <div ref={hBottomRef} style={segBase} />
      <svg ref={sparkLRef} width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={sparkBase}>
        <path d={SPARK_PATH} fill={LINE_BG} />
      </svg>
      <svg ref={sparkRRef} width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={sparkBase}>
        <path d={SPARK_PATH} fill={LINE_BG} />
      </svg>
    </div>
  );
}

// memo: das Overlay darf bei Slider-Re-Renders (Scroll) NICHT neu rendern,
// sonst würden die Callback-Refs flackern und laufende Tweens reißen.
const SliderHoverBox = memo(SliderHoverBoxImpl);
export default SliderHoverBox;
