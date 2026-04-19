"use client";
import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

/* ── Constants ──────────────────────────────────── */

const PILL_H = 32;
const PILL_R = 0;
const PILL_BG = "var(--color-text-primary, #334a27)";
const PILL_PX = 20; // horizontal padding

// Velocity-Schwelle (Δ scrollProgress pro ms): unter LOW fadet die Pill an
// den Button unter der Maus wieder ein; darüber bleibt sie ausgefadet.
const LOW_VEL_THRESHOLD = 0.0001;
const VELOCITY_EMA = 0.3; // Glättungsfaktor gegen Jitter
const FADE_DURATION = 0.2; // Fade-out bei Drag-Start, Fade-in bei LOW-Momentum

// Snap-Delay zwischen Mode-Wechsel (null↔active) und Snap-to-Active-Bloom
const MODE_CHANGE_SNAP_DELAY = 720;

/* ── Types ──────────────────────────────────────── */

export interface SliderPillItem {
  name: string;
  slug: string;
}

export interface SliderSlideStyle {
  opacity: number;
  scale: number;
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
  /**
   * Fade-/Scale-Styles pro Slide (inkl. Spacer an [0] und [length-1]).
   * Wenn gesetzt, fadet die Pill via `doHide` sobald opacity der aktuell
   * angesteuerten Card < 1.0 wird.
   */
  slideStyles?: SliderSlideStyle[];
}

/* ── Hook ───────────────────────────────────────── */

export function useSliderPill({
  items,
  emblaApi,
  isActiveMode,
  titleWidths,
  gap,
  spacerExpanded,
  hasLens = true,
  activeIndex = null,
  slideStyles,
}: UseSliderPillOptions) {
  const pillRef = useRef<HTMLDivElement>(null);
  const pillBodyRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLElement[]>([]);

  const pillVisible = useRef(false);
  const isDragging = useRef(false);
  const lastHoveredIdx = useRef(-1);
  const lastPillX = useRef(0);
  const scrollAtDown = useRef(0);
  const lastClientX = useRef<number | null>(null);
  const isMouseInside = useRef(false);

  // Velocity-Tracking (Embla feuert `scroll` pro Frame der internen Animation)
  const velocityRef = useRef(0);
  const lastProgressRef = useRef(0);
  const lastScrollTimeRef = useRef(0);

  // True während ein Hover-Slide-Tween auf x/width läuft. Wird in settleOnTarget
  // geprüft, damit der onScroll-Sync den Slide nicht instant auf Ziel setzt.
  // Nicht via gsap.isTweening(), weil das auch auf den Opacity-Fade-In-Tween
  // anschlagen würde — während dessen soll die Position sehr wohl gesynct werden.
  const isSlideActive = useRef(false);

  // Aktuelle slideStyles über Ref lesen, ohne onScroll-Effekt neu aufzubauen
  const slideStylesRef = useRef<SliderSlideStyle[] | undefined>(slideStyles);
  useEffect(() => {
    slideStylesRef.current = slideStyles;
  }, [slideStyles]);

  /* ── Helpers ── */

  const getDuration = useCallback((targetX: number, base: number) => {
    const dist = Math.abs(targetX - lastPillX.current);
    return base + Math.min(dist / 300, 1) * 0.15;
  }, []);

  /**
   * Scroll-Offset = wie weit der Embla-Container relativ zum Viewport nach
   * links verschoben ist (positiv = nach links gescrollt).
   * Robuster als Regex auf style.transform: liest direkt das Rect.
   */
  const getScrollOffset = useCallback(() => {
    if (!emblaApi) return 0;
    const viewport = emblaApi.rootNode() as HTMLElement | null;
    const container = emblaApi.containerNode() as HTMLElement | null;
    if (!viewport || !container) return 0;
    return viewport.getBoundingClientRect().left - container.getBoundingClientRect().left;
  }, [emblaApi]);

  /** Card position + size in wrapper-space (= viewport-space) */
  const getCardVX = useCallback((cardEl: HTMLElement) => {
    if (!emblaApi) return { x: 0, w: 0 };
    const viewport = emblaApi.rootNode() as HTMLElement;
    const vRect = viewport.getBoundingClientRect();
    // Read the SlideCategoryCard's <p> or fall back to the card wrapper
    const inner = cardEl.querySelector("[data-slider-card]") as HTMLElement | null;
    const target = inner || cardEl;
    const tRect = target.getBoundingClientRect();
    return { x: tRect.left - vRect.left - PILL_PX, w: tRect.width + PILL_PX * 2 };
  }, [emblaApi]);

  /** Title vertical center relative to wrapper (= viewport) */
  const getTitleCenter = useCallback((cardEl: HTMLElement) => {
    if (!emblaApi) return 0;
    const viewport = emblaApi.rootNode() as HTMLElement;
    const vTop = viewport.getBoundingClientRect().top;
    const titleEl = cardEl.querySelector("p");
    const target = titleEl || cardEl;
    const tRect = target.getBoundingClientRect();
    return tRect.top + tRect.height / 2 - vTop;
  }, [emblaApi]);

  /* ── Slide animation ── */

  /**
   * @param soft — wenn true: `power3.out` + kürzere Base-Dauer (Momentum-
   * Slide: lange Tweens driften sonst am Ende sichtbar weg, weil die Card
   * während des Tweens mit dem Slider weiterläuft).
   */
  const slideTo = useCallback((targetX: number, targetW: number, soft = false) => {
    if (!pillRef.current) return;
    const d = getDuration(targetX, soft ? 0.15 : 0.4);
    const ease = soft ? "power3.out" : "back.out(1.5)";
    lastPillX.current = targetX;

    // Nur x/width/height killen — einen laufenden Opacity-Fade-In überleben lassen.
    gsap.killTweensOf(pillRef.current, "x,width,height");
    isSlideActive.current = true;
    gsap.to(pillRef.current, {
      x: targetX, width: targetW, height: PILL_H,
      duration: d, ease,
      onComplete: () => { isSlideActive.current = false; },
      onInterrupt: () => { isSlideActive.current = false; },
    });
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.set(line3Ref.current, { opacity: 1, y: 0 });
      gsap.to(line3Ref.current, {
        x: targetX, width: targetW,
        duration: d + 0.04, ease, overwrite: "auto",
      });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.set(line1Ref.current, { opacity: 1, y: 0 });
      gsap.to(line1Ref.current, {
        x: targetX, width: targetW,
        duration: d + 0.08, ease, overwrite: "auto",
      });
    }
  }, [getDuration]);

  /* ── Hide pill ── */

  const doHide = useCallback(() => {
    if (!pillVisible.current || !pillRef.current) return;
    pillVisible.current = false;
    lastHoveredIdx.current = -1;

    gsap.killTweensOf(pillRef.current);
    const px = gsap.getProperty(pillRef.current, "x") as number;
    const pw = gsap.getProperty(pillRef.current, "width") as number;
    const cx = px + pw / 2;

    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, {
        x: cx - 5, width: 10, y: PILL_H / 2 + 6, opacity: 0,
        duration: 0.15, ease: "power3.in",
      });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, {
        x: cx - 5, width: 10, y: PILL_H / 2 + 10, opacity: 0,
        duration: 0.15, ease: "power3.in",
      });
    }
    gsap.to(pillRef.current, {
      x: cx - 5, width: 10, height: 10, opacity: 0, borderRadius: `${PILL_R}px`,
      duration: 0.15, ease: "power3.in",
      onComplete: () => {
        if (pillRef.current) gsap.set(pillRef.current, { scaleX: 1, scaleY: 1, width: 1 });
      },
    });
  }, []);

  /* ── Simple fade-out (für Drag/Swipe) ── */

  const fadeOutPill = useCallback(() => {
    if (!pillRef.current) return;
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, { opacity: 0, duration: FADE_DURATION, ease: "power2.out" });
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, { opacity: 0, duration: FADE_DURATION, ease: "power2.out" });
    }
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, { opacity: 0, duration: FADE_DURATION, ease: "power2.out" });
    }
    pillVisible.current = false;
    lastHoveredIdx.current = -1;
  }, []);

  /* ── Simple fade-in an Card-Position (für niedriges Momentum / pointerUp) ── */

  const fadeInPillAt = useCallback((cardEl: HTMLElement) => {
    if (!pillRef.current || !emblaApi) return;
    const { x, w } = getCardVX(cardEl);
    const top = getTitleCenter(cardEl);
    const l3Top = top - PILL_H / 2 - 6;
    const l1Top = top - PILL_H / 2 - 10;

    gsap.killTweensOf(pillRef.current);
    if (line1Ref.current) gsap.killTweensOf(line1Ref.current);
    if (line3Ref.current) gsap.killTweensOf(line3Ref.current);

    // Position instant setzen — kein Slide, kein Bloom, nur Fade-In.
    gsap.set(pillRef.current, {
      left: 0, top, x, width: w, height: PILL_H,
      scaleX: 1, scaleY: 1, borderRadius: `${PILL_R}px`,
    });
    if (line3Ref.current) gsap.set(line3Ref.current, { top: l3Top, x, width: w, y: 0 });
    if (line1Ref.current) gsap.set(line1Ref.current, { top: l1Top, x, width: w, y: 0 });
    if (pillBodyRef.current) gsap.set(pillBodyRef.current, { background: PILL_BG });
    if (line1Ref.current) gsap.set(line1Ref.current, { background: PILL_BG });
    if (line3Ref.current) gsap.set(line3Ref.current, { background: PILL_BG });
    if (lensRef.current) {
      lensRef.current.querySelectorAll("span").forEach((s) => gsap.set(s, { color: "#fff" }));
    }

    lastPillX.current = x;
    pillVisible.current = true;

    gsap.to(pillRef.current, { opacity: 1, duration: FADE_DURATION, ease: "power2.out" });
    if (line1Ref.current) gsap.to(line1Ref.current, { opacity: 1, duration: FADE_DURATION, ease: "power2.out" });
    if (line3Ref.current) gsap.to(line3Ref.current, { opacity: 1, duration: FADE_DURATION, ease: "power2.out" });
  }, [emblaApi, getCardVX, getTitleCenter]);

  /* ── Move pill to card — viewport-space ── */

  const movePillTo = useCallback((cardEl: HTMLElement, soft = false) => {
    if (!pillRef.current || !emblaApi) return;
    const { x, w } = getCardVX(cardEl);
    const top = getTitleCenter(cardEl);
    const l3Top = top - PILL_H / 2 - 6;
    const l1Top = top - PILL_H / 2 - 10;

    if (!pillVisible.current) {
      // ── Bloom from center ──
      pillVisible.current = true;
      const cx = x + w / 2;

      gsap.killTweensOf(pillRef.current);
      if (line3Ref.current) gsap.killTweensOf(line3Ref.current);
      if (line1Ref.current) gsap.killTweensOf(line1Ref.current);
      gsap.set(pillRef.current, {
        left: 0, top, x: cx - 5, width: 10, height: 10,
        scaleX: 1, scaleY: 1, borderRadius: `${PILL_R}px`, opacity: 1,
      });
      if (line3Ref.current) gsap.set(line3Ref.current, { top: l3Top, x: cx - 5, width: 10, y: PILL_H / 2 + 6, opacity: 1 });
      if (line1Ref.current) gsap.set(line1Ref.current, { top: l1Top, x: cx - 5, width: 10, y: PILL_H / 2 + 10, opacity: 1 });
      lastPillX.current = x;

      // Colors
      if (pillBodyRef.current) gsap.set(pillBodyRef.current, { background: PILL_BG });
      if (line1Ref.current) gsap.set(line1Ref.current, { background: PILL_BG });
      if (line3Ref.current) gsap.set(line3Ref.current, { background: PILL_BG });
      if (lensRef.current) {
        lensRef.current.querySelectorAll("span").forEach((s) => gsap.set(s, { color: "#fff" }));
      }

      // Bloom
      gsap.to(pillRef.current, { x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`, duration: 0.15, ease: "power2.out" });
      if (line3Ref.current) gsap.to(line3Ref.current, { x, width: w, y: 0, duration: 0.15, ease: "power2.out" });
      if (line1Ref.current) gsap.to(line1Ref.current, { x, width: w, y: 0, duration: 0.15, ease: "power2.out" });
      return;
    }

    // ── Slide to new card ──
    gsap.set(pillRef.current, { top });
    if (line3Ref.current) gsap.set(line3Ref.current, { top: l3Top });
    if (line1Ref.current) gsap.set(line1Ref.current, { top: l1Top });
    slideTo(x, w, soft);
  }, [emblaApi, getCardVX, getTitleCenter, slideTo]);

  /* ── Drag detection — differentiates click vs drag ── */

  useEffect(() => {
    if (!emblaApi) return;

    const onDown = () => {
      scrollAtDown.current = emblaApi.scrollProgress();
      isDragging.current = true;
      lastProgressRef.current = scrollAtDown.current;
      lastScrollTimeRef.current = performance.now();
      velocityRef.current = 0;
      // Drag/Swipe-Start → Pill ausfaden (0.2s).
      fadeOutPill();
    };

    /** Card unter der Maus finden, sonst auf activeIndex zurückfallen. */
    const findTarget = (): { card: HTMLElement; idx: number } | null => {
      if (!isActiveMode) return null;
      if (isMouseInside.current && lastClientX.current !== null) {
        const viewport = emblaApi.rootNode() as HTMLElement | null;
        if (viewport) {
          const vRect = viewport.getBoundingClientRect();
          const mouseXViewport = lastClientX.current - vRect.left;
          const cards = cardRefs.current.filter(Boolean);
          const mouseXScroll = mouseXViewport + getScrollOffset();
          for (let i = 0; i < cards.length; i++) {
            const cLeft = cards[i].offsetLeft;
            const cRight = cLeft + cards[i].offsetWidth;
            let zoneEnd = cRight;
            if (i < cards.length - 1) zoneEnd = (cRight + cards[i + 1].offsetLeft) / 2;
            if (mouseXScroll <= zoneEnd || i === cards.length - 1) {
              return { card: cards[i], idx: i };
            }
          }
        }
      }
      if (activeIndex !== null && activeIndex !== undefined) {
        const card = cardRefs.current[activeIndex];
        if (card) return { card, idx: activeIndex };
      }
      return null;
    };

    /** Pill an die Card-Position syncen (instant). */
    const syncPillToCard = (cardEl: HTMLElement) => {
      const { x, w } = getCardVX(cardEl);
      gsap.set(pillRef.current, { x, width: w });
      if (line3Ref.current) gsap.set(line3Ref.current, { x, width: w });
      if (line1Ref.current) gsap.set(line1Ref.current, { x, width: w });
      lastPillX.current = x;
    };

    /** Pill an Target bringen: Fade-In wenn unsichtbar, sonst Live-Sync. */
    const settleOnTarget = () => {
      const hit = findTarget();
      if (!hit) return;
      const cardStyle = slideStylesRef.current?.[hit.idx + 1];
      if (cardStyle && cardStyle.opacity < 1.0) {
        if (pillVisible.current) fadeOutPill();
        return;
      }
      lastHoveredIdx.current = hit.idx;
      if (!pillVisible.current) {
        fadeInPillAt(hit.card);
      } else if (!isSlideActive.current) {
        // Nur syncen wenn kein Hover-Slide auf x/width läuft. Ein laufender
        // Opacity-Fade-In ist OK — da soll die Position weiter live mit der
        // driftenden Card mitgehen, damit am Fade-In-Ende kein Sprung kommt.
        syncPillToCard(hit.card);
      }
    };

    const onUp = () => {
      isDragging.current = false;
      // Fade-In übernimmt der onScroll-Handler bei vel < LOW bzw. onSettle.
    };

    const onScroll = () => {
      // Velocity pro ms (EMA-geglättet)
      const now = performance.now();
      const progress = emblaApi.scrollProgress();
      const dt = Math.max(1, now - lastScrollTimeRef.current);
      const rawVel = Math.abs(progress - lastProgressRef.current) / dt;
      velocityRef.current = velocityRef.current * (1 - VELOCITY_EMA) + rawVel * VELOCITY_EMA;
      lastProgressRef.current = progress;
      lastScrollTimeRef.current = now;
      const vel = velocityRef.current;

      // Während Drag oder schnellem Momentum: Pill bleibt ausgefadet, nichts tun.
      if (isDragging.current) return;
      if (vel >= LOW_VEL_THRESHOLD) return;

      // Momentum unter LOW-Schwelle → Pill an Button unter Maus einfaden oder
      // (falls schon sichtbar) sticky an die live-Position der Card syncen.
      settleOnTarget();
    };

    const onSettle = () => {
      isDragging.current = false;
      velocityRef.current = 0;
      settleOnTarget();
    };

    emblaApi.on("pointerDown", onDown);
    emblaApi.on("pointerUp", onUp);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("settle", onSettle);
    return () => {
      emblaApi.off("pointerDown", onDown);
      emblaApi.off("pointerUp", onUp);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("settle", onSettle);
    };
  }, [emblaApi, doHide, isActiveMode, getScrollOffset, getCardVX, movePillTo, activeIndex, fadeOutPill, fadeInPillAt]);

  /* ── Mode change → hide pill + snap to active (lock handled by SubcategorySlider's morphLock) ── */

  /* ── Snap pill to active card (button-mode) ── */

  const snapToActive = useCallback(() => {
    if (activeIndex === null || activeIndex === undefined) return;
    const card = cardRefs.current[activeIndex];
    if (!card) return;
    movePillTo(card);
    lastHoveredIdx.current = activeIndex;
  }, [activeIndex, movePillTo]);

  const prevActiveIndex = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevActiveIndex.current;
    const curr = activeIndex ?? null;
    prevActiveIndex.current = curr;

    // Active → Active: Pill bleibt sichtbar und slidet smooth zur neuen Card
    // Kein transitionLock → handleContainerMove (Hover) bleibt aktiv
    if (prev !== null && curr !== null && prev !== curr) {
      const card = cardRefs.current[curr];
      if (card) {
        movePillTo(card);
        lastHoveredIdx.current = curr;
      }
      return;
    }

    // Mode change (null↔active): instant hide + optional snap+bloom
    gsap.killTweensOf(pillRef.current);
    if (line1Ref.current) gsap.killTweensOf(line1Ref.current);
    if (line3Ref.current) gsap.killTweensOf(line3Ref.current);
    if (pillRef.current) gsap.set(pillRef.current, { opacity: 0, width: 1 });
    if (line1Ref.current) gsap.set(line1Ref.current, { opacity: 0, width: 1 });
    if (line3Ref.current) gsap.set(line3Ref.current, { opacity: 0, width: 1 });
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
      // Früher Guard: Lens ist unsichtbar wenn Pill nicht visible ist —
      // spart ~60 Frames/s bei idle.
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
    isMouseInside.current = true;
    lastClientX.current = e.clientX;
    if (isDragging.current || !isActiveMode) return;
    // Während Momentum (Velocity >= LOW) darf Hover die Pill NICHT bewegen —
    // sonst startet slideTo auf eine Zielposition, die durch weiterlaufendes
    // Scrollen veraltet, und der Lens-Text „rutscht" beim Ankommen ins Bild.
    // Der onScroll-Handler übernimmt das Targeting, sobald Velocity unter LOW fällt.
    if (velocityRef.current >= LOW_VEL_THRESHOLD) return;

    const viewportRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseXViewport = e.clientX - viewportRect.left;
    const scrollOffset = getScrollOffset();
    const mouseXScroll = mouseXViewport + scrollOffset;

    const cards = cardRefs.current.filter(Boolean);
    if (cards.length === 0) return;

    const first = cards[0];
    const last = cards[cards.length - 1];
    if (mouseXScroll < first.offsetLeft || mouseXScroll > last.offsetLeft + last.offsetWidth) {
      if (activeIndex !== null && activeIndex !== undefined) {
        const card = cardRefs.current[activeIndex];
        if (card && lastHoveredIdx.current !== activeIndex) {
          lastHoveredIdx.current = activeIndex;
          movePillTo(card);
        }
      } else {
        doHide();
      }
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      const cLeft = cards[i].offsetLeft;
      const cRight = cLeft + cards[i].offsetWidth;
      let zoneEnd = cRight;
      if (i < cards.length - 1) {
        zoneEnd = (cRight + cards[i + 1].offsetLeft) / 2;
      }
      if (mouseXScroll <= zoneEnd || i === cards.length - 1) {
        if (i !== lastHoveredIdx.current) {
          lastHoveredIdx.current = i;
          movePillTo(cards[i]);
        }
        return;
      }
    }
  }, [getScrollOffset, movePillTo, doHide, isActiveMode, activeIndex]);

  const handleContainerLeave = useCallback(() => {
    isMouseInside.current = false;
    lastClientX.current = null;
    if (activeIndex !== null && activeIndex !== undefined) {
      // Snap back to active button instead of hiding
      const card = cardRefs.current[activeIndex];
      if (card) {
        movePillTo(card);
        lastHoveredIdx.current = activeIndex;
        return;
      }
    }
    doHide();
  }, [doHide, activeIndex, movePillTo]);

  /* ── Render pill (overlay outside viewport, overflow visible for lines) ── */

  const renderPill = useCallback(() => {
    const spacerLeft = spacerExpanded ? "calc(5vw + 23px)" : "5vw";

    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 4 }}>
        {/* 2px line */}
        <div
          ref={(el) => { (line1Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
          style={{ position: "absolute", top: 0, left: 0, height: "2px", width: "1px", opacity: 0, background: PILL_BG, pointerEvents: "none" }}
        />
        {/* 4px line */}
        <div
          ref={(el) => { (line3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
          style={{ position: "absolute", top: 0, left: 0, height: "4px", width: "1px", opacity: 0, background: PILL_BG, pointerEvents: "none" }}
        />
        {/* Pill */}
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
                {/* Leading spacer + gap (matches scroll container: spacer [gap] card) */}
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
                {/* Trailing gap + spacer */}
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
