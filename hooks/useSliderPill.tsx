"use client";
import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

/* ── Constants ──────────────────────────────────── */

const PILL_H = 32;
const PILL_R = 0;
const PILL_BG = "var(--color-text-primary, #334a27)";
const PILL_PX = 20;

// Zusätzliche Breite für X-Icon im aktiven Button/Pill-Slot
export const X_EXTRA = 20; // 12px icon + 4px margin + 4px Luft rechts

// Snap-Delay zwischen Mode-Wechsel (null↔active) und Snap-to-Active
const MODE_CHANGE_SNAP_DELAY = 720;

/* ── Types ──────────────────────────────────────── */

export interface SliderPillItem {
  name: string;
  slug: string;
}

export interface UseSliderPillOptions {
  items: SliderPillItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emblaApi: any;
  isActiveMode: boolean;
  titleWidths: number[];
  gap: number;
  spacerExpanded: boolean;
  hasLens?: boolean;
  activeIndex?: number | null;
  slideStylesRef?: React.RefObject<{ opacity: number; scale: number; origin: 'left' | 'right' | 'center' }[]>;
  onClose?: () => void;
}

/* ── Hook ───────────────────────────────────────── */

/**
 * Clean Hover-Pill für den Category-Slider (Button-Mode).
 * Keine drag/momentum/fade-Effekte — einfach:
 * - Hover: Pill folgt Card unter Mauszeiger (smooth slide).
 * - MouseLeave: Pill snapt zum active Button (oder fadet aus).
 * - Scroll: Pill folgt der Card-Position (live sync).
 * - Mode-Change: Pill hide + snap to active.
 */
export function useSliderPill({
  items,
  emblaApi,
  isActiveMode,
  titleWidths,
  gap,
  spacerExpanded,
  hasLens = true,
  activeIndex = null,
  slideStylesRef,
  onClose,
}: UseSliderPillOptions) {
  const pillRef = useRef<HTMLDivElement>(null);
  const pillBodyRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLElement[]>([]);

  const pillVisible = useRef(false);
  const lastHoveredIdx = useRef(-1);

  /* ── Helpers ── */

  const getScrollOffset = useCallback(() => {
    if (!emblaApi) return 0;
    const viewport = emblaApi.rootNode() as HTMLElement | null;
    const container = emblaApi.containerNode() as HTMLElement | null;
    if (!viewport || !container) return 0;
    return viewport.getBoundingClientRect().left - container.getBoundingClientRect().left;
  }, [emblaApi]);

  const getCardVX = useCallback((cardEl: HTMLElement) => {
    if (!emblaApi) return { x: 0, w: 0 };
    const viewport = emblaApi.rootNode() as HTMLElement;
    const vRect = viewport.getBoundingClientRect();
    const inner = cardEl.querySelector("[data-slider-card]") as HTMLElement | null;
    const target = inner || cardEl;
    const tRect = target.getBoundingClientRect();
    return { x: tRect.left - vRect.left - PILL_PX, w: tRect.width + PILL_PX * 2 };
  }, [emblaApi]);

  const getTitleCenter = useCallback((cardEl: HTMLElement) => {
    if (!emblaApi) return 0;
    const viewport = emblaApi.rootNode() as HTMLElement;
    const vTop = viewport.getBoundingClientRect().top;
    const titleEl = cardEl.querySelector("p");
    const target = titleEl || cardEl;
    const tRect = target.getBoundingClientRect();
    return tRect.top + tRect.height / 2 - vTop;
  }, [emblaApi]);

  /* ── Pill movement ── */

  const movePillTo = useCallback((cardEl: HTMLElement, overrideW?: number, overrideX?: number) => {
    if (!pillRef.current || !emblaApi) return;
    const { x: measuredX, w: measuredW } = getCardVX(cardEl);
    const x = overrideX ?? measuredX;
    const w = overrideW ?? measuredW;
    const top = getTitleCenter(cardEl);
    const l3Top = top - PILL_H / 2 - 6;
    const l1Top = top - PILL_H / 2 - 10;

    if (!pillVisible.current) {
      // Fade-in an der Card-Position
      gsap.killTweensOf(pillRef.current);
      gsap.set(pillRef.current, { top, x, width: w, height: PILL_H, opacity: 0, scale: 1 });
      gsap.to(pillRef.current, { opacity: 1, duration: 0.2, ease: "power2.out" });
      if (line1Ref.current) {
        gsap.killTweensOf(line1Ref.current);
        gsap.set(line1Ref.current, { top: l1Top, x, width: w, opacity: 0, scale: 1 });
        gsap.to(line1Ref.current, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }
      if (line3Ref.current) {
        gsap.killTweensOf(line3Ref.current);
        gsap.set(line3Ref.current, { top: l3Top, x, width: w, opacity: 0, scale: 1 });
        gsap.to(line3Ref.current, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }
      pillVisible.current = true;
      return;
    }

    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      top, x, width: w, height: PILL_H, opacity: 1, scale: 1,
      duration: 0.7, ease: "back.out(1.5)",
    });
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, { top: l1Top, x, width: w, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" });
    }
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, { top: l3Top, x, width: w, opacity: 1, scale: 1, duration: 0.75, ease: "back.out(1.5)" });
    }
  }, [emblaApi, getCardVX, getTitleCenter]);


  /** Bloom: Pill erscheint mit Scale-Pop an Ziel-Position. Für Mode-Change-Snap. */
  const bloomPillAt = useCallback((cardEl: HTMLElement) => {
    if (!pillRef.current || !emblaApi) return;
    const { x, w } = getCardVX(cardEl);
    const top = getTitleCenter(cardEl);
    const l3Top = top - PILL_H / 2 - 6;
    const l1Top = top - PILL_H / 2 - 10;

    gsap.killTweensOf(pillRef.current);
    gsap.set(pillRef.current, { top, x, width: w, height: PILL_H, opacity: 0, scale: 0.5, transformOrigin: "center center" });
    gsap.to(pillRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)" });

    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.set(line1Ref.current, { top: l1Top, x, width: w, opacity: 0, scale: 0.5, transformOrigin: "center center" });
      gsap.to(line1Ref.current, { opacity: 1, scale: 1, duration: 0.5, delay: 0.08, ease: "back.out(2.2)" });
    }
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.set(line3Ref.current, { top: l3Top, x, width: w, opacity: 0, scale: 0.5, transformOrigin: "center center" });
      gsap.to(line3Ref.current, { opacity: 1, scale: 1, duration: 0.5, delay: 0.04, ease: "back.out(2.2)" });
    }
    pillVisible.current = true;
  }, [emblaApi, getCardVX, getTitleCenter]);

  /* ── Follow card on scroll (live sync) ── */

  useEffect(() => {
    if (!emblaApi) return;
    const onScroll = () => {
      if (!pillVisible.current) return;
      // Laufende movePillTo-Tween nicht unterbrechen (verhindert Wackeln nach Drag)
      if (gsap.isTweening(pillRef.current)) return;
      const idx = lastHoveredIdx.current;
      if (idx < 0) return;
      const card = cardRefs.current[idx];
      if (!card || !pillRef.current) return;

      const { x: bxPill, w: bwPill } = getCardVX(card); // BCR-Werte (bereits durch CSS-scale beeinflusst)
      const bx = bxPill + PILL_PX;       // card.left relativ zum Viewport
      const bw = bwPill - PILL_PX * 2;  // card.width aus BCR

      const edgeStyle = slideStylesRef?.current?.[idx + 1];
      const edgeOpacity = edgeStyle?.opacity ?? 1;
      const edgeScale  = edgeStyle?.scale  ?? 1;
      const edgeOrigin = edgeStyle?.origin ?? 'center';
      const xOrig = edgeOrigin === 'right' ? '100%' : edgeOrigin === 'left' ? '0%' : '50%';

      // Natürliche (unscalierte) Pill-Breite: BCR-Cardbreite durch edgeScale teilen
      const naturalW = (edgeScale > 0 ? bw / edgeScale : bw) + PILL_PX * 2;

      // Natürliches x je nach Transform-Origin des Buttons
      let naturalX: number;
      if (edgeOrigin === 'right') {
        // Rechter Kartenrand ist fest → natural left = card_right - naturalCardW
        const naturalCardW = edgeScale > 0 ? bw / edgeScale : bw;
        naturalX = bx + bw - naturalCardW - PILL_PX;
      } else if (edgeOrigin === 'left') {
        // Linker Kartenrand ist fest
        naturalX = bx - PILL_PX;
      } else {
        // Mitte fest
        const naturalCardW = edgeScale > 0 ? bw / edgeScale : bw;
        naturalX = bx + (bw - naturalCardW) / 2 - PILL_PX;
      }

      gsap.set(pillRef.current,  { transformOrigin: `${xOrig} 50%`,                    x: naturalX, width: naturalW, opacity: edgeOpacity, scale: edgeScale });
      if (line1Ref.current) gsap.set(line1Ref.current, { transformOrigin: `${xOrig} ${PILL_H / 2 + 10}px`, x: naturalX, width: naturalW, opacity: edgeOpacity, scale: edgeScale });
      if (line3Ref.current) gsap.set(line3Ref.current, { transformOrigin: `${xOrig} ${PILL_H / 2 + 6}px`,  x: naturalX, width: naturalW, opacity: edgeOpacity, scale: edgeScale });
    };
    emblaApi.on("scroll", onScroll);
    return () => emblaApi.off("scroll", onScroll);
  }, [emblaApi, getCardVX, slideStylesRef]);

  /* ── Mode change / active index change ── */

  const snapToActive = useCallback(() => {
    if (activeIndex === null || activeIndex === undefined) return;
    const card = cardRefs.current[activeIndex];
    if (!card) return;
    bloomPillAt(card);
    lastHoveredIdx.current = activeIndex;
  }, [activeIndex, bloomPillAt]);

  const prevActiveIndex = useRef<number | null>(null);
  useEffect(() => {
    const prev = prevActiveIndex.current;
    const curr = activeIndex ?? null;
    prevActiveIndex.current = curr;

    // Active → Active: smooth slide zu finalem x/w
    // finalX: prev schrumpft → curr (wenn rechts davon) verschiebt sich um -X_EXTRA
    // finalW: curr wächst auf titleWidths[curr] + X_EXTRA
    if (prev !== null && curr !== null && prev !== curr) {
      const card = cardRefs.current[curr];
      if (card) {
        const { x: rawX } = getCardVX(card);
        const xAdjust = prev < curr ? -X_EXTRA : 0;
        const finalX = rawX + xAdjust;
        const finalW = (titleWidths[curr] || 80) + X_EXTRA + PILL_PX * 2;
        movePillTo(card, finalW, finalX);
        lastHoveredIdx.current = curr;
      }
      return;
    }

    // Mode change (null↔active): Pill + beide Linien instant hide,
    // dann beim Open nach Delay Bloom auf active Button.
    if (pillRef.current) {
      gsap.killTweensOf(pillRef.current);
      gsap.set(pillRef.current, { opacity: 0, width: 1, scale: 1 });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.set(line1Ref.current, { opacity: 0, width: 1, scale: 1 });
    }
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.set(line3Ref.current, { opacity: 0, width: 1, scale: 1 });
    }
    pillVisible.current = false;
    lastHoveredIdx.current = -1;

    const tSnap = curr !== null ? setTimeout(snapToActive, MODE_CHANGE_SNAP_DELAY) : null;
    return () => {
      if (tSnap) clearTimeout(tSnap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveMode, activeIndex]);

  /* ── Lens sync (scroll-offset aware) ── */

  useEffect(() => {
    const sync = () => {
      if (!pillVisible.current) return;
      if (!pillRef.current || !lensRef.current) return;
      const px = gsap.getProperty(pillRef.current, "x") as number;
      const pw = gsap.getProperty(pillRef.current, "width") as number;
      const scrollOff = getScrollOffset();
      gsap.set(lensRef.current, { x: -(px + scrollOff) });
      lensRef.current.style.transformOrigin = `${px + scrollOff + pw / 2}px center`;
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, [getScrollOffset]);

  /* ── Mouse handlers ── */

  // Pill bleibt fest am aktiven Button — kein Cursor-Tracking mehr.
  const handleContainerMove = useCallback((_e: React.MouseEvent) => {}, []);
  const handleContainerLeave = useCallback(() => {}, []);

  /* ── Render ── */

  const renderPill = useCallback(() => {
    const spacerLeft = spacerExpanded ? "calc(5vw + 23px)" : "5vw";

    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 4 }}>
        {/* 2px Strich (höher) — transformOrigin auf Pill-Mittelpunkt, damit scale korrekt */}
        <div
          ref={(el) => {
            line1Ref.current = el;
            if (el) gsap.set(el, { transformOrigin: `50% ${PILL_H / 2 + 10}px` });
          }}
          style={{ position: "absolute", top: 0, left: 0, height: "2px", width: "1px", opacity: 0, background: PILL_BG, pointerEvents: "none" }}
        />
        {/* 4px Strich (näher an Pill) — transformOrigin auf Pill-Mittelpunkt */}
        <div
          ref={(el) => {
            line3Ref.current = el;
            if (el) gsap.set(el, { transformOrigin: `50% ${PILL_H / 2 + 6}px` });
          }}
          style={{ position: "absolute", top: 0, left: 0, height: "4px", width: "1px", opacity: 0, background: PILL_BG, pointerEvents: "none" }}
        />
        <div
          ref={(el) => {
            pillRef.current = el;
            if (el) gsap.set(el, { yPercent: -50 });
          }}
          style={{ position: "absolute", top: 0, left: 0, height: `${PILL_H}px`, width: "1px", opacity: 0, borderRadius: `${PILL_R}px`, pointerEvents: "none" }}
        >
          <div
            ref={(el) => { pillBodyRef.current = el; }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: `${PILL_R}px`, overflow: "hidden", background: PILL_BG }}
          >
            {hasLens && (
              <div
                ref={(el) => {
                  lensRef.current = el;
                  if (el) gsap.set(el, { y: "-50%", scale: 1.1 });
                }}
                style={{ position: "absolute", top: "50%", left: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}
              >
                <div style={{ flex: `0 0 calc(${spacerLeft} + ${gap}px)`, minWidth: 0 }} />
                {items.map((item, i) => (
                  <React.Fragment key={item.slug}>
                    <span style={{
                      flex: `0 0 ${(i === activeIndex ? (titleWidths[i] || 80) + X_EXTRA : titleWidths[i] || 80)}px`,
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      fontSize: "16px", fontWeight: 600, color: "#ffffff",
                      whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.name}
                      {i === activeIndex && (
                        <button
                          type="button"
                          aria-label="Kategorie schließen"
                          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                          style={{
                            marginLeft: 4,
                            background: "none", border: "none", padding: 0,
                            cursor: "pointer", pointerEvents: "auto",
                            display: "flex", alignItems: "center",
                            color: "#ffffff", opacity: 0.8, lineHeight: 0,
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                            <path d="M1 1L10 10M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </span>
                    {i < items.length - 1 && (
                      <div style={{ flex: `0 0 ${gap}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden>
                          <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="#ffffff"/>
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                <div style={{ flex: `0 0 calc(${spacerExpanded ? "18vw" : "5vw"} + ${gap}px)`, minWidth: 0 }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [items, hasLens, titleWidths, gap, spacerExpanded, activeIndex, onClose]);

  return {
    pillRef, lensRef, cardRefs,
    renderPill, handleContainerMove, handleContainerLeave,
    PILL_H,
  };
}
