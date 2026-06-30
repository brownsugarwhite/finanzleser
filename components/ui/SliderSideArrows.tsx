'use client';

import { useEffect, useState } from 'react';

/**
 * Zwei einfache Pfeil-Badges, mittig (vertikal) über dem Slider — links/rechts.
 * Statisch, klickbar (prev/next). Faden ein/aus je nach Scrollbarkeit, links
 * weg am Anfang, rechts weg am Ende. Hover → brand-secondary (wie SliderNav).
 *
 * Mobile (≤767): gleiche Höhe, aber schmaler (44 statt 55).
 */
const HEIGHT = 55;
const WIDTH_DESKTOP = 55;
const WIDTH_MOBILE = 44;
const RADIUS = 17;

interface SliderSideArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export default function SliderSideArrows({ onPrev, onNext, canPrev, canNext }: SliderSideArrowsProps) {
  const [width, setWidth] = useState(WIDTH_DESKTOP);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const update = () => setWidth(mql.matches ? WIDTH_MOBILE : WIDTH_DESKTOP);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return (
    <>
      <SideBadge side="left" show={canPrev} onClick={onPrev} width={width} />
      <SideBadge side="right" show={canNext} onClick={onNext} width={width} />
    </>
  );
}

function SideBadge({ side, show, onClick, width }: { side: 'left' | 'right'; show: boolean; onClick: () => void; width: number }) {
  const cx = width / 2;
  const cy = HEIGHT / 2;
  // Pfeil-Dreieck relativ zur (variablen) Breite zentriert.
  const tri = side === 'right'
    ? `M ${cx - 4.5} ${cy - 10} L ${cx + 9.5} ${cy} L ${cx - 4.5} ${cy + 10} Z`
    : `M ${cx + 4.5} ${cy - 10} L ${cx - 9.5} ${cy} L ${cx + 4.5} ${cy + 10} Z`;
  return (
    <button
      className="slider-side-arrow"
      onClick={onClick}
      aria-label={side === 'right' ? 'Weiter' : 'Zurück'}
      style={{
        position: 'absolute',
        top: '50%',
        [side]: 12,
        transform: 'translateY(-50%)',
        width,
        height: HEIGHT,
        padding: 0,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        zIndex: 10,
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}
    >
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} fill="none" style={{ display: 'block' }}>
        <rect x={0.5} y={0.5} width={width - 1} height={HEIGHT - 1} rx={RADIUS} fill="var(--color-bg-page)" stroke="currentColor" strokeWidth={1} />
        <path d={tri} fill="currentColor" />
      </svg>
    </button>
  );
}
