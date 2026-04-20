"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useDrag } from "@use-gesture/react";
import { gsap, initGSAP } from "@/lib/gsapConfig";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";
import Spacer from "@/components/ui/Spacer";
import InstagramDots from "@/components/ui/InstagramDots";
import VisualLottie from "@/components/ui/VisualLottie";
import type { PreviewExtras, PreviewTool } from "./ArticlePreviewProvider";
import type { PreviewSliderContext } from "./ArticleSliderContext";

initGSAP();

const TOOL_META: Record<PreviewTool, { label: string; color: string }> = {
  rechner: { label: "Rechner", color: "var(--color-tool-rechner)" },
  vergleich: { label: "Vergleich", color: "var(--color-tool-vergleiche)" },
  checkliste: { label: "Checkliste", color: "var(--color-tool-checklisten)" },
};

const MORPH_DURATION = 0.5;
const MORPH_EASE = "power2.inOut";
const NAV_DURATION = 0.5;
const NAV_EASE = "power2.inOut";
const TEXT_FADE_DURATION = 0.15;
const CARD_TEXT_FADE_DURATION = 0.25;
const PREVIEW_BORDER_RADIUS = 56;
const PREVIEW_PADDING = 40;
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 300;
const IMAGE_RADIUS = 0;
const IMAGE_RADIUS_CSS = `${IMAGE_RADIUS}px`;
const PREVIEW_SHADOW = "0 3px 23px rgba(0, 0, 0, 0.02)";
const SWIPE_THRESHOLD_PX = 60;
const SWIPE_VELOCITY = 0.2;

type Phase = "opening" | "slider" | "closing";

interface Props {
  ctx: PreviewSliderContext;
  currentIndex: number;
  onNavigate: (delta: -1 | 1) => void;
  onGoTo: (index: number) => void;
  onClose: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function measureRectUnscaled(el: HTMLElement): DOMRect {
  const scalable =
    (document.querySelector(".scalable-landing") as HTMLElement | null) ||
    (document.querySelector(".scalable-content") as HTMLElement | null);
  if (!scalable) return el.getBoundingClientRect();
  const origTransform = scalable.style.transform;
  const origFilter = scalable.style.filter;
  scalable.style.transform = "none";
  scalable.style.filter = "none";
  const rect = el.getBoundingClientRect();
  scalable.style.transform = origTransform;
  scalable.style.filter = origFilter;
  return rect;
}

// Restore box to its NATURAL JSX layout (position:absolute inset:0 inside wrapper, with
// white bg, preview radius + shadow). Used at start of morph (to undo leftover morph styles
// before measuring) and on morph complete (so subsequent nav-slider phase has correct layout).
function restoreBoxToNatural(box: HTMLElement) {
  box.style.position = "absolute";
  box.style.top = "0";
  box.style.right = "0";
  box.style.bottom = "0";
  box.style.left = "0";
  box.style.width = "";
  box.style.height = "";
  box.style.margin = "";
  box.style.maxWidth = "";
  box.style.maxHeight = "";
  box.style.overflow = "hidden";
  box.style.zIndex = "";
  box.style.borderRadius = `${PREVIEW_BORDER_RADIUS}px`;
  box.style.backgroundColor = "#ffffff";
  box.style.boxShadow = PREVIEW_SHADOW;
}

function restoreImageToNatural(image: HTMLElement) {
  image.style.position = "absolute";
  image.style.top = `${PREVIEW_PADDING}px`;
  image.style.left = `${PREVIEW_PADDING}px`;
  image.style.right = "";
  image.style.bottom = "";
  image.style.width = `${IMAGE_WIDTH}px`;
  image.style.height = `${IMAGE_HEIGHT}px`;
  image.style.margin = "";
  image.style.zIndex = "";
  image.style.borderRadius = IMAGE_RADIUS_CSS;
  // background / pointerEvents set by JSX — don't touch
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
export default function ArticlePreviewOverlay({ ctx, currentIndex, onNavigate, onGoTo, onClose }: Props) {
  const { posts } = ctx;
  const post = posts[currentIndex];

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  // Per-slide refs (keyed by post slug)
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const infoRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setBoxRef = useCallback((slug: string) => (el: HTMLDivElement | null) => {
    if (el) boxRefs.current.set(slug, el);
    else boxRefs.current.delete(slug);
  }, []);
  const setImageRef = useCallback((slug: string) => (el: HTMLDivElement | null) => {
    if (el) imageRefs.current.set(slug, el);
    else imageRefs.current.delete(slug);
  }, []);
  const setTextRef = useCallback((slug: string) => (el: HTMLDivElement | null) => {
    if (el) textRefs.current.set(slug, el);
    else textRefs.current.delete(slug);
  }, []);
  const setInfoRef = useCallback((slug: string) => (el: HTMLDivElement | null) => {
    if (el) infoRefs.current.set(slug, el);
    else infoRefs.current.delete(slug);
  }, []);

  const isExitingRef = useRef(false);
  const initialIndexRef = useRef(currentIndex);
  const [phase, setPhase] = useState<Phase>("opening");
  const [extrasCache, setExtrasCache] = useState<Record<string, PreviewExtras>>({});

  // ── Side effects + cleanup ────────────────────────────────────────────────
  useEffect(() => {
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadRight;
      window.dispatchEvent(new CustomEvent("menu-closed"));
      // Restore any hidden source cards
      posts.forEach((_, i) => {
        const el = ctx.getCardEl(i);
        if (el) {
          el.style.visibility = "";
          const bgEl = el.querySelector<HTMLElement>("[data-card-image-bg]");
          if (bgEl) bgEl.style.visibility = "";
          const infoEl = el.querySelector<HTMLElement>("[data-card-info]");
          if (infoEl) infoEl.style.visibility = "";
          const textEl = el.querySelector<HTMLElement>("[data-card-text]");
          if (textEl) textEl.style.opacity = "";
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch extras (cached per slug) ────────────────────────────────────────
  const fetchExtras = useCallback((slug: string) => {
    setExtrasCache((prev) => {
      if (prev[slug]) return prev;
      return prev;
    });
    // Fire fetch unconditionally; dedupe via functional set
    fetch(`/api/article-preview?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PreviewExtras | null) => {
        if (!data) return;
        setExtrasCache((prev) => (prev[slug] ? prev : { ...prev, [slug]: data }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!post) return;
    fetchExtras(post.slug);
    const prev = posts[currentIndex - 1];
    const next = posts[currentIndex + 1];
    if (prev) fetchExtras(prev.slug);
    if (next) fetchExtras(next.slug);
  }, [post, currentIndex, posts, fetchExtras]);

  // ── Initial track position (before first paint) ──────────────────────────
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Start with initial slide centered. `left` not transform so position:fixed children work.
    track.style.left = `${-initialIndexRef.current * window.innerWidth}px`;
  }, []);

  // ── IN morph ──────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (phase !== "opening") return;
    if (!post) return;
    const box = boxRefs.current.get(post.slug);
    const image = imageRefs.current.get(post.slug);
    const sourceCardEl = ctx.getCardEl(currentIndex);
    if (!box || !image || !sourceCardEl) return;

    // Restore to natural layout before measuring (safe for first run + StrictMode re-runs)
    restoreBoxToNatural(box);
    restoreImageToNatural(image);

    const srcImageEl = sourceCardEl.querySelector<HTMLElement>(
      `[data-flip-id="preview-${post.slug}-image"]`
    );

    // Measure target (natural) rects
    const tgtBoxRect = box.getBoundingClientRect();
    const tgtImageRect = image.getBoundingClientRect();
    // Measure source (card) rects — pre-scale (.scalable-content not yet transformed)
    const srcBoxRect = sourceCardEl.getBoundingClientRect();
    const srcImageRect = srcImageEl ? srcImageEl.getBoundingClientRect() : srcBoxRect;

    const srcBoxStyle = getComputedStyle(sourceCardEl);
    const srcBoxRadius = srcBoxStyle.borderRadius || "0px";
    const srcImageRadius = srcImageEl ? getComputedStyle(srcImageEl).borderRadius || "0px" : "0px";

    // Hide the BG layer + card info-i instantly (overlay info-i takes over).
    // Keep card wrapper visible during text fade so the fade is actually seen.
    const srcCardBgEl = sourceCardEl.querySelector<HTMLElement>("[data-card-image-bg]");
    if (srcCardBgEl) srcCardBgEl.style.visibility = "hidden";
    const srcCardInfoEl = sourceCardEl.querySelector<HTMLElement>("[data-card-info]");
    if (srcCardInfoEl) srcCardInfoEl.style.visibility = "hidden";
    const cardTextEl = sourceCardEl.querySelector<HTMLElement>("[data-card-text]");
    if (cardTextEl) {
      gsap.to(cardTextEl, {
        opacity: 0,
        duration: CARD_TEXT_FADE_DURATION,
        ease: "power2.in",
        onComplete: () => {
          sourceCardEl.style.visibility = "hidden";
        },
      });
    } else {
      sourceCardEl.style.visibility = "hidden";
    }

    // Overlay info-i fades 1→0 parallel to the image morph (CSS child of preview-image).
    const overlayInfoEl = infoRefs.current.get(post.slug);
    if (overlayInfoEl) {
      gsap.fromTo(
        overlayInfoEl,
        { opacity: 1 },
        { opacity: 0, duration: MORPH_DURATION, ease: MORPH_EASE, immediateRender: true }
      );
    }

    // Background blur — parallel
    window.dispatchEvent(new CustomEvent("menu-opened"));

    // Backdrop fade in
    if (backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
    }

    // Direct layout styles on box (position:fixed so we can animate viewport coords)
    box.style.position = "fixed";
    box.style.margin = "0";
    box.style.maxWidth = "none";
    box.style.maxHeight = "none";
    box.style.overflow = "hidden";
    box.style.zIndex = "1";

    image.style.position = "fixed";
    image.style.margin = "0";
    image.style.zIndex = "2";

    const boxTween = gsap.fromTo(
      box,
      {
        top: srcBoxRect.top,
        left: srcBoxRect.left,
        width: srcBoxRect.width,
        height: srcBoxRect.height,
        borderRadius: srcBoxRadius,
        backgroundColor: "rgba(255, 255, 255, 0)",
        boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
      },
      {
        top: tgtBoxRect.top,
        left: tgtBoxRect.left,
        width: tgtBoxRect.width,
        height: tgtBoxRect.height,
        borderRadius: PREVIEW_BORDER_RADIUS,
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: PREVIEW_SHADOW,
        duration: MORPH_DURATION,
        ease: MORPH_EASE,
        immediateRender: true,
      }
    );

    const imageTween = gsap.fromTo(
      image,
      {
        top: srcImageRect.top,
        left: srcImageRect.left,
        width: srcImageRect.width,
        height: srcImageRect.height,
        borderRadius: srcImageRadius,
      },
      {
        top: tgtImageRect.top,
        left: tgtImageRect.left,
        width: tgtImageRect.width,
        height: tgtImageRect.height,
        borderRadius: IMAGE_RADIUS_CSS,
        duration: MORPH_DURATION,
        ease: MORPH_EASE,
        immediateRender: true,
        onComplete: () => {
          // Restore to natural layout — box + image land inside their slide slot,
          // stable for navigation (track translation moves them with the slot).
          restoreBoxToNatural(box);
          restoreImageToNatural(image);
          setPhase("slider");
        },
      }
    );

    return () => {
      boxTween.kill();
      imageTween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fade in text + X when entering slider phase ───────────────────────────
  useLayoutEffect(() => {
    if (phase !== "slider") return;
    const textEl = textRefs.current.get(post?.slug ?? "");
    if (textEl) gsap.fromTo(textEl, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
    if (closeBtnRef.current) {
      gsap.fromTo(closeBtnRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
    }
    if (dotsRef.current) {
      gsap.fromTo(dotsRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Navigate animation: slide track + fade text swap ─────────────────────
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (phase !== "slider") {
      prevIndexRef.current = currentIndex;
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    const prev = prevIndexRef.current;
    if (prev === currentIndex) return;

    // Animate track `left` (not transform) so ancestor-transform doesn't break fixed positioning
    gsap.to(track, {
      left: -currentIndex * window.innerWidth,
      duration: NAV_DURATION,
      ease: NAV_EASE,
    });

    // Fade out old slide text, fade in new slide text (with slight delay)
    const oldPost = posts[prev];
    const newPost = posts[currentIndex];
    if (oldPost) {
      const t = textRefs.current.get(oldPost.slug);
      if (t) gsap.to(t, { opacity: 0, duration: 0.2, ease: "power2.in" });
    }
    if (newPost) {
      const t = textRefs.current.get(newPost.slug);
      if (t) {
        gsap.fromTo(
          t,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, delay: NAV_DURATION * 0.5, ease: "power2.out" }
        );
      }
    }

    // Restore the previously-shown card in the BG slider (visibility + card-text fade-in).
    // Without this, the initial source card stays hidden once the user navigates away,
    // leaving an empty slot in the slider background.
    const prevCardEl = ctx.getCardEl(prev);
    if (prevCardEl) {
      prevCardEl.style.visibility = "";
      const prevBgEl = prevCardEl.querySelector<HTMLElement>("[data-card-image-bg]");
      if (prevBgEl) prevBgEl.style.visibility = "";
      const prevInfoEl = prevCardEl.querySelector<HTMLElement>("[data-card-info]");
      if (prevInfoEl) prevInfoEl.style.visibility = "";
      const cardTextEl = prevCardEl.querySelector<HTMLElement>("[data-card-text]");
      if (cardTextEl) gsap.to(cardTextEl, { opacity: 1, duration: 0.3, ease: "power2.out" });
    }

    // Put new current card into hidden state (matches initial-click state) so close-fade
    // always starts from opacity 0 and is visible.
    const nextCardEl = ctx.getCardEl(currentIndex);
    if (nextCardEl) {
      nextCardEl.style.visibility = "hidden";
      const nextBgEl = nextCardEl.querySelector<HTMLElement>("[data-card-image-bg]");
      if (nextBgEl) nextBgEl.style.visibility = "hidden";
      const nextInfoEl = nextCardEl.querySelector<HTMLElement>("[data-card-info]");
      if (nextInfoEl) nextInfoEl.style.visibility = "hidden";
      const nextTextEl = nextCardEl.querySelector<HTMLElement>("[data-card-text]");
      if (nextTextEl) nextTextEl.style.opacity = "0";
    }

    prevIndexRef.current = currentIndex;
  }, [currentIndex, phase, posts]);

  // ── Resize handling: keep track aligned on viewport resize ────────────────
  useEffect(() => {
    const onResize = () => {
      const track = trackRef.current;
      if (!track) return;
      track.style.left = `${-currentIndex * window.innerWidth}px`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex]);

  // ── Swipe / drag ──────────────────────────────────────────────────────────
  const navFiredThisGestureRef = useRef(false);
  const bindDrag = useDrag(
    ({ first, last, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (phase !== "slider") return;
      if (first) navFiredThisGestureRef.current = false;

      const track = trackRef.current;
      if (!track) return;
      const baseLeft = -currentIndex * window.innerWidth;

      // Edge resistance
      let effectiveMx = mx;
      const atStart = currentIndex === 0;
      const atEnd = currentIndex === posts.length - 1;
      if ((atStart && mx > 0) || (atEnd && mx < 0)) {
        effectiveMx = mx / 2.5;
      }

      if (!last) {
        track.style.left = `${baseLeft + effectiveMx}px`;
        return;
      }

      // Guard: fire navigate at most ONCE per gesture (prevents double-fire from
      // pointer+touch events overlapping or `last` firing multiple times).
      if (navFiredThisGestureRef.current) return;

      const absMx = Math.abs(mx);
      const absVx = Math.abs(vx);
      const shouldNavigate = absMx > SWIPE_THRESHOLD_PX || absVx > SWIPE_VELOCITY;

      if (shouldNavigate && dx < 0 && !atEnd) {
        navFiredThisGestureRef.current = true;
        onNavigate(1);
      } else if (shouldNavigate && dx > 0 && !atStart) {
        navFiredThisGestureRef.current = true;
        onNavigate(-1);
      } else {
        gsap.to(track, { left: baseLeft, duration: 0.25, ease: "power2.out" });
      }
    },
    { axis: "x", filterTaps: true }
  );

  // ── OUT morph (close) ─────────────────────────────────────────────────────
  const requestClose = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    // Fade current slide text + X before phase swap
    const textEl = post ? textRefs.current.get(post.slug) : null;
    if (textEl) gsap.to(textEl, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    if (closeBtnRef.current) {
      gsap.to(closeBtnRef.current, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    }
    if (dotsRef.current) {
      gsap.to(dotsRef.current, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    }
    window.setTimeout(() => setPhase("closing"), TEXT_FADE_DURATION * 1000);
  }, [post]);

  useLayoutEffect(() => {
    if (phase !== "closing") return;
    if (!post) {
      onClose();
      return;
    }
    const box = boxRefs.current.get(post.slug);
    const image = imageRefs.current.get(post.slug);
    const currentCardEl = ctx.getCardEl(currentIndex);
    if (!box || !image || !currentCardEl) {
      onClose();
      return;
    }

    // Restore to natural before measuring (in case any morph leftovers)
    restoreBoxToNatural(box);
    restoreImageToNatural(image);

    // Backdrop fade out
    if (backdropRef.current) {
      gsap.to(backdropRef.current, { opacity: 0, duration: MORPH_DURATION, ease: MORPH_EASE });
    }

    // Un-blur background
    window.dispatchEvent(new CustomEvent("menu-closed"));

    // Measure current box/image rects (natural — at their position inside the slide slot)
    const curBoxRect = box.getBoundingClientRect();
    const curImageRect = image.getBoundingClientRect();

    // Measure current card's un-scaled rect
    const tgtBoxRect = measureRectUnscaled(currentCardEl);
    const srcImgElInCard = currentCardEl.querySelector<HTMLElement>(
      `[data-flip-id="preview-${post.slug}-image"]`
    );
    const tgtImageRect = srcImgElInCard ? measureRectUnscaled(srcImgElInCard) : tgtBoxRect;

    const cardStyle = getComputedStyle(currentCardEl);
    const cardImageStyle = srcImgElInCard ? getComputedStyle(srcImgElInCard) : null;

    // Card wrapper visible; bg + info-i stay hidden so the morphing preview-image +
    // overlay info-i stand in for them during the morph. Text stays at opacity 0 and
    // fades in AFTER the morph completes.
    currentCardEl.style.visibility = "";
    const tgtCardBgEl = currentCardEl.querySelector<HTMLElement>("[data-card-image-bg]");
    if (tgtCardBgEl) tgtCardBgEl.style.visibility = "hidden";
    const tgtCardInfoEl = currentCardEl.querySelector<HTMLElement>("[data-card-info]");
    if (tgtCardInfoEl) tgtCardInfoEl.style.visibility = "hidden";
    const cardTextEl = currentCardEl.querySelector<HTMLElement>("[data-card-text]");

    // Overlay info-i fades 0→1 parallel to the image morph.
    const overlayInfoEl = infoRefs.current.get(post.slug);
    if (overlayInfoEl) {
      gsap.fromTo(
        overlayInfoEl,
        { opacity: 0 },
        { opacity: 1, duration: MORPH_DURATION, ease: MORPH_EASE, immediateRender: true }
      );
    }

    // Pin box and animate to target card rect
    box.style.position = "fixed";
    box.style.margin = "0";
    box.style.maxWidth = "none";
    box.style.maxHeight = "none";
    box.style.overflow = "hidden";
    box.style.zIndex = "1";

    gsap.fromTo(
      box,
      {
        top: curBoxRect.top,
        left: curBoxRect.left,
        width: curBoxRect.width,
        height: curBoxRect.height,
        borderRadius: `${PREVIEW_BORDER_RADIUS}px`,
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: PREVIEW_SHADOW,
      },
      {
        top: tgtBoxRect.top,
        left: tgtBoxRect.left,
        width: tgtBoxRect.width,
        height: tgtBoxRect.height,
        borderRadius: cardStyle.borderRadius || "0px",
        backgroundColor: "rgba(255, 255, 255, 0)",
        boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)",
        duration: MORPH_DURATION,
        ease: MORPH_EASE,
        immediateRender: true,
      }
    );

    image.style.position = "fixed";
    image.style.margin = "0";
    image.style.zIndex = "2";

    gsap.fromTo(
      image,
      {
        top: curImageRect.top,
        left: curImageRect.left,
        width: curImageRect.width,
        height: curImageRect.height,
      },
      {
        top: tgtImageRect.top,
        left: tgtImageRect.left,
        width: tgtImageRect.width,
        height: tgtImageRect.height,
        borderRadius: cardImageStyle ? cardImageStyle.borderRadius || "0px" : "0px",
        duration: MORPH_DURATION,
        ease: MORPH_EASE,
        immediateRender: true,
      }
    );

    window.setTimeout(() => {
      // Morph done. Preview-image + overlay info-i sit at card position. Fade card text in
      // on the card itself while the preview is still covering it (box is transparent).
      const finish = () => {
        if (tgtCardBgEl) tgtCardBgEl.style.visibility = "";
        if (tgtCardInfoEl) tgtCardInfoEl.style.visibility = "";
        onClose();
      };
      if (cardTextEl) {
        gsap.to(cardTextEl, {
          opacity: 1,
          duration: CARD_TEXT_FADE_DURATION,
          ease: "power2.out",
          onComplete: finish,
        });
      } else {
        finish();
      }
    }, (MORPH_DURATION - 0.2) * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      if (phase !== "slider") return;
      if (e.key === "ArrowLeft") {
        if (currentIndex > 0) onNavigate(-1);
      }
      if (e.key === "ArrowRight") {
        if (currentIndex < posts.length - 1) onNavigate(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, phase, currentIndex, posts.length, onNavigate]);

  if (typeof document === "undefined" || !post) return null;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < posts.length - 1;

  const overlay = (
    <div
      ref={rootRef}
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div
        ref={backdropRef}
        onClick={requestClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          cursor: "pointer",
          opacity: 0,
        }}
      />

      <PreviewHeader current={currentIndex + 1} total={posts.length} phase={phase} />

      {/* Track — holds one slide per post; animates via `left` so position:fixed children stay viewport-anchored */}
      <div
        ref={trackRef}
        {...(phase === "slider" ? bindDrag() : {})}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${posts.length * 100}vw`,
          willChange: "left",
          touchAction: phase === "slider" ? "pan-y" : undefined,
        }}
      >
        {posts.map((p, i) => {
          return (
            <div
              key={p.slug}
              style={{
                position: "absolute",
                top: 0,
                left: `${i * 100}vw`,
                width: "100vw",
                height: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "100px 20px 20px",
                boxSizing: "border-box",
              }}
            >
              <SlidePreview
                post={p}
                extras={extrasCache[p.slug] ?? null}
                setBoxRef={setBoxRef(p.slug)}
                setImageRef={setImageRef(p.slug)}
                setTextRef={setTextRef(p.slug)}
                setInfoRef={setInfoRef(p.slug)}
                onClose={requestClose}
              />
            </div>
          );
        })}
      </div>

      {/* Close button + Nav arrows — always in viewport, not inside track.
          Close button sits in a virtual wrapper that mirrors the preview box position. */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "100px 20px 20px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1000,
            height: "min(900px, calc(100vh - 120px))",
            pointerEvents: "none",
          }}
        >
          <button
            ref={closeBtnRef}
            onClick={requestClose}
            aria-label="Schließen"
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid var(--color-text-primary)",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: 0,
              pointerEvents: "auto",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M1 1 L15 15 M15 1 L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {phase === "slider" && posts.length > 1 && (
            <div
              ref={dotsRef}
              style={{
                position: "absolute",
                left: "50%",
                bottom: PREVIEW_PADDING + 24,
                transform: "translate(-50%, 50%)",
                pointerEvents: "auto",
                opacity: 0,
              }}
            >
              <InstagramDots
                current={currentIndex}
                total={posts.length}
                onGoTo={onGoTo}
              />
            </div>
          )}
        </div>
      </div>

      {phase === "slider" && (
        <>
          <NavArrow
            direction="prev"
            disabled={!canGoPrev}
            onClick={() => canGoPrev && onNavigate(-1)}
          />
          <NavArrow
            direction="next"
            disabled={!canGoNext}
            onClick={() => canGoNext && onNavigate(1)}
          />
        </>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}

// ────────────────────────────────────────────────────────────────────────────
// SlidePreview — one full preview-box (box + image + content) per slide
// ────────────────────────────────────────────────────────────────────────────
interface SlidePreviewProps {
  post: Post;
  extras: PreviewExtras | null;
  setBoxRef: (el: HTMLDivElement | null) => void;
  setImageRef: (el: HTMLDivElement | null) => void;
  setTextRef: (el: HTMLDivElement | null) => void;
  setInfoRef: (el: HTMLDivElement | null) => void;
  onClose: () => void;
}

function SlidePreview({
  post,
  extras,
  setBoxRef,
  setImageRef,
  setTextRef,
  setInfoRef,
  onClose,
}: SlidePreviewProps) {
  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
  const subCategory = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
  const postLink = `/${mainCategory?.slug || "beitraege"}/${subCategory?.slug || "allgemein"}/${post.slug}`;
  const imageUrl = post.featuredImage?.node.sourceUrl;
  const toolsToShow = useMemo(() => (extras?.tools ?? []).slice(0, 3), [extras]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1200,
        height: "min(900px, calc(100vh - 120px))",
      }}
    >
      {/* Box — the white card */}
      <div
        ref={setBoxRef}
        data-flip-id={`preview-${post.slug}-box`}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background: "#ffffff",
          borderRadius: PREVIEW_BORDER_RADIUS,
          boxShadow: PREVIEW_SHADOW,
          padding: PREVIEW_PADDING,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Text wrapper — fades as a unit */}
        <div
          ref={setTextRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            opacity: 0,
            minHeight: 0,
          }}
        >
          {/* Upper row — image spacer (left) + subline/title column (right) */}
          <div
            style={{
              display: "flex",
              gap: 40,
              flexShrink: 0,
            }}
          >
            {/* Image spacer: image sibling sits here visually via absolute positioning */}
            <div aria-hidden style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, flexShrink: 0 }} />

            {/* Subline + title column, vertically centered next to the image */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingRight: 40,
              }}
            >
              <p lang="de" style={textSublineStyle}>
                {post.title}
              </p>
              {untertitel && (
                <p lang="de" style={textTitleStyle}>
                  {untertitel}
                </p>
              )}
              {toolsToShow.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--color-text-medium)",
                      margin: "0 0 10px 0",
                    }}
                  >
                    Finanztools in diesem Artikel
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {toolsToShow.map((t) => (
                      <span
                        key={t}
                        style={{
                          backgroundColor: TOOL_META[t].color,
                          color: "#ffffff",
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 14,
                          padding: "6px 14px",
                          borderRadius: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {TOOL_META[t].label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lower section — description, tools, reading time + CTA */}
          <div
            style={{
              marginTop: 40,
              display: "flex",
              flexDirection: "column",
              gap: 28,
              flex: 1,
              minHeight: 0,
            }}
          >
            {extras?.firstParagraph ? (
              <p
                lang="de"
                style={{
                  fontFamily: "Merriweather, serif",
                  fontWeight: 400,
                  fontSize: "18px",
                  lineHeight: 1.6,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {extras.firstParagraph}
              </p>
            ) : (
              <SkeletonParagraph />
            )}
            <Spacer noMargin />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                marginTop: "auto",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  color: "var(--color-text-medium)",
                }}
              >
                {extras && extras.readingTime > 0 ? `Lesedauer: ${extras.readingTime} Min.` : "\u00A0"}
              </span>
              <Link href={postLink} onClick={onClose} style={{ textDecoration: "none" }}>
                <PreviewReadButton label="Ratgeber lesen" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image — sibling of box, absolute-positioned over the top-left area (400×400) */}
      <div
        ref={setImageRef}
        data-flip-id={`preview-${post.slug}-image`}
        style={{
          position: "absolute",
          top: PREVIEW_PADDING,
          left: PREVIEW_PADDING,
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : "transparent",
          borderRadius: IMAGE_RADIUS_CSS,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {!imageUrl && <VisualLottie seed={post.slug} />}
        {/* Info-i — morphs with the image (CSS child), opacity animated during open/close */}
        <div
          ref={setInfoRef}
          style={{
            position: "absolute",
            bottom: 13,
            right: 13,
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid var(--color-text-primary)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <svg width="9" height="17" viewBox="0 0 9 17" fill="var(--color-text-primary)" aria-hidden>
            <path d="M7.16051 0L7.35875 0.0146957C7.47514 0.0235131 7.58758 0.0333103 7.70001 0.0646611C8.13695 0.186146 8.51174 0.421277 8.74845 0.813163C8.89443 1.05515 8.9753 1.31967 8.99503 1.60183C9.06111 2.53452 8.46637 3.35552 7.59843 3.67197C7.12993 3.84244 6.55295 3.86595 6.07459 3.72193C5.69092 3.60633 5.36149 3.36042 5.15536 3.0185C5.04489 2.83529 4.97881 2.64033 4.93738 2.43067C4.90582 2.27098 4.90878 2.11324 4.91371 1.95061C4.91963 1.75467 4.96007 1.57342 5.03207 1.39021C5.19086 0.985592 5.46999 0.642693 5.83295 0.397764C6.15448 0.181247 6.51941 0.0440871 6.90703 0.00881743C6.94253 0.00587829 6.97607 0.0156754 6.99974 0H7.16149L7.16051 0Z" />
            <path d="M4.73725 16.1878C4.03303 16.5836 3.15227 16.9305 2.34251 16.9922C2.17977 17.0039 2.02098 17 1.85627 16.9932C1.54953 16.9804 1.25462 16.907 0.990295 16.7502C0.725966 16.5934 0.547446 16.3495 0.464596 16.0575C0.345254 15.6382 0.422185 15.1346 0.511939 14.7095C0.697363 13.8316 1.05342 12.8784 1.4006 12.0456L3.01517 8.16888L3.4738 7.04025C3.54482 6.86488 3.46394 6.5357 3.23314 6.48769C3.09112 6.4583 2.94613 6.49161 2.81298 6.54353C2.47172 6.67775 2.03084 7.0765 1.78328 7.34592L1.15698 8.02878C0.996213 8.20415 0.840377 8.37364 0.666788 8.53529C0.596761 8.60191 0.520815 8.6558 0.437966 8.70086C0.355117 8.74593 0.276213 8.73711 0.197309 8.69695C0.00399355 8.59897 -0.0472941 8.41185 0.0404867 8.22472C0.0848703 8.12969 0.134185 8.04054 0.195336 7.95432C0.308761 7.79561 0.417254 7.63983 0.557309 7.50071L1.48147 6.58076C2.07523 5.98999 3.01123 5.40511 3.8052 5.11413C4.47194 4.87018 5.20377 4.73596 5.9149 4.79474C6.36071 4.83099 6.83413 5.01616 7.11128 5.38159C7.25725 5.5746 7.36378 5.80287 7.38745 6.04682C7.41112 6.29077 7.41802 6.54549 7.38449 6.79728C7.3332 7.18525 7.2178 7.56636 7.07479 7.93277L5.07457 13.0714L4.98679 13.2938C4.85167 13.6367 4.64454 14.1226 4.63566 14.4861C4.63271 14.637 4.70569 14.7741 4.84279 14.8407C5.0075 14.9221 5.25013 14.8104 5.39808 14.7232C5.60619 14.6017 5.78569 14.4537 5.96323 14.2892C6.19501 14.0736 6.40805 13.8522 6.62701 13.6239L7.22273 13.0018C7.31446 12.9068 7.40717 12.8245 7.50975 12.7422C7.55413 12.7069 7.61134 12.6707 7.66657 12.6648C7.83523 12.6491 8.01671 12.8764 7.98514 13.0772C7.94273 13.3525 7.60147 13.7915 7.41605 14.008C7.17736 14.2862 6.92093 14.5419 6.64871 14.7908C6.06482 15.3257 5.42865 15.7969 4.73725 16.1859V16.1878Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SkeletonParagraph — loading placeholder with shimmer
// ────────────────────────────────────────────────────────────────────────────
function SkeletonParagraph() {
  const LINE_HEIGHT = 18;
  const GAP = 14;
  const widths = ["100%", "100%", "100%", "60%"];
  return (
    <div
      aria-hidden
      style={{ display: "flex", flexDirection: "column", gap: GAP }}
    >
      {widths.map((w, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ height: LINE_HEIGHT, width: w }}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PreviewHeader — info icon + label + animated counter above the slider
// ────────────────────────────────────────────────────────────────────────────
function PreviewHeader({ current, total, phase }: { current: number; total: number; phase: Phase }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (phase === "slider") {
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
    } else if (phase === "closing") {
      gsap.to(ref.current, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    }
  }, [phase]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: 44,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 5,
        zIndex: 6,
        pointerEvents: "none",
        fontFamily: "Merriweather, serif",
        fontSize: 18,
        color: "var(--color-text-primary)",
        opacity: 0,
        whiteSpace: "nowrap",
      }}
    >
      <span>Ratgebervorschau</span>

      <div style={{ display: "flex", alignItems: "baseline" }}>
        <AnimatedNumber value={current} minChars={String(total).length} />
        <span>/{total}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AnimatedNumber — number that slides up/down on change (odometer-style)
// ────────────────────────────────────────────────────────────────────────────
function AnimatedNumber({ value, minChars = 1 }: { value: number; minChars?: number }) {
  const prevRef = useRef(value);
  const containerRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (value === prevRef.current) return;
    const container = containerRef.current;
    const entering = currentRef.current;
    if (!container || !entering) return;
    const dir = value > prevRef.current ? 1 : -1;
    const oldValue = prevRef.current;
    prevRef.current = value;

    const distance = 18;
    const leaving = document.createElement("span");
    leaving.textContent = String(oldValue);
    leaving.style.position = "absolute";
    leaving.style.top = "0";
    leaving.style.right = "0";
    leaving.style.display = "inline-block";
    container.appendChild(leaving);

    const duration = 0.3;
    const ease = "power2.inOut";
    gsap.to(leaving, {
      y: -dir * distance,
      opacity: 0,
      duration,
      ease,
      onComplete: () => leaving.remove(),
    });
    gsap.fromTo(
      entering,
      { y: dir * distance, opacity: 0 },
      { y: 0, opacity: 1, duration, ease }
    );
  }, [value]);

  return (
    <span
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth: `${minChars}ch`,
        overflow: "hidden",
        textAlign: "right",
      }}
    >
      <span ref={currentRef} style={{ display: "inline-block" }}>
        {value}
      </span>
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// NavArrow — fixed to viewport
// ────────────────────────────────────────────────────────────────────────────
function NavArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Vorheriger Artikel" : "Nächster Artikel"}
      style={{
        position: "fixed",
        top: "50%",
        [direction === "prev" ? "left" : "right"]: 32,
        transform: "translateY(-50%)",
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "1px solid var(--color-text-primary)",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "opacity 0.2s ease",
        zIndex: 4,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        aria-hidden
        style={{ transform: direction === "prev" ? "rotate(180deg)" : undefined }}
      >
        <path
          d="M5 2 L11 8 L5 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared text styles
// ────────────────────────────────────────────────────────────────────────────
const textSublineStyle: React.CSSProperties = {
  fontFamily: "Merriweather, serif",
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "23px",
  lineHeight: 1.3,
  color: "var(--color-brand-secondary)",
  margin: 0,
  hyphens: "auto",
  overflowWrap: "break-word",
  marginBottom: 12,
};

const textTitleStyle: React.CSSProperties = {
  fontFamily: "Merriweather, serif",
  fontWeight: 700,
  fontSize: "42px",
  lineHeight: 1.3,
  color: "var(--color-text-primary)",
  margin: 0,
  hyphens: "auto",
  overflowWrap: "break-word",
};

// ────────────────────────────────────────────────────────────────────────────
// PreviewReadButton
// ────────────────────────────────────────────────────────────────────────────
function PreviewReadButton({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 13,
        height: 48,
        paddingLeft: 20,
        paddingRight: 3,
        paddingTop: 3,
        paddingBottom: 3,
        borderRadius: 21,
        border: "2px solid var(--color-text-primary)",
        outline: "1px solid var(--color-text-primary)",
        outlineOffset: 2,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: 17,
          fontWeight: 500,
          color: "#1a1a1a",
          lineHeight: "30px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "var(--color-brand)",
            borderRadius: 17,
          }}
        />
        <svg
          width="11"
          height="15"
          viewBox="0 0 11 15"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: -4.5,
            marginTop: -7.5,
          }}
          aria-hidden
        >
          <path
            d="M1.5 1.50009L9.5 7.50009L1.5 13.5001"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </span>
  );
}
