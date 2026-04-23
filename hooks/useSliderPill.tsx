"use client";
import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

/* ── Constants ──────────────────────────────────── */

const PILL_H = 32;
const PILL_R = 0;
const PILL_BG = "var(--color-text-primary, #334a27)";
const PILL_PX = 20;

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

  const movePillTo = useCallback((cardEl: HTMLElement) => {
    if (!pillRef.current || !emblaApi) return;
    const { x, w } = getCardVX(cardEl);
    const top = getTitleCenter(cardEl);
    const l3Top = top - PILL_H / 2 - 6;
    const l1Top = top - PILL_H / 2 - 10;

    if (!pillVisible.current) {
      // Fade-in an der Card-Position
      gsap.killTweensOf(pillRef.current);
      gsap.set(pillRef.current, { top, x, width: w, height: PILL_H, opacity: 0 });
      gsap.to(pillRef.current, { opacity: 1, duration: 0.2, ease: "power2.out" });
      if (line1Ref.current) {
        gsap.killTweensOf(line1Ref.current);
        gsap.set(line1Ref.current, { top: l1Top, x, width: w, opacity: 0 });
        gsap.to(line1Ref.current, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }
      if (line3Ref.current) {
        gsap.killTweensOf(line3Ref.current);
        gsap.set(line3Ref.current, { top: l3Top, x, width: w, opacity: 0 });
        gsap.to(line3Ref.current, { opacity: 1, duration: 0.2, ease: "power2.out" });
      }
      pillVisible.current = true;
      return;
    }

    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      top, x, width: w, height: PILL_H, opacity: 1, scale: 1,
      duration: 0.35, ease: "back.out(1.5)",
    });
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, { top: l1Top, x, width: w, opacity: 1, scale: 1, duration: 0.43, ease: "back.out(1.5)" });
    }
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, { top: l3Top, x, width: w, opacity: 1, scale: 1, duration: 0.39, ease: "back.out(1.5)" });
    }
  }, [emblaApi, getCardVX, getTitleCenter]);

  const hidePill = useCallback(() => {
    if (!pillRef.current) return;
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, { opacity: 0, duration: 0.2, ease: "power2.out" });
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, { opacity: 0, duration: 0.2, ease: "power2.out" });
    }
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, { opacity: 0, duration: 0.2, ease: "power2.out" });
    }
    pillVisible.current = false;
    lastHoveredIdx.current = -1;
  }, []);

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
      const idx = lastHoveredIdx.current;
      if (idx < 0) return;
      const card = cardRefs.current[idx];
      if (!card || !pillRef.current) return;
      const { x, w } = getCardVX(card);
      gsap.set(pillRef.current, { x, width: w });
      if (line1Ref.current) gsap.set(line1Ref.current, { x, width: w });
      if (line3Ref.current) gsap.set(line3Ref.current, { x, width: w });
    };
    emblaApi.on("scroll", onScroll);
    return () => emblaApi.off("scroll", onScroll);
  }, [emblaApi, getCardVX]);

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

    // Active → Active: smooth slide
    if (prev !== null && curr !== null && prev !== curr) {
      const card = cardRefs.current[curr];
      if (card) {
        movePillTo(card);
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

  const handleContainerMove = useCallback((e: React.MouseEvent) => {
    if (!isActiveMode) return;

    // currentTarget ist der Embla-Container (translated). Sein bounding rect
    // beinhaltet bereits die Translate-Transformation. e.clientX - rect.left
    // ergibt die Maus-Position direkt im Layout-Coord-System (was offsetLeft
    // der Cards benutzt). KEIN scrollOffset addieren — sonst doppelt gezählt.
    const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseXInContainer = e.clientX - containerRect.left;

    const cards = cardRefs.current.filter(Boolean);
    if (cards.length === 0) return;

    const first = cards[0];
    const last = cards[cards.length - 1];

    // Outside range → active Button oder hide
    if (mouseXInContainer < first.offsetLeft || mouseXInContainer > last.offsetLeft + last.offsetWidth) {
      if (activeIndex !== null && activeIndex !== undefined) {
        const card = cardRefs.current[activeIndex];
        if (card && lastHoveredIdx.current !== activeIndex) {
          lastHoveredIdx.current = activeIndex;
          movePillTo(card);
        }
      } else {
        hidePill();
      }
      return;
    }

    // Card unter Cursor finden
    for (let i = 0; i < cards.length; i++) {
      const cLeft = cards[i].offsetLeft;
      const cRight = cLeft + cards[i].offsetWidth;
      let zoneEnd = cRight;
      if (i < cards.length - 1) zoneEnd = (cRight + cards[i + 1].offsetLeft) / 2;
      if (mouseXInContainer <= zoneEnd || i === cards.length - 1) {
        if (i !== lastHoveredIdx.current) {
          lastHoveredIdx.current = i;
          movePillTo(cards[i]);
        }
        return;
      }
    }
  }, [movePillTo, hidePill, isActiveMode, activeIndex]);

  const handleContainerLeave = useCallback(() => {
    if (activeIndex !== null && activeIndex !== undefined) {
      const card = cardRefs.current[activeIndex];
      if (card) {
        movePillTo(card);
        lastHoveredIdx.current = activeIndex;
        return;
      }
    }
    hidePill();
  }, [hidePill, activeIndex, movePillTo]);

  /* ── Render ── */

  const renderPill = useCallback(() => {
    const spacerLeft = spacerExpanded ? "calc(5vw + 23px)" : "5vw";

    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 4 }}>
        {/* 2px Strich (höher) */}
        <div
          ref={(el) => { (line1Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
          style={{ position: "absolute", top: 0, left: 0, height: "2px", width: "1px", opacity: 0, background: PILL_BG, pointerEvents: "none" }}
        />
        {/* 4px Strich (näher an Pill) */}
        <div
          ref={(el) => { (line3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
          style={{ position: "absolute", top: 0, left: 0, height: "4px", width: "1px", opacity: 0, background: PILL_BG, pointerEvents: "none" }}
        />
        <div
          ref={(el) => {
            (pillRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (el) gsap.set(el, { yPercent: -50 });
          }}
          style={{ position: "absolute", top: 0, left: 0, height: `${PILL_H}px`, width: "1px", opacity: 0, borderRadius: `${PILL_R}px`, pointerEvents: "none" }}
        >
          <div
            ref={(el) => { (pillBodyRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: `${PILL_R}px`, overflow: "hidden", background: PILL_BG }}
          >
            {hasLens && (
              <div
                ref={(el) => {
                  (lensRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                  if (el) gsap.set(el, { y: "-50%", scale: 1.1 });
                }}
                style={{ position: "absolute", top: "50%", left: 0, display: "flex", alignItems: "center", pointerEvents: "none" }}
              >
                <div style={{ flex: `0 0 calc(${spacerLeft} + ${gap}px)`, minWidth: 0 }} />
                {items.map((item, i) => (
                  <React.Fragment key={item.slug}>
                    <span style={{
                      flex: `0 0 ${titleWidths[i] || 80}px`,
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      fontSize: "16px", fontWeight: 600, color: "#ffffff",
                      whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.name}
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
  }, [items, hasLens, titleWidths, gap, spacerExpanded]);

  return {
    pillRef, lensRef, cardRefs,
    renderPill, handleContainerMove, handleContainerLeave,
    PILL_H,
  };
}
