"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useDrag } from "@use-gesture/react";
import { gsap, initGSAP } from "@/lib/gsapConfig";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";
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
const PREVIEW_BORDER_RADIUS = 56;
const IMAGE_RADIUS_TOP = `${PREVIEW_BORDER_RADIUS}px ${PREVIEW_BORDER_RADIUS}px 0 0`;
const PREVIEW_SHADOW = "0 40px 80px rgba(0,0,0,0.18)";
const IMAGE_HEIGHT = 480;
const SWIPE_THRESHOLD_PX = 60;
const SWIPE_VELOCITY = 0.2;

type Phase = "opening" | "slider" | "closing";

interface Props {
  ctx: PreviewSliderContext;
  currentIndex: number;
  onNavigate: (delta: -1 | 1) => void;
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
  image.style.top = "0";
  image.style.left = "0";
  image.style.right = "";
  image.style.bottom = "";
  image.style.width = "100%";
  image.style.height = `${IMAGE_HEIGHT}px`;
  image.style.margin = "";
  image.style.zIndex = "";
  image.style.borderRadius = IMAGE_RADIUS_TOP;
  // background / pointerEvents set by JSX — don't touch
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
export default function ArticlePreviewOverlay({ ctx, currentIndex, onNavigate, onClose }: Props) {
  const { posts } = ctx;
  const post = posts[currentIndex];

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Per-slide refs (keyed by post slug)
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
    const srcBoxBg = srcBoxStyle.backgroundColor || "rgba(0,0,0,0)";
    const srcImageRadius = srcImageEl ? getComputedStyle(srcImageEl).borderRadius || "0px" : "0px";

    // Hide source card
    sourceCardEl.style.visibility = "hidden";
    const cardTextEl = sourceCardEl.querySelector<HTMLElement>("[data-card-text]");
    if (cardTextEl) gsap.to(cardTextEl, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });

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
        backgroundColor: srcBoxBg,
        boxShadow: "0 0 0 rgba(0,0,0,0)",
      },
      {
        top: tgtBoxRect.top,
        left: tgtBoxRect.left,
        width: tgtBoxRect.width,
        height: tgtBoxRect.height,
        borderRadius: PREVIEW_BORDER_RADIUS,
        backgroundColor: "rgb(255, 255, 255)",
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
        borderRadius: IMAGE_RADIUS_TOP,
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

    // Keep target card hidden until morph completes
    currentCardEl.style.visibility = "hidden";
    const cardTextEl = currentCardEl.querySelector<HTMLElement>("[data-card-text]");
    if (cardTextEl) {
      gsap.to(cardTextEl, { opacity: 1, duration: 0.3, delay: MORPH_DURATION * 0.5, ease: "power2.out" });
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
      },
      {
        top: tgtBoxRect.top,
        left: tgtBoxRect.left,
        width: tgtBoxRect.width,
        height: tgtBoxRect.height,
        borderRadius: cardStyle.borderRadius || "0px",
        backgroundColor: cardStyle.backgroundColor || "rgba(0,0,0,0)",
        boxShadow: "0 0 0 rgba(0,0,0,0)",
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
      currentCardEl.style.visibility = "";
      onClose();
    }, MORPH_DURATION * 1000);
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
          const isActive = i === currentIndex;
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
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <SlidePreview
                post={p}
                extras={extrasCache[p.slug] ?? null}
                setBoxRef={setBoxRef(p.slug)}
                setImageRef={setImageRef(p.slug)}
                setTextRef={setTextRef(p.slug)}
                onClose={requestClose}
                isActive={isActive}
                closeBtnRef={isActive ? closeBtnRef : null}
              />
            </div>
          );
        })}
      </div>

      {/* Nav arrows — always in viewport, not inside track */}
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
  onClose: () => void;
  isActive: boolean;
  closeBtnRef: React.RefObject<HTMLButtonElement | null> | null;
}

function SlidePreview({
  post,
  extras,
  setBoxRef,
  setImageRef,
  setTextRef,
  onClose,
  isActive,
  closeBtnRef,
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
        maxWidth: 1000,
        height: "min(900px, calc(100vh - 40px))",
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
        }}
      >
        {isActive && closeBtnRef && (
          <button
            ref={closeBtnRef}
            onClick={onClose}
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
              zIndex: 5,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M1 1 L15 15 M15 1 L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Spacer for the image area (image itself is sibling of box) */}
        <div aria-hidden style={{ width: "100%", height: IMAGE_HEIGHT }} />

        {/* Text content — ref for fade */}
        <div
          ref={setTextRef}
          style={{
            padding: "40px 64px 48px 64px",
            display: "flex",
            flexDirection: "column",
            opacity: 0,
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
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 28 }}>
            {extras?.firstParagraph ? (
              <p
                lang="de"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "18px",
                  lineHeight: 1.6,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {extras.firstParagraph}
              </p>
            ) : null}
            {toolsToShow.length > 0 && (
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
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {TOOL_META[t].label}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                marginTop: 8,
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

      {/* Image — sibling of box, absolute-positioned over the top area */}
      <div
        ref={setImageRef}
        data-flip-id={`preview-${post.slug}-image`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: IMAGE_HEIGHT,
          background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : "rgba(0,0,0,0.08)",
          borderRadius: IMAGE_RADIUS_TOP,
          pointerEvents: "none",
        }}
      />
    </div>
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
