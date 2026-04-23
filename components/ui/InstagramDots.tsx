"use client";

import { useEffect, useRef, useState } from "react";

interface InstagramDotsProps {
  current: number;
  total: number;
  onGoTo: (index: number) => void;
  visibleCount?: number;
  /** Wenn false: alle Dots auf der Stelle zu scale(0) schrumpfen. */
  visible?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const DOT_FULL = 8;
const DOT_ACTIVE = 11;
const GAP = 6;
const TRANSITION_MS = 300;

export default function InstagramDots({
  current,
  total,
  onGoTo,
  visibleCount: visibleCountProp,
  visible = true,
}: InstagramDotsProps) {
  // renderedTotal: während Shrinks wird die Unmount der Dots verzögert, damit
  // sie smooth (width/scale→0) rausanimieren können. Bei Grow sofort neue
  // Slots mounten — sie starten per CSS-Animation bei scale(0) und wachsen
  // zu scale(1).
  const [renderedTotal, setRenderedTotal] = useState(total);
  const prevTotalRef = useRef(total);

  useEffect(() => {
    if (total > prevTotalRef.current) {
      setRenderedTotal(total);
      prevTotalRef.current = total;
    } else if (total < prevTotalRef.current) {
      const t = setTimeout(() => {
        setRenderedTotal(total);
        prevTotalRef.current = total;
      }, TRANSITION_MS + 20);
      return () => clearTimeout(t);
    }
  }, [total]);

  // Für's Rendering nutzen wir den max. Wert (renderedTotal), aber die
  // Sichtbarkeit/Größe pro Dot hängt an `total`: Dots mit i >= total werden
  // auf Größe 0 animiert und dann entfernt.
  const displayedTotal = Math.max(renderedTotal, total);
  const visibleCount = visibleCountProp ?? (displayedTotal <= 7 ? 5 : 7);

  // Berechnet die "natürliche" Größe des Dots (ohne Scale-Out für entfernte Dots).
  function getBaseSize(i: number): number {
    if (i >= total) return 0; // wird entfernt
    if (total <= visibleCount) {
      return i === current ? DOT_ACTIVE : DOT_FULL;
    }
    // Window
    let windowStart = current - 2;
    if (windowStart < 0) windowStart = 0;
    if (windowStart > total - visibleCount) windowStart = total - visibleCount;

    if (i === current) return DOT_ACTIVE;
    const posInWindow = i - windowStart;
    if (posInWindow < 0 || posInWindow >= visibleCount) return 0;

    const activePos = current - windowStart;
    const leftShrink = Math.min(1, activePos / 2);
    const rightShrink = Math.min(1, (visibleCount - 1 - activePos) / 2);

    if (posInWindow === 0) return lerp(DOT_FULL, 3, leftShrink);
    if (posInWindow === 1) return lerp(DOT_FULL, 5, leftShrink);
    if (posInWindow === visibleCount - 1) return lerp(DOT_FULL, 3, rightShrink);
    if (posInWindow === visibleCount - 2) return lerp(DOT_FULL, 5, rightShrink);
    return DOT_FULL;
  }

  // Für total <= visibleCount: einfaches Layout ohne Scroll-Fenster
  const useSimpleLayout = total <= visibleCount && renderedTotal <= visibleCount;

  // TranslateX nur im Window-Modus
  let windowStart = current - 2;
  if (windowStart < 0) windowStart = 0;
  if (windowStart > total - visibleCount) windowStart = total - visibleCount;

  const sizes: number[] = [];
  for (let i = 0; i < displayedTotal; i++) sizes.push(getBaseSize(i));

  // Container-Breite: Summe aller sichtbaren Slot-Größen + Gaps
  let containerWidth = 0;
  let slotCount = 0;
  for (let i = 0; i < displayedTotal; i++) {
    if (sizes[i] > 0) {
      if (slotCount > 0) containerWidth += GAP;
      containerWidth += sizes[i];
      slotCount++;
    }
  }

  // TranslateX: Offset für Window-Scrolling
  let translateX = 0;
  if (!useSimpleLayout) {
    for (let i = 0; i < windowStart; i++) {
      if (sizes[i] > 0 || i < total) translateX -= sizes[i] + GAP;
    }
  }

  return (
    <div style={{
      width: containerWidth,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      transition: `width ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1)`,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: GAP,
        transform: `translateX(${translateX}px)`,
        transition: `transform ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1)`,
        flexShrink: 0,
      }}>
        {Array.from({ length: displayedTotal }).map((_, i) => {
          const size = sizes[i];
          const isRemoving = i >= total;
          return (
            <DotSlot
              key={i}
              size={size}
              isRemoving={isRemoving}
              visible={visible}
              onClick={() => onGoTo(i)}
              label={`Slide ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface DotSlotProps {
  size: number;
  isRemoving: boolean;
  visible: boolean;
  onClick: () => void;
  label: string;
}

/**
 * Einzelner Dot-Slot mit Scale-Animation.
 * Mount: startet bei scale(0) und wächst zu scale(1) via rAF-Flip.
 * Unmount-Vorbereitung (isRemoving=true): scale(0), width-Transition auf 0.
 * Wenn visible=false: scale(0) — Dot schrumpft auf der Stelle zu 0.
 */
function DotSlot({ size, isRemoving, visible, onClick, label }: DotSlotProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const scale = isRemoving || !visible ? 0 : (mounted ? 1 : 0);
  // Wenn removing: Slot-Breite schrumpft zu 0 (entfernt Layout-Platz).
  // Bei !visible: Slot behält Layout-Breite (Container bleibt stabil), nur
  // der Dot skaliert auf der Stelle zu 0.
  const renderedWidth = isRemoving ? 0 : size;

  return (
    <div
      style={{
        width: renderedWidth,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: `width ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1), height ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1)`,
      }}
    >
      <button
        className="slider-nav-dot"
        onClick={onClick}
        aria-label={label}
        style={{
          width: size,
          height: size,
          padding: 0,
          border: "none",
          cursor: "pointer",
          borderRadius: "50%",
          background: "var(--color-text-primary)",
          transform: `scale(${scale})`,
          transition: `width ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1), height ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1), transform ${TRANSITION_MS}ms cubic-bezier(.4,0,.2,1)`,
          flexShrink: 0,
        }}
      />
    </div>
  );
}
