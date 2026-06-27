'use client';

/**
 * Zwei einfache Pfeil-Badges, mittig (vertikal) über dem Slider — links/rechts.
 * Statisch, klickbar (prev/next). Faden ein/aus je nach Scrollbarkeit, links
 * weg am Anfang, rechts weg am Ende. Hover → brand-secondary (wie SliderNav).
 */
const BADGE = 55;
const RADIUS = 17;

interface SliderSideArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export default function SliderSideArrows({ onPrev, onNext, canPrev, canNext }: SliderSideArrowsProps) {
  return (
    <>
      <SideBadge side="left" show={canPrev} onClick={onPrev} />
      <SideBadge side="right" show={canNext} onClick={onNext} />
    </>
  );
}

function SideBadge({ side, show, onClick }: { side: 'left' | 'right'; show: boolean; onClick: () => void }) {
  const tri = side === 'right' ? 'M23 17.5 L37 27.5 L23 37.5 Z' : 'M32 17.5 L18 27.5 L32 37.5 Z';
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
        width: BADGE,
        height: BADGE,
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
      <svg width={BADGE} height={BADGE} viewBox={`0 0 ${BADGE} ${BADGE}`} fill="none" style={{ display: 'block' }}>
        <rect x={0.5} y={0.5} width={BADGE - 1} height={BADGE - 1} rx={RADIUS} fill="var(--color-bg-page)" stroke="currentColor" strokeWidth={1} />
        <path d={tri} fill="currentColor" />
      </svg>
    </button>
  );
}
