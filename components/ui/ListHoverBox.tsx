'use client';

import { memo, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

/**
 * Hover-Kasten-Overlay für die (vertikal gestapelte) Artikel-Liste — TRANSPONIERTE
 * Variante von SliderHoverBox: die Sparks sitzen oben/unten mittig (statt links/rechts),
 * die Box geht von den HORIZONTALEN Linien aus. 4 horizontale Halb-Segmente (oben/unten
 * je links/rechts des Sparks), 2 Vertikale (links/rechts), 2 Sparks (oben/unten).
 * Rein imperativ via GSAP (useListHoverBox).
 */
export interface ListHoverBoxEls {
  root: HTMLDivElement;
  tLeft: HTMLDivElement;
  tRight: HTMLDivElement;
  bLeft: HTMLDivElement;
  bRight: HTMLDivElement;
  vLeft: HTMLDivElement;
  vRight: HTMLDivElement;
  sparkT: SVGSVGElement;
  sparkB: SVGSVGElement;
}

const SPARK_PATH =
  'M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z';

const LINE_BG = 'var(--fill-0, #334A27)';
const segBase: CSSProperties = { position: 'absolute', left: 0, top: 0, width: 1, height: 1, background: LINE_BG };
const sparkBase: CSSProperties = { position: 'absolute', left: 0, top: 0, transformOrigin: 'center', display: 'block' };

interface ListHoverBoxProps {
  index: number;
  /** Vertikaler Überhang oben/unten (= Platz für die Sparks). */
  gap: number;
  register: (index: number, els: ListHoverBoxEls | null) => void;
}

function ListHoverBoxImpl({ index, gap, register }: ListHoverBoxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tLeftRef = useRef<HTMLDivElement>(null);
  const tRightRef = useRef<HTMLDivElement>(null);
  const bLeftRef = useRef<HTMLDivElement>(null);
  const bRightRef = useRef<HTMLDivElement>(null);
  const vLeftRef = useRef<HTMLDivElement>(null);
  const vRightRef = useRef<HTMLDivElement>(null);
  const sparkTRef = useRef<SVGSVGElement>(null);
  const sparkBRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const els: ListHoverBoxEls | null =
      rootRef.current && tLeftRef.current && tRightRef.current && bLeftRef.current &&
      bRightRef.current && vLeftRef.current && vRightRef.current &&
      sparkTRef.current && sparkBRef.current
        ? {
            root: rootRef.current,
            tLeft: tLeftRef.current,
            tRight: tRightRef.current,
            bLeft: bLeftRef.current,
            bRight: bRightRef.current,
            vLeft: vLeftRef.current,
            vRight: vRightRef.current,
            sparkT: sparkTRef.current,
            sparkB: sparkBRef.current,
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
        left: 0,
        right: 0,
        top: -(gap / 2 + 6),
        bottom: -(gap / 2 + 6),
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0,
      }}
    >
      <div ref={tLeftRef} style={segBase} />
      <div ref={tRightRef} style={segBase} />
      <div ref={bLeftRef} style={segBase} />
      <div ref={bRightRef} style={segBase} />
      <div ref={vLeftRef} style={segBase} />
      <div ref={vRightRef} style={segBase} />
      <svg ref={sparkTRef} width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={sparkBase}>
        <path d={SPARK_PATH} fill={LINE_BG} />
      </svg>
      <svg ref={sparkBRef} width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={sparkBase}>
        <path d={SPARK_PATH} fill={LINE_BG} />
      </svg>
    </div>
  );
}

const ListHoverBox = memo(ListHoverBoxImpl);
export default ListHoverBox;
