'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SliderSafeZoneProps {
  direction: 'left' | 'right';
  width?: number;
  scrollable?: boolean;
  onClick?: () => void;
  zIndex?: number;
}

/**
 * Safe-Zone-Overlay am Rand eines Sliders.
 * - Blockt Hover/Click auf Cards darunter
 * - Drag funktioniert weiter (PointerDown bubbelt zum Embla-Root)
 * - Im Hover erscheint ein Richtungs-Pfeil am Cursor (Scale-In)
 * - Bei PointerDown: Squeeze (in Pfeilrichtung länger) + brand-secondary Farbe,
 *   hält bis PointerUp
 */
export default function SliderSafeZone({
  direction,
  width = 100,
  scrollable = true,
  onClick,
  zIndex = 6,
}: SliderSafeZoneProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const posRef = useRef<HTMLDivElement>(null);

  const updatePos = (x: number, y: number) => {
    if (posRef.current) {
      posRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  };

  const handleEnter = useCallback((e: React.MouseEvent) => {
    updatePos(e.clientX, e.clientY);
    setHovered(true);
  }, []);

  const handleLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const handleMove = useCallback((e: React.MouseEvent) => {
    updatePos(e.clientX, e.clientY);
  }, []);

  const handleDown = useCallback(() => {
    setPressed(true);
  }, []);

  // Global pointerup fängt auch Release außerhalb der Safe-Zone (z.B. nach Drag).
  useEffect(() => {
    if (!pressed) return;
    const release = () => setPressed(false);
    window.addEventListener('pointerup', release);
    return () => window.removeEventListener('pointerup', release);
  }, [pressed]);

  const active = hovered && scrollable;
  // Basis-Größe — etwas kleiner als das native SVG (43x31).
  const base = active ? 0.85 : 0;
  // Squeeze: länger Richtung Pfeilspitze, schmaler; Origin auf stumpfer Seite.
  const squeezeX = pressed ? 1.2 : 1;
  const squeezeY = pressed ? 0.75 : 1;
  const sx = base * squeezeX;
  const sy = base * squeezeY;

  // Positionierung: Stumpf an Cursor.
  // Rechts-Pfeil: Element-Left-Center an Cursor → translate(0%, -50%)
  // Links-Pfeil:  Element-Right-Center an Cursor → translate(-100%, -50%)
  const anchorTranslate = direction === 'left' ? 'translate(-100%, -50%)' : 'translate(0%, -50%)';
  // Scale-Origin ist die stumpfe Seite (in Element-lokalen Koordinaten).
  const scaleOrigin = direction === 'left' ? '100% 50%' : '0% 50%';

  return (
    <>
      <div
        aria-hidden
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
        onPointerDown={handleDown}
        onClick={onClick}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [direction]: 0,
          width,
          cursor: scrollable ? 'none' : 'default',
          zIndex,
        }}
      />
      {/* Outer: folgt Cursor via imperatives translate3d (kein Transition) */}
      <div
        ref={posRef}
        aria-hidden
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate3d(-9999px, -9999px, 0)',
        }}
      >
        {/* Anchor: verschiebt Element so, dass die stumpfe Seite am Cursor sitzt */}
        <div style={{ transform: anchorTranslate }}>
          {/* Squeeze: skaliert mit Origin an der stumpfen Seite */}
          <div
            style={{
              transform: `scale(${sx}, ${sy})`,
              transformOrigin: scaleOrigin,
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.15s ease',
              color: pressed ? 'var(--color-brand-secondary)' : 'var(--color-text-primary)',
              willChange: 'transform',
            }}
          >
            {/* Flip für Links-Pfeil (in-place, Origin center) */}
            <div
              style={{
                transform: direction === 'left' ? 'scaleX(-1)' : 'none',
                transformOrigin: '50% 50%',
                display: 'inline-block',
                lineHeight: 0,
              }}
            >
              <svg width="43" height="31" viewBox="0 0 43 31" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M43 15.25L0 30.5V0L43 15.25Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
