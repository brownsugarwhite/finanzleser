"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useDrag } from "@use-gesture/react";
import { gsap, initGSAP } from "@/lib/gsapConfig";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";
import InstagramDots from "@/components/ui/InstagramDots";
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
const NAV_DURATION = 0.6;
const NAV_EASE = "power2.inOut";
// Kindle-Page-Turn: Soft-Transition-Zone der Mask-Gradient-Kante (in %).
// Weiterer Wert = breitere, weichere Wisch-Kante.
// Mobile bekommt mehr, weil dort der Swipe das Tempo vorgibt und ein
// breiterer Wisch ergonomischer aussieht; Desktop fühlt sich knackiger
// an mit kompaktem Edge.
const MASK_SOFT_ZONE_DESKTOP = 8;
const MASK_SOFT_ZONE_MOBILE = 30;
// Lücke zwischen Outgoing-Soft-Zone und Incoming-Soft-Zone (in %). Im
// Gap-Bereich sind beide Slides transparent → Overlay-Hintergrund scheint
// als feiner Riss durch.
const MASK_GAP = 1;
// Maximaler diagonaler Kippwinkel (in Grad) basierend auf Y-Position des
// Swipe-Starts. Finger oben → Top führt; Finger unten → Bottom führt;
// Mitte → reine Horizontale. Nur bei Drag aktiv (Click-Nav bleibt 0°).
const SLIDE_TILT_MAX = 14;
// Subtile Scale: incoming wächst von 0.96 → 1.0 (steigt aus der Tiefe),
// outgoing schrumpft 1.0 → 0.96 (sinkt zurück). Akzent obendrauf, kein
// dominanter Effekt — der Wisch bleibt das Hauptelement.
const SLIDE_SCALE_OFFSET = 0.13;
const TEXT_FADE_DURATION = 0.15;
const CARD_TEXT_FADE_DURATION = 0.25;
const PREVIEW_BORDER_RADIUS = 56;
const PREVIEW_PADDING = 56;
const PREVIEW_PADDING_TOP = 23;
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 320;
const MOBILE_IMAGE_HEIGHT = 220;
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
  extrasCache: Record<string, PreviewExtras>;
  prefetchExtras: (slug: string) => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Kindle-Page-Turn Mask-Helpers
// ────────────────────────────────────────────────────────────────────────────
// Beide Slides bekommen während der Transition komplementäre Linear-Gradient-
// Masks. An jedem Pixel ist genau eine Seite sichtbar; in der 8%-Soft-Zone
// blenden sie mit Alpha-Ramp ineinander über → weicher Kindle-Wisch ohne
// Translation/Scale/Blur.
//
// reveal: 0 = Transition nicht gestartet (outgoing voll sichtbar, incoming
// versteckt). 1 = Transition komplett (outgoing versteckt, incoming voll
// sichtbar).
//
// angleDeg: CSS-Gradient-Winkel in Grad. 90 = rein horizontal "to right",
// 270 = "to left". Abweichungen davon ergeben einen diagonalen Wisch.
//
// softZone: Breite der weichen Transition-Zone in % (Desktop kompakt, Mobile
// breiter). Outgoing- und Incoming-Soft-Zonen überlappen exakt → Alpha-
// Summe = 1 an jedem Pixel, kein "durch-Schimmer".
type MaskRole = "outgoing" | "incoming";

// Mask-Image wird EINMAL pro role/softZone-Kombination gesetzt. Der Gradient-
// String enthält `var(--reveal)` und `var(--mask-angle)` — pro Frame ändern
// sich nur diese CSS-Custom-Properties. Damit muss iOS Safari nicht für jeden
// Frame eine neue Gradient-Textur rasterisieren (war Hauptursache für den
// progressiven Slowdown nach 5-10 Swipes auf iPhone).
function buildMaskTemplate(role: MaskRole, softZone: number): string {
  const span = 100 + MASK_GAP + 2 * softZone;

  if (role === "outgoing") {
    // c = (1 - reveal) * span - GAP/2 - softZone
    // transStop = c - GAP/2 = (1 - reveal) * span - GAP - softZone
    // blackStop = transStop - softZone = (1 - reveal) * span - GAP - 2*softZone
    const blackOffset = MASK_GAP + 2 * softZone;
    const transOffset = MASK_GAP + softZone;
    return (
      `linear-gradient(var(--mask-angle, 90deg), ` +
      `black 0%, ` +
      `black calc((1 - var(--reveal, 0)) * ${span}% - ${blackOffset}%), ` +
      `transparent calc((1 - var(--reveal, 0)) * ${span}% - ${transOffset}%), ` +
      `transparent 100%)`
    );
  }
  // incoming:
  // transStop = c + GAP/2 = (1 - reveal) * span - softZone
  // blackStop = transStop + softZone = (1 - reveal) * span
  return (
    `linear-gradient(var(--mask-angle, 90deg), ` +
    `transparent 0%, ` +
    `transparent calc((1 - var(--reveal, 0)) * ${span}% - ${softZone}%), ` +
    `black calc((1 - var(--reveal, 0)) * ${span}%), ` +
    `black 100%)`
  );
}

function applyMaskTemplate(el: HTMLElement, role: MaskRole, softZone: number) {
  // Signature-Dedupe: vermeidet redundante Style-Sets im Drag-Handler
  // (jeder Frame ruft ggf. applyMaskTemplate auf — nur bei role/softZone-
  // Wechsel kostet das wirklich was).
  const sig = `${role}-${softZone}`;
  if (el.dataset.maskSig === sig) return;
  el.dataset.maskSig = sig;
  const mask = buildMaskTemplate(role, softZone);
  el.style.maskImage = mask;
  (el.style as CSSStyleDeclaration & { webkitMaskImage?: string }).webkitMaskImage = mask;
}

function setMaskState(el: HTMLElement, reveal: number, angleDeg: number) {
  el.style.setProperty("--reveal", String(reveal));
  el.style.setProperty("--mask-angle", `${angleDeg}deg`);
}

function setSlideMask(
  el: HTMLElement,
  angleDeg: number,
  role: MaskRole,
  reveal: number,
  softZone: number
) {
  applyMaskTemplate(el, role, softZone);
  setMaskState(el, reveal, angleDeg);
}

function clearSlideMask(el: HTMLElement) {
  el.style.maskImage = "";
  (el.style as CSSStyleDeclaration & { webkitMaskImage?: string }).webkitMaskImage = "";
  el.style.removeProperty("--reveal");
  el.style.removeProperty("--mask-angle");
  delete el.dataset.maskSig;
}

// dir: 1 = next (forward), -1 = prev (backward).
// Sweep läuft "in Bewegungsrichtung der neuen Seite":
// - next: 90° (gradient "to right", visible-area der incoming wächst von
//   rechts nach links).
// - prev: 270° ("to left").
// tiltDeg: zusätzlicher Kippwinkel für diagonalen Wisch (Drag-Y-abhängig).
// Bei prev wird der Tilt gespiegelt — Finger oben soll in BEIDEN Richtungen
// "Top führt" produzieren, sonst kippt der Wisch gegenläufig.
function sweepAngle(dir: 1 | -1, tiltDeg = 0): number {
  const adjustedTilt = dir === 1 ? tiltDeg : -tiltDeg;
  return (dir === 1 ? 90 : 270) + adjustedTilt;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function measureRectUnscaled(el: HTMLElement): DOMRect {
  // Landing hat mehrere .scalable-landing-Wrapper (Hero, Slider-Block, Footer);
  // alle temporär auf transform/filter: none stellen, damit der Rect natural
  // gemessen wird, egal in welchem Wrapper el liegt.
  const landings = Array.from(document.querySelectorAll<HTMLElement>(".scalable-landing"));
  const fallback = document.querySelector<HTMLElement>(".scalable-content");
  const els: HTMLElement[] = landings.length > 0 ? landings : fallback ? [fallback] : [];
  if (els.length === 0) return el.getBoundingClientRect();

  const saved = els.map((e) => ({
    el: e,
    transform: e.style.transform,
    filter: e.style.filter,
  }));
  els.forEach((e) => {
    e.style.transform = "none";
    e.style.filter = "none";
  });
  const rect = el.getBoundingClientRect();
  saved.forEach((s) => {
    s.el.style.transform = s.transform;
    s.el.style.filter = s.filter;
  });
  return rect;
}

// Restore box to its NATURAL JSX layout (position:absolute inset:0 inside wrapper, with
// white bg, preview radius + shadow). Used at start of morph (to undo leftover morph styles
// before measuring) and on morph complete (so subsequent nav-slider phase has correct layout).
function restoreBoxToNatural(box: HTMLElement) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  box.style.position = "relative";
  box.style.top = "";
  box.style.right = "";
  box.style.bottom = "";
  box.style.left = "";
  box.style.width = "100%";
  box.style.height = "";
  box.style.margin = "";
  box.style.maxWidth = "";
  box.style.maxHeight = "";
  // Mobile keeps overflow visible so the sticky bottom button can stick to the
  // slide-wrapper scroll container; desktop clips the absolute image overlay.
  box.style.overflow = isMobile ? "visible" : "hidden";
  // zIndex BEHALTEN — die Card muss über LogoBar/PreviewHeader liegen, auch
  // nach Morph-Ende. Wird in IN-/OUT-Morph explizit auf "70" gesetzt.
  box.style.zIndex = "70";
  box.style.borderRadius = `${PREVIEW_BORDER_RADIUS}px`;
  box.style.backgroundColor = "#ffffff";
  box.style.boxShadow = PREVIEW_SHADOW;
}

function restoreImageToNatural(image: HTMLElement) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  if (isMobile) {
    // On mobile the image lives in the text flow (between subtitle and description),
    // not as an absolutely positioned overlay over the box top-left.
    image.style.position = "relative";
    image.style.top = "";
    image.style.left = "";
    image.style.right = "";
    image.style.bottom = "";
    image.style.width = "100%";
    image.style.height = `${MOBILE_IMAGE_HEIGHT}px`;
    image.style.margin = "";
    image.style.zIndex = "71";
    image.style.borderRadius = IMAGE_RADIUS_CSS;
    return;
  }
  image.style.position = "absolute";
  image.style.top = `${PREVIEW_PADDING_TOP}px`;
  image.style.left = `${PREVIEW_PADDING}px`;
  image.style.right = "";
  image.style.bottom = "";
  image.style.width = `${IMAGE_WIDTH}px`;
  image.style.height = `${IMAGE_HEIGHT}px`;
  image.style.margin = "";
  image.style.zIndex = "71";
  image.style.borderRadius = IMAGE_RADIUS_CSS;
  // background / pointerEvents set by JSX — don't touch
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────
export default function ArticlePreviewOverlay({ ctx, currentIndex, onNavigate, onGoTo, onClose, extrasCache, prefetchExtras }: Props) {
  const { posts } = ctx;
  const post = posts[currentIndex];
  // Synchronous init: matchMedia is read before first render so SlidePreview's
  // mobile branch + the open morph both see the correct viewport. Using the
  // shared useIsMobile hook would init false → true after mount, causing the
  // morph to measure desktop rects and the layout to jump on re-render.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const leftNavRef = useRef<HTMLDivElement>(null);
  const rightNavRef = useRef<HTMLDivElement>(null);
  const leftArrowRef = useRef<HTMLDivElement>(null);
  const rightArrowRef = useRef<HTMLDivElement>(null);
  const leftArrowSvgRef = useRef<SVGSVGElement>(null);
  const rightArrowSvgRef = useRef<SVGSVGElement>(null);
  const leftLineRef = useRef<HTMLDivElement>(null);
  const rightLineRef = useRef<HTMLDivElement>(null);
  const leftVlineRef = useRef<HTMLDivElement>(null);
  const rightVlineRef = useRef<HTMLDivElement>(null);
  const leftArrowQuickTo = useRef<((v: number) => gsap.core.Tween) | null>(null);
  const rightArrowQuickTo = useRef<((v: number) => gsap.core.Tween) | null>(null);
  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);
  const [phase, setPhase] = useState<Phase>("opening");
  // Triggered sofort beim Klick auf X — fadet PreviewHeader unabhängig von
  // phase=closing aus (das setzt erst nach TEXT_FADE_DURATION ein).
  const [headerExiting, setHeaderExiting] = useState(false);
  // Arrows "disabled" außerhalb der slider-Phase → bestehende disable-Animation
  // spielt beim Öffnen/Schließen (scale/line/vline in/out).
  const leftDisabled = phase !== "slider" || currentIndex === 0;
  const rightDisabled = phase !== "slider" || currentIndex === posts.length - 1;
  const leftFirstRun = useRef(true);
  const rightFirstRun = useRef(true);

  // Initialise GSAP quickTo handlers once arrow refs are mounted
  useEffect(() => {
    if (leftArrowRef.current) {
      leftArrowQuickTo.current = gsap.quickTo(leftArrowRef.current, "y", {
        duration: 0.5,
        ease: "power2.out",
      });
    }
    if (rightArrowRef.current) {
      rightArrowQuickTo.current = gsap.quickTo(rightArrowRef.current, "y", {
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, []);

  // Disable animation for LEFT nav: arrow shrinks → line shrinks (toward vline),
  // vertical line scales to 0 toward its center in parallel (same total duration).
  useLayoutEffect(() => {
    const arrow = leftArrowSvgRef.current;
    const line = leftLineRef.current;
    const vline = leftVlineRef.current;
    if (!arrow || !line || !vline) return;
    if (leftFirstRun.current) {
      leftFirstRun.current = false;
      gsap.set(arrow, { scale: leftDisabled ? 0 : 1 });
      gsap.set(line, { scaleX: leftDisabled ? 0 : 1 });
      gsap.set(vline, { scaleY: leftDisabled ? 0 : 1 });
      return;
    }
    if (leftDisabled) {
      gsap.to(arrow, { scale: 0, duration: 0.25, ease: "power2.in", overwrite: true });
      gsap.to(line, { scaleX: 0, duration: 0.2, delay: 0.25, ease: "power2.out", overwrite: true });
      gsap.to(vline, { scaleY: 0, duration: 0.45, ease: "power2.inOut", overwrite: true });
    } else {
      gsap.to(line, { scaleX: 1, duration: 0.2, ease: "power2.in", overwrite: true });
      gsap.to(arrow, { scale: 1, duration: 0.25, delay: 0.2, ease: "power2.out", overwrite: true });
      gsap.to(vline, { scaleY: 1, duration: 0.45, ease: "power2.inOut", overwrite: true });
    }
  }, [leftDisabled]);

  // Disable animation for RIGHT nav
  useLayoutEffect(() => {
    const arrow = rightArrowSvgRef.current;
    const line = rightLineRef.current;
    const vline = rightVlineRef.current;
    if (!arrow || !line || !vline) return;
    if (rightFirstRun.current) {
      rightFirstRun.current = false;
      gsap.set(arrow, { scale: rightDisabled ? 0 : 1 });
      gsap.set(line, { scaleX: rightDisabled ? 0 : 1 });
      gsap.set(vline, { scaleY: rightDisabled ? 0 : 1 });
      return;
    }
    if (rightDisabled) {
      gsap.to(arrow, { scale: 0, duration: 0.25, ease: "power2.in", overwrite: true });
      gsap.to(line, { scaleX: 0, duration: 0.2, delay: 0.25, ease: "power2.out", overwrite: true });
      gsap.to(vline, { scaleY: 0, duration: 0.45, ease: "power2.inOut", overwrite: true });
    } else {
      gsap.to(line, { scaleX: 1, duration: 0.2, ease: "power2.in", overwrite: true });
      gsap.to(arrow, { scale: 1, duration: 0.25, delay: 0.2, ease: "power2.out", overwrite: true });
      gsap.to(vline, { scaleY: 1, duration: 0.45, ease: "power2.inOut", overwrite: true });
    }
  }, [rightDisabled]);

  // Per-slide refs (keyed by post slug)
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const infoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const slideWrapperRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Mobile-only: bottom-block (description + tools + lesedauer + button) wird
  // GSAP-gesteuert wie textRef — fadet synchron mit textRef beim Schließen
  // und bekommt während des Morphs eine fixe Breite, damit Text nicht reflowt.
  const bottomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
  const setCategoryRef = useCallback((slug: string) => (el: HTMLElement | null) => {
    if (el) categoryRefs.current.set(slug, el);
    else categoryRefs.current.delete(slug);
  }, []);
  const setBottomRef = useCallback((slug: string) => (el: HTMLDivElement | null) => {
    if (el) bottomRefs.current.set(slug, el);
    else bottomRefs.current.delete(slug);
  }, []);

  const isExitingRef = useRef(false);
  const initialIndexRef = useRef(currentIndex);

  // Pending-Timeouts sammeln, damit sie beim Unmount gecleared werden können.
  // Sonst feuern setTimeouts aus requestClose/close-morph nach Unmount und
  // rufen setPhase/onClose auf einer toten Komponente → React-Warning +
  // akkumulierende GSAP-Tweens → OOM-Crash auf iOS nach 2-3 Open/Close.
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const scheduleTimeout = useCallback((cb: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimeoutsRef.current.delete(id);
      cb();
    }, ms);
    pendingTimeoutsRef.current.add(id);
    return id;
  }, []);

  // ── Side effects + cleanup ────────────────────────────────────────────────
  useEffect(() => {
    // Native-Scrollbar ist global via `scrollbar-width: none` versteckt → keine
    // Gutter-Kompensation nötig. Auf iOS lieferte `innerWidth - clientWidth`
    // gelegentlich 1px (Subpixel-Rounding) und schob Bookmark+Content 1px
    // nach links. Threshold ≥5px filtert das raus, echte Desktop-Scrollbars
    // (15-17px) würden weiterhin kompensiert.
    // Native-Scrollbar ist global via `scrollbar-width: none` versteckt → keine
    // Gutter-Kompensation nötig. Auf iOS lieferte `innerWidth - clientWidth`
    // gelegentlich 1px (Subpixel-Rounding) und schob Bookmark+Content 1px
    // nach links. Threshold ≥5px filtert das raus, echte Desktop-Scrollbars
    // (15-17px) würden weiterhin kompensiert.
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarW >= 5) document.body.style.paddingRight = `${scrollbarW}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadRight;
      window.dispatchEvent(new CustomEvent("menu-closed"));

      // Pending-Timeouts clearen — verhindert setState-on-unmounted-component
      // und akkumulierende GSAP-Tweens nach 2-3 Open/Close-Zyklen.
      pendingTimeoutsRef.current.forEach(clearTimeout);
      pendingTimeoutsRef.current.clear();

      // Alle GSAP-Tweens auf Slide-Refs killen — Morph-Tweens, Text-Fades,
      // Backdrop-Fades. Sonst halten sie Detached-DOM-Knoten und akkumulieren
      // → iOS-Mobile-OOM-Crash nach 2-3 Open/Close-Zyklen.
      boxRefs.current.forEach((el) => gsap.killTweensOf(el));
      imageRefs.current.forEach((el) => gsap.killTweensOf(el));
      textRefs.current.forEach((el) => gsap.killTweensOf(el));
      infoRefs.current.forEach((el) => gsap.killTweensOf(el));
      categoryRefs.current.forEach((el) => gsap.killTweensOf(el));
      slideWrapperRefs.current.forEach((el) => {
        gsap.killTweensOf(el);
        clearSlideMask(el);
      });
      bottomRefs.current.forEach((el) => gsap.killTweensOf(el));
      if (backdropRef.current) gsap.killTweensOf(backdropRef.current);
      if (trackRef.current) gsap.killTweensOf(trackRef.current);

      // Zusätzlich: Nav/Arrow/Line/Vline-Refs killen (slider-phase tweens).
      if (leftArrowRef.current) gsap.killTweensOf(leftArrowRef.current);
      if (rightArrowRef.current) gsap.killTweensOf(rightArrowRef.current);
      if (leftArrowSvgRef.current) gsap.killTweensOf(leftArrowSvgRef.current);
      if (rightArrowSvgRef.current) gsap.killTweensOf(rightArrowSvgRef.current);
      if (leftLineRef.current) gsap.killTweensOf(leftLineRef.current);
      if (rightLineRef.current) gsap.killTweensOf(rightLineRef.current);
      if (leftVlineRef.current) gsap.killTweensOf(leftVlineRef.current);
      if (rightVlineRef.current) gsap.killTweensOf(rightVlineRef.current);
      if (leftNavRef.current) gsap.killTweensOf(leftNavRef.current);
      if (rightNavRef.current) gsap.killTweensOf(rightNavRef.current);
      if (footerRef.current) gsap.killTweensOf(footerRef.current);

      // Belt-and-Suspenders: Auch alle Tweens auf Descendants des Root killen.
      // Fängt Tweens auf transient queryselected Elementen (z.B. cardTextEl auf
      // den Source-Cards), die wir nicht als Refs halten.
      if (rootRef.current) {
        const all = rootRef.current.querySelectorAll<HTMLElement>("*");
        all.forEach((el) => gsap.killTweensOf(el));
      }

      // Ref-Maps leeren — sonst behalten wir Pointers auf detached DOM-Knoten.
      boxRefs.current.clear();
      imageRefs.current.clear();
      textRefs.current.clear();
      infoRefs.current.clear();
      categoryRefs.current.clear();
      slideWrapperRefs.current.clear();
      bottomRefs.current.clear();

      // Restore any hidden source cards. ZUERST in-flight Tweens auf den
      // Source-Card-Children killen — sonst kann ein noch laufender
      // gsap.to(cardTextEl, ..., onComplete: visibility="hidden") nach unserem
      // Restore noch feuern und die Card wieder verstecken.
      posts.forEach((_, i) => {
        const el = ctx.getCardEl(i);
        if (el) {
          gsap.killTweensOf(el);
          el.querySelectorAll<HTMLElement>("*").forEach((d) => gsap.killTweensOf(d));
          el.style.visibility = "";
          const bgEl = el.querySelector<HTMLElement>("[data-card-image-bg]");
          if (bgEl) bgEl.style.visibility = "";
          const infoEl = el.querySelector<HTMLElement>("[data-card-info]");
          if (infoEl) infoEl.style.visibility = "";
          const catEl = el.querySelector<HTMLElement>("[data-card-category]");
          if (catEl) catEl.style.visibility = "";
          const textEl = el.querySelector<HTMLElement>("[data-card-text]");
          if (textEl) textEl.style.opacity = "";
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Prefetch extras for current + neighbors ───────────────────────────────
  useEffect(() => {
    if (!post) return;
    prefetchExtras(post.slug);
    const prev = posts[currentIndex - 1];
    const next = posts[currentIndex + 1];
    if (prev) prefetchExtras(prev.slug);
    if (next) prefetchExtras(next.slug);
  }, [post, currentIndex, posts, prefetchExtras]);

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
    const srcCardCatEl = sourceCardEl.querySelector<HTMLElement>("[data-card-category]");
    if (srcCardCatEl) srcCardCatEl.style.visibility = "hidden";
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

    // Overlay category badge fades 0→1 parallel to the image morph — appears as
    // the image grows into the preview, regardless of whether the source card
    // had its own category badge.
    const overlayCategoryEl = categoryRefs.current.get(post.slug);
    if (overlayCategoryEl) {
      gsap.fromTo(
        overlayCategoryEl,
        { opacity: 0 },
        { opacity: 1, duration: MORPH_DURATION, ease: MORPH_EASE, immediateRender: true }
      );
    }

    // Background blur — parallel (extended: includes TopNav + dotline + opt-in landing elements).
    // label:"preview" triggert den Burger-Morph zu X im BookmarkNav (handleMenuOpened
    // bailt sonst auf !label) — der Burger fungiert dadurch als Close-Trigger.
    window.dispatchEvent(new CustomEvent("menu-opened", { detail: { extended: true, label: "preview" } }));

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
    box.style.zIndex = "70";

    image.style.position = "fixed";
    image.style.margin = "0";
    image.style.zIndex = "71";

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
        // Fade in from transparent when source card has no image element
        ...(srcImageEl ? {} : { opacity: 0 }),
      },
      {
        top: tgtImageRect.top,
        left: tgtImageRect.left,
        width: tgtImageRect.width,
        height: tgtImageRect.height,
        borderRadius: IMAGE_RADIUS_CSS,
        ...(srcImageEl ? {} : { opacity: 1 }),
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

    // Fade in text already during the morph. To prevent the text from reflowing
    // as the box grows in width, we pin the text wrapper to the box's *target*
    // inner width from the start, and center it within the box so it grows
    // outward from the middle (instead of entering from the right).
    const textEl = textRefs.current.get(post.slug);
    const bottomEl = bottomRefs.current.get(post.slug);
    const boxPaddingLeft = parseFloat(getComputedStyle(box).paddingLeft) || PREVIEW_PADDING;
    const targetInnerWidth = tgtBoxRect.width - boxPaddingLeft * 2;
    let textTween: gsap.core.Tween | null = null;
    let bottomTween: gsap.core.Tween | null = null;
    if (textEl) {
      // Use the box's actual padding so mobile (24px) and desktop (56px) match
      // their respective inner widths — otherwise the text wrapper width "jumps"
      // when restoreBoxToNatural runs at the end of the morph.
      textEl.style.width = `${targetInnerWidth}px`;
      box.style.alignItems = "center";
      textTween = gsap.fromTo(
        textEl,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
          delay: MORPH_DURATION * 0.85,
          onComplete: () => {
            textEl.style.width = "";
            box.style.alignItems = "";
          },
        }
      );
    }
    // Mobile-Bottom-Block (Description + Tools/Lesedauer + Button): synchron
    // mit textTween fade-in, fixe Width während Morph damit Text nicht reflowt
    // und die Finanztools-Zeile keinen Sprung beim Morph-Ende macht.
    if (bottomEl) {
      bottomEl.style.width = `${targetInnerWidth}px`;
      bottomTween = gsap.fromTo(
        bottomEl,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
          delay: MORPH_DURATION * 0.85,
          onComplete: () => {
            bottomEl.style.width = "";
          },
        }
      );
    }

    return () => {
      boxTween.kill();
      imageTween.kill();
      if (textTween) textTween.kill();
      if (bottomTween) bottomTween.kill();
      if (textEl) textEl.style.width = "";
      if (bottomEl) bottomEl.style.width = "";
      box.style.alignItems = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Dots scale-in bei Entry in slider phase; reverse bei closing ──
  // Close-Button entfällt — Burger im BookmarkNav fungiert als Close-Trigger.
  useLayoutEffect(() => {
    if (phase === "slider") {
      // Dots skalieren jetzt individuell via visible-Prop an InstagramDots —
      // kein Container-Scale mehr hier.
      // Pfeile (leftNav/rightNav): Container bleibt sichtbar, die bestehende
      // disable-Animation spielt jetzt beim Phase-Wechsel (scale/line/vline).
      if (leftNavRef.current) gsap.set(leftNavRef.current, { opacity: 1 });
      if (rightNavRef.current) gsap.set(rightNavRef.current, { opacity: 1 });
    }
    // closing-phase: Dots skalieren automatisch über visible=false an InstagramDots
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Animate box height when extras arrive late for current slide ──────────
  const currentExtras = post ? extrasCache[post.slug] : null;
  useLayoutEffect(() => {
    if (phase !== "slider") return;
    if (!post) return;
    const box = boxRefs.current.get(post.slug);
    if (!box) return;
    const currentHeight = box.getBoundingClientRect().height;
    box.style.height = "auto";
    const naturalHeight = box.getBoundingClientRect().height;
    if (Math.abs(naturalHeight - currentHeight) < 2) {
      box.style.height = "";
      return;
    }
    box.style.height = `${currentHeight}px`;
    const t = gsap.to(box, {
      height: naturalHeight,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => {
        box.style.height = "";
      },
    });
    return () => {
      t.kill();
      box.style.height = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExtras, phase]);

  // ── Navigate animation: Kindle-Page-Turn (Gradient-Mask-Wipe) ──
  const prevIndexRef = useRef(currentIndex);
  useEffect(() => {
    if (phase !== "slider") {
      prevIndexRef.current = currentIndex;
      return;
    }
    const prev = prevIndexRef.current;
    if (prev === currentIndex) return;

    const dir: 1 | -1 = currentIndex > prev ? 1 : -1; // 1 = next, -1 = prev
    // Drag-Commit übernimmt Tilt aus letztem Drag; Click-Nav nutzt 0°.
    const tiltDeg = dragNavRef.current ? lastDragTiltRef.current : 0;
    const angle = sweepAngle(dir, tiltDeg);
    const softZone = isMobile ? MASK_SOFT_ZONE_MOBILE : MASK_SOFT_ZONE_DESKTOP;
    const oldPost = posts[prev];
    const newPost = posts[currentIndex];
    const oldSlide = oldPost ? slideWrapperRefs.current.get(oldPost.slug) : null;
    const newSlide = newPost ? slideWrapperRefs.current.get(newPost.slug) : null;

    // Kill any in-flight tweens on either slide so rapid nav can't keep stale
    // mask-tween-values on the incoming slide.
    if (oldSlide) gsap.killTweensOf(oldSlide);
    if (newSlide) gsap.killTweensOf(newSlide);

    // Neue Slide immer mit scrollTop 0 zeigen — wenn der User vorher in
    // einem anderen Slide vertikal gescrollt hat und dann hin/zurück
    // navigiert, soll der Slide jedes Mal von oben beginnen.
    if (newSlide) newSlide.scrollTop = 0;

    // Stale Transform-/Filter-Werte aus eventuellem vorherigen Drag-State
    // zurücksetzen (Drag-Handler arbeitet beim Rubber-Band noch mit x).
    // Scale-Startwerte: outgoing kommt von 1.0, incoming startet 0.96.
    // Wenn aus Drag heraus genavigiert wurde, übernimmt das Tween die
    // bereits gesetzten Werte sanft (overwrite "auto").
    if (oldSlide) {
      const startScale = dragNavRef.current
        ? 1 - SLIDE_SCALE_OFFSET * lastDragProgressRef.current
        : 1;
      gsap.set(oldSlide, { x: 0, scale: startScale, filter: "none" });
    }
    if (newSlide) {
      const startScale = dragNavRef.current
        ? 1 - SLIDE_SCALE_OFFSET + SLIDE_SCALE_OFFSET * lastDragProgressRef.current
        : 1 - SLIDE_SCALE_OFFSET;
      gsap.set(newSlide, { x: 0, scale: startScale, filter: "none" });
    }

    // Drag-Path und Click-Path liefern unterschiedliche Ausgangspunkte:
    // - Click: kein vorheriger Mask-State, beide Slides müssen mit reveal=0
    //   starten und auf reveal=1 animieren.
    // - Drag: beide Slides haben bereits Mask-State (progress 0..1) gesetzt
    //   bekommen; wir lesen den Wert NICHT zurück, sondern animieren weiter
    //   bis 1 (Drag-Handler ruft onNavigate erst wenn Threshold überschritten,
    //   also ist der State irgendwo zwischen ~0.3 und 1.0 → der finale Tween
    //   überschreibt ihn ohnehin).
    const tweenObj = { reveal: dragNavRef.current ? lastDragProgressRef.current : 0 };
    dragNavRef.current = false;
    dragCandidateSlugRef.current = null;
    lastDragProgressRef.current = 0;

    // Slides für Transition vorbereiten: beide opaque rendern, incoming auf
    // höheres z-index damit Round-Corners der Box nicht den outgoing-Slide
    // durchscheinen lassen.
    if (oldSlide) {
      oldSlide.style.opacity = "1";
      oldSlide.style.pointerEvents = "none";
      oldSlide.style.zIndex = "70";
      setSlideMask(oldSlide, angle, "outgoing", tweenObj.reveal, softZone);
    }
    if (newSlide) {
      newSlide.style.opacity = "1";
      newSlide.style.pointerEvents = "auto";
      newSlide.style.zIndex = "71";
      setSlideMask(newSlide, angle, "incoming", tweenObj.reveal, softZone);
    }

    gsap.to(tweenObj, {
      reveal: 1,
      duration: NAV_DURATION,
      ease: NAV_EASE,
      onUpdate: () => {
        if (oldSlide) setSlideMask(oldSlide, angle, "outgoing", tweenObj.reveal, softZone);
        if (newSlide) setSlideMask(newSlide, angle, "incoming", tweenObj.reveal, softZone);
      },
      onComplete: () => {
        // Endzustand: outgoing voll versteckt (opacity 0, mask weg), incoming
        // voll sichtbar (opacity 1, mask weg). z-index zurück, scale auf 1.
        if (oldSlide) {
          clearSlideMask(oldSlide);
          oldSlide.style.opacity = "0";
          oldSlide.style.zIndex = "70"; // back to JSX-default — nicht clearen, sonst Header rückt drüber
          gsap.set(oldSlide, { scale: 1 });
        }
        if (newSlide) {
          clearSlideMask(newSlide);
          newSlide.style.zIndex = "70";
        }
      },
    });
    // Scale parallel zum Mask-Wisch — outgoing 1.0 → 0.96, incoming 0.96 → 1.0.
    if (oldSlide) {
      gsap.to(oldSlide, {
        scale: 1 - SLIDE_SCALE_OFFSET,
        duration: NAV_DURATION,
        ease: NAV_EASE,
        overwrite: "auto",
      });
    }
    if (newSlide) {
      gsap.to(newSlide, {
        scale: 1,
        duration: NAV_DURATION,
        ease: NAV_EASE,
        overwrite: "auto",
      });
    }
    // Ensure new slide's text wrapper is visible (opacity 0 default from JSX)
    if (newPost) {
      const newText = textRefs.current.get(newPost.slug);
      if (newText) gsap.set(newText, { opacity: 1 });
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
      const prevCatEl = prevCardEl.querySelector<HTMLElement>("[data-card-category]");
      if (prevCatEl) prevCatEl.style.visibility = "";
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
      const nextCatEl = nextCardEl.querySelector<HTMLElement>("[data-card-category]");
      if (nextCatEl) nextCatEl.style.visibility = "hidden";
      const nextTextEl = nextCardEl.querySelector<HTMLElement>("[data-card-text]");
      if (nextTextEl) nextTextEl.style.opacity = "0";
    }

    prevIndexRef.current = currentIndex;
  }, [currentIndex, phase, posts]);

  // ── Swipe / drag ──────────────────────────────────────────────────────────
  const navFiredThisGestureRef = useRef(false);
  // Letzter Drag-Progress (0..1) — die nav-effect-Logik nimmt ihn als
  // Start-Wert für den Tween, sonst springt die Mask von z.B. 0.7 auf 0.5
  // beim Übergang Drag → Click-Animation.
  const lastDragProgressRef = useRef(0);
  // Letzter Drag-Tilt (Grad) — diagonaler Kippwinkel basierend auf Y-Position
  // des Touch-Starts. Click-Nav nutzt 0 (rein horizontal); Drag-Commit liest
  // diesen Wert damit der laufende Wisch ohne Sprung weitergeht.
  const lastDragTiltRef = useRef(0);
  const dragCandidateSlugRef = useRef<string | null>(null);
  const dragNavRef = useRef(false);
  const bindDrag = useDrag(
    ({ first, last, movement: [mx], velocity: [vx], xy: [, y] }) => {
      if (phase !== "slider") return;
      if (first) {
        navFiredThisGestureRef.current = false;
        dragCandidateSlugRef.current = null;
      }
      // Diagonal-Tilt aus AKTUELLER Y-Position berechnen → der Wisch kippt
      // dynamisch mit, wenn der User während des Drags hoch oder runter fährt.
      // Finger oben (y ≈ 0) → −TILT_MAX. Finger unten → +TILT_MAX. Mitte → 0.
      const halfH = window.innerHeight / 2;
      const yRel = (y - halfH) / halfH; // -1..+1
      lastDragTiltRef.current = Math.max(-1, Math.min(1, yRel)) * SLIDE_TILT_MAX;

      const currentSlideEl = post ? slideWrapperRefs.current.get(post.slug) : null;
      if (!currentSlideEl) return;

      // Vertikales Scrollen während des Swipes blocken — sonst zappelt das
      // Layout durch Mikro-Y-Bewegungen des Fingers. touchAction: none lässt
      // Pointer-Events durch zu useDrag, blockt aber Browser-Pan komplett.
      // overflow: hidden verhindert dass der scrollbare Slide selbst auf
      // Touch-Events scrollt.
      if (first) {
        currentSlideEl.style.touchAction = "none";
        currentSlideEl.style.overflowY = "hidden";
      }

      const dirGesture: -1 | 1 = mx > 0 ? -1 : 1; // -1 = prev, 1 = next
      const atStart = currentIndex === 0;
      const atEnd = currentIndex === posts.length - 1;
      const hasCandidate = (dirGesture === 1 && !atEnd) || (dirGesture === -1 && !atStart);
      const candidatePost = hasCandidate ? posts[currentIndex + dirGesture] : null;
      const candidateSlide = candidatePost ? slideWrapperRefs.current.get(candidatePost.slug) : null;

      // If user switches direction mid-drag, reset the previously-revealed candidate
      const newCandSlug = candidatePost?.slug ?? null;
      if (dragCandidateSlugRef.current !== newCandSlug) {
        if (dragCandidateSlugRef.current) {
          const oldCand = slideWrapperRefs.current.get(dragCandidateSlugRef.current);
          if (oldCand) gsap.set(oldCand, { x: 0, scale: 1.2, opacity: 0, filter: "blur(0px)" });
        }
        // Neuer Kandidat — scrollTop NULLEN während er noch durch die Mask
        // versteckt ist (reveal ≈ 0). Sonst sieht der User beim Reveal die
        // Sprung-Animation auf 0.
        if (candidateSlide) candidateSlide.scrollTop = 0;
      }
      dragCandidateSlugRef.current = newCandSlug;

      // Rubber-band: apply diminishing resistance to the raw drag distance so
      // far pulls feel elastic rather than linear.
      const rubberBand = (dist: number, limit: number) =>
        Math.sign(dist) * (Math.abs(dist) / (1 + Math.abs(dist) / limit));
      const limit = window.innerWidth / 1.5;
      const rubberMx = hasCandidate ? rubberBand(mx, limit) : rubberBand(mx, limit) / 2.5;
      // Progress 0..1 based on half viewport as max travel
      const progress = Math.min(Math.abs(rubberMx) / (window.innerWidth / 2), 1);

      if (!last) {
        if (hasCandidate && candidateSlide && candidatePost) {
          // Kindle-Page-Turn: progress mappt direkt auf den Mask-Reveal.
          // Outgoing-Slide schrumpft visible-area, incoming wächst — beide
          // synchron mit weicher Gradient-Kante in der Mitte.
          const angle = sweepAngle(dirGesture, lastDragTiltRef.current);
          const softZone = isMobile ? MASK_SOFT_ZONE_MOBILE : MASK_SOFT_ZONE_DESKTOP;
          currentSlideEl.style.opacity = "1";
          candidateSlide.style.opacity = "1";
          currentSlideEl.style.zIndex = "70";
          candidateSlide.style.zIndex = "71";
          setSlideMask(currentSlideEl, angle, "outgoing", progress, softZone);
          setSlideMask(candidateSlide, angle, "incoming", progress, softZone);
          // Scale parallel: outgoing 1 → 0.96, incoming 0.96 → 1.
          gsap.set(currentSlideEl, { scale: 1 - SLIDE_SCALE_OFFSET * progress });
          gsap.set(candidateSlide, {
            scale: 1 - SLIDE_SCALE_OFFSET + SLIDE_SCALE_OFFSET * progress,
          });
          lastDragProgressRef.current = progress;
          // Candidate's text wrapper starts at opacity 0 (set during opening morph
          // for non-initial slides) — make its content visible during drag.
          const candText = textRefs.current.get(candidatePost.slug);
          if (candText) gsap.set(candText, { opacity: 1 });
        } else {
          // Rubber-band at edges (kein Sweep — kein Candidate vorhanden).
          gsap.set(currentSlideEl, { x: rubberMx });
        }
        return;
      }

      // Release: vertikales Scrollen + Browser-Pan auf currentSlideEl wieder
      // erlauben (matched die JSX-Default-Werte aus dem Slide-Wrapper).
      currentSlideEl.style.touchAction = "";
      currentSlideEl.style.overflowY = "auto";

      // Release
      if (navFiredThisGestureRef.current) return;

      const absMx = Math.abs(mx);
      const absVx = Math.abs(vx);
      const shouldNavigate =
        hasCandidate && (absMx > SWIPE_THRESHOLD_PX || absVx > SWIPE_VELOCITY);

      if (shouldNavigate) {
        navFiredThisGestureRef.current = true;
        dragNavRef.current = true;
        onNavigate(dirGesture);
      } else {
        // Spring-Back: Sweep zurück auf reveal=0. Wenn kein Candidate
        // (Rubber-Band-Edge), Position via x zurückfedern.
        if (hasCandidate && candidateSlide) {
          const angle = sweepAngle(dirGesture, lastDragTiltRef.current);
          const softZone = isMobile ? MASK_SOFT_ZONE_MOBILE : MASK_SOFT_ZONE_DESKTOP;
          const tweenObj = { reveal: progress };
          gsap.to(tweenObj, {
            reveal: 0,
            duration: 0.35,
            ease: "power2.out",
            onUpdate: () => {
              setSlideMask(currentSlideEl, angle, "outgoing", tweenObj.reveal, softZone);
              setSlideMask(candidateSlide, angle, "incoming", tweenObj.reveal, softZone);
            },
            onComplete: () => {
              clearSlideMask(currentSlideEl);
              clearSlideMask(candidateSlide);
              candidateSlide.style.opacity = "0";
              candidateSlide.style.pointerEvents = "none";
              currentSlideEl.style.zIndex = "70";
              candidateSlide.style.zIndex = "70";
            },
          });
          // Scale federt parallel zurück: outgoing → 1.0, incoming → 0.96.
          gsap.to(currentSlideEl, {
            scale: 1,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
          gsap.to(candidateSlide, {
            scale: 1 - SLIDE_SCALE_OFFSET,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          // Rubber-band reset
          gsap.to(currentSlideEl, {
            x: 0,
            duration: 0.4,
            ease: "elastic.out(1, 0.55)",
          });
        }
        dragCandidateSlugRef.current = null;
      }
    },
    { axis: "x", filterTaps: true }
  );

  // ── OUT morph (close) ─────────────────────────────────────────────────────
  const requestClose = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    // Sofort den Header ausfaden — soll vor dem Logo-Wieder-Einanimieren
    // komplett verschwunden sein, damit Logo nicht über die Ratgebervorschau
    // gelegt wird.
    setHeaderExiting(true);

    // Fade current slide text + bottom-block (mobile) before phase swap.
    // Beide synchron, damit Mobile-Description nicht erst nach Title fadet.
    const textEl = post ? textRefs.current.get(post.slug) : null;
    if (textEl) gsap.to(textEl, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    const bottomEl = post ? bottomRefs.current.get(post.slug) : null;
    if (bottomEl) {
      // Width pinnen, damit beim OUT-Morph (Box schrumpft) der Text nicht
      // reflowt während der Bottom-Block ausfadet.
      const currentWidth = bottomEl.getBoundingClientRect().width;
      if (currentWidth > 0) bottomEl.style.width = `${currentWidth}px`;
      gsap.to(bottomEl, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    }
    // Pfeile + Dots NICHT per Opacity ausblenden — die disable-Animation
    // (arrow scale 0, line scaleX 0, vline scaleY 0) spielt beim Wechsel
    // zu phase="closing" automatisch. Dots skalieren einzeln über visible-
    // Prop an InstagramDots (jeder Dot via DotSlot).
    scheduleTimeout(() => setPhase("closing"), TEXT_FADE_DURATION * 1000);
  }, [post, scheduleTimeout]);

  useLayoutEffect(() => {
    if (phase !== "closing") return;
    if (!post) {
      onClose();
      return;
    }
    const box = boxRefs.current.get(post.slug);
    const image = imageRefs.current.get(post.slug);
    const currentCardEl = ctx.getCardEl(currentIndex);
    if (!box || !image) {
      onClose();
      return;
    }

    // No source card (e.g. slides 6–10 from sidebar) — fade backdrop out instead of morphing.
    if (!currentCardEl) {
      window.dispatchEvent(new CustomEvent("menu-closed"));
      if (backdropRef.current) {
        gsap.to(backdropRef.current, { opacity: 0, duration: MORPH_DURATION, ease: MORPH_EASE, onComplete: onClose });
      } else {
        onClose();
      }
      return;
    }

    // Scroll card into view, animated parallel to the morph (same duration, ease-out).
    // We offset measured target rects by scrollDelta so the morph lands exactly on the
    // card's post-scroll position, not its pre-scroll position.
    const cardRect = currentCardEl.getBoundingClientRect();
    let scrollDelta = 0;
    if (cardRect.top < 0 || cardRect.bottom > window.innerHeight) {
      const centeredTop = (window.innerHeight - cardRect.height) / 2;
      scrollDelta = cardRect.top - centeredTop;
      gsap.to(window, {
        scrollTo: { y: window.scrollY + scrollDelta },
        duration: MORPH_DURATION,
        ease: "power2.out",
      });
    }

    // Kill any in-flight tweens on box/image so late-arrival height animations
    // or leftover transform tweens don't interfere with the close morph.
    gsap.killTweensOf(box);
    gsap.killTweensOf(image);

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

    // Measure current card's un-scaled rect, offset .top by scrollDelta so the morph
    // targets the card's POST-scroll viewport position (scroll runs parallel).
    const rawTgtBoxRect = measureRectUnscaled(currentCardEl);
    const srcImgElInCard = currentCardEl.querySelector<HTMLElement>(
      `[data-flip-id="preview-${post.slug}-image"]`
    );
    const rawTgtImageRect = srcImgElInCard ? measureRectUnscaled(srcImgElInCard) : rawTgtBoxRect;
    const tgtBoxRect = { top: rawTgtBoxRect.top - scrollDelta, left: rawTgtBoxRect.left, width: rawTgtBoxRect.width, height: rawTgtBoxRect.height };
    const tgtImageRect = { top: rawTgtImageRect.top - scrollDelta, left: rawTgtImageRect.left, width: rawTgtImageRect.width, height: rawTgtImageRect.height };

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
    const tgtCardCatEl = currentCardEl.querySelector<HTMLElement>("[data-card-category]");
    if (tgtCardCatEl) tgtCardCatEl.style.visibility = "hidden";
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

    // Overlay category badge fades 1→0 parallel to the image morph (close).
    const overlayCategoryEl = categoryRefs.current.get(post.slug);
    if (overlayCategoryEl) {
      gsap.fromTo(
        overlayCategoryEl,
        { opacity: 1 },
        { opacity: 0, duration: MORPH_DURATION, ease: MORPH_EASE, immediateRender: true }
      );
    }

    // Pin box and animate to target card rect
    box.style.position = "fixed";
    box.style.margin = "0";
    box.style.maxWidth = "none";
    box.style.maxHeight = "none";
    box.style.overflow = "hidden";
    box.style.zIndex = "70";

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
    image.style.zIndex = "71";

    gsap.fromTo(
      image,
      {
        top: curImageRect.top,
        left: curImageRect.left,
        width: curImageRect.width,
        height: curImageRect.height,
        // Fade out when source card had no image element (mirrors open fade-in)
        ...(srcImgElInCard ? {} : { opacity: 1 }),
      },
      {
        top: tgtImageRect.top,
        left: tgtImageRect.left,
        width: tgtImageRect.width,
        height: tgtImageRect.height,
        borderRadius: cardImageStyle ? cardImageStyle.borderRadius || "0px" : "0px",
        ...(srcImgElInCard ? {} : { opacity: 0 }),
        duration: MORPH_DURATION,
        ease: MORPH_EASE,
        immediateRender: true,
      }
    );

    scheduleTimeout(() => {
      // Morph done. Preview-image + overlay info-i sit at card position. Fade card text in
      // on the card itself while the preview is still covering it (box is transparent).
      const finish = () => {
        if (tgtCardBgEl) tgtCardBgEl.style.visibility = "";
        if (tgtCardInfoEl) tgtCardInfoEl.style.visibility = "";
        if (tgtCardCatEl) tgtCardCatEl.style.visibility = "";
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

  // ── Burger als Close-Trigger ──────────────────────────────────────────────
  // BookmarkNav.toggleBurger feuert burger-closed, wenn der User den Burger/X
  // anklickt. Wir gehen über requestClose, damit der OUT-Morph (phase →
  // "closing" + Flip zurück zur Source-Card) sauber durchläuft. Direktes
  // closePreview würde das Overlay sofort unmounten und den Morph killen.
  useEffect(() => {
    const onBurgerClose = () => requestClose();
    window.addEventListener("burger-closed", onBurgerClose);
    return () => window.removeEventListener("burger-closed", onBurgerClose);
  }, [requestClose]);

  if (typeof document === "undefined" || !post) return null;

  const overlay = (
    <div
      ref={rootRef}
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        height: "100lvh",
        minHeight: "100vh",
        zIndex: 70,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      <div
        ref={backdropRef}
        onClick={requestClose}
        style={{
          position: "absolute",          
          background: "transparent",
          cursor: "pointer",
          opacity: 0,
        }}
      />

      <PreviewHeader current={currentIndex + 1} total={posts.length} phase={phase} exiting={headerExiting} />

      {/* Nav-Gruppe LINKS: vertikale Linie + Verbindungslinie + Pfeil */}
      <div
        ref={leftNavRef}
        aria-hidden={false}
        style={{
          position: "fixed",          
          pointerEvents: "none",
          opacity: 0,
          zIndex: 4,
          display: isMobile ? "none" : undefined,
        }}
      >
        {/* Vertikale Linie links */}
        <div
          ref={leftVlineRef}
          style={{
            position: "fixed",
            top: "calc(50% - 150px)",
            left: "max(106px, calc(50% - 624px))",
            width: 1,
            height: 300,
            transformOrigin: "50% 50%",
            background: hoverSide === "left" ? "var(--color-brand-secondary)" : "var(--color-text-primary)",
            transition: "background 0.2s",
            pointerEvents: "none",
          }}
        />
        {/* Pfeil-Grafik + Verbindungslinie (bewegen sich gemeinsam per GSAP y) */}
        <div
          ref={leftArrowRef}
          style={{
            position: "fixed",
            top: "calc(50% - 11px)",
            left: `max(${hoverSide === "left" ? 24 : 40}px, calc(50% - ${hoverSide === "left" ? 706 : 690}px))`,
            width: hoverSide === "left" ? 60 : 50,
            height: 22,
            pointerEvents: "none",
            zIndex: 3,
            transition: "left 0.3s, width 0.3s",
          }}
        >
          <svg
            ref={leftArrowSvgRef}
            width={hoverSide === "left" ? 60 : 50}
            height={22}
            viewBox="0 0 50 22"
            preserveAspectRatio="none"
            fill="none"
            style={{
              display: "block",
              transformOrigin: "100% 100%",
              transition: "width 0.3s",
            }}
          >
            <path
              d="M0 22 L50 22 L50 0 Z"
              fill={hoverSide === "left" ? "var(--color-brand-secondary)" : "var(--color-text-primary)"}
              style={{ transition: "fill 0.2s" }}
            />
          </svg>
          <div
            ref={leftLineRef}
            style={{
              position: "absolute",
              top: 21,
              left: hoverSide === "left" ? 60 : 50,
              width: hoverSide === "left" ? 22 : 16,
              height: 1,
              transformOrigin: "100% 50%",
              background: hoverSide === "left" ? "var(--color-brand-secondary)" : "var(--color-text-primary)",
              transition: "background 0.2s, left 0.3s, width 0.3s",
            }}
          />
        </div>
        {/* Hover-/Klick-Rechteck zwischen Pfeilspitze und vertikaler Linie */}
        <button
          type="button"
          onClick={() => currentIndex > 0 && onNavigate(-1)}
          onMouseEnter={() => !leftDisabled && setHoverSide("left")}
          onMouseLeave={() => {
            setHoverSide((s) => (s === "left" ? null : s));
            leftArrowQuickTo.current?.(0);
          }}
          onMouseMove={(e) => {
            if (leftDisabled) return;
            const vh = window.innerHeight;
            const maxOffset = 136.5;
            const offset = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - vh / 2));
            leftArrowQuickTo.current?.(offset);
          }}
          disabled={leftDisabled}
          aria-label="Zurück"
          style={{
            position: "fixed",
            top: "calc(50% - 150px)",
            left: "max(24px, calc(50% - 706px))",
            right: "calc(100% - max(106px, calc(50% - 624px)) - 1px)",
            height: 300,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: leftDisabled ? "default" : "pointer",
            pointerEvents: leftDisabled ? "none" : "auto",
            zIndex: 4,
          }}
        />
      </div>

      {/* Nav-Gruppe RECHTS: vertikale Linie + Verbindungslinie + Pfeil */}
      <div
        ref={rightNavRef}
        aria-hidden={false}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0,
          zIndex: 4,
          display: isMobile ? "none" : undefined,
        }}
      >
        {/* Vertikale Linie rechts */}
        <div
          ref={rightVlineRef}
          style={{
            position: "fixed",
            top: "calc(50% - 150px)",
            right: "max(106px, calc(50% - 624px))",
            width: 1,
            height: 300,
            transformOrigin: "50% 50%",
            background: hoverSide === "right" ? "var(--color-brand-secondary)" : "var(--color-text-primary)",
            transition: "background 0.2s",
            pointerEvents: "none",
          }}
        />
        {/* Pfeil-Grafik + Verbindungslinie (bewegen sich gemeinsam per GSAP y) */}
        <div
          ref={rightArrowRef}
          style={{
            position: "fixed",
            top: "calc(50% - 11px)",
            right: `max(${hoverSide === "right" ? 24 : 40}px, calc(50% - ${hoverSide === "right" ? 706 : 690}px))`,
            width: hoverSide === "right" ? 60 : 50,
            height: 22,
            pointerEvents: "none",
            zIndex: 3,
            transition: "right 0.3s, width 0.3s",
          }}
        >
          <svg
            ref={rightArrowSvgRef}
            width={hoverSide === "right" ? 60 : 50}
            height={22}
            viewBox="0 0 50 22"
            preserveAspectRatio="none"
            fill="none"
            style={{
              display: "block",
              transformOrigin: "0% 100%",
              transition: "width 0.3s",
            }}
          >
            <path
              d="M50 22 L0 22 L0 0 Z"
              fill={hoverSide === "right" ? "var(--color-brand-secondary)" : "var(--color-text-primary)"}
              style={{ transition: "fill 0.2s" }}
            />
          </svg>
          <div
            ref={rightLineRef}
            style={{
              position: "absolute",
              top: 21,
              right: hoverSide === "right" ? 60 : 50,
              width: hoverSide === "right" ? 22 : 16,
              height: 1,
              transformOrigin: "0% 50%",
              background: hoverSide === "right" ? "var(--color-brand-secondary)" : "var(--color-text-primary)",
              transition: "background 0.2s, right 0.3s, width 0.3s",
            }}
          />
        </div>
        {/* Hover-/Klick-Rechteck zwischen vertikaler Linie und Pfeilspitze */}
        <button
          type="button"
          onClick={() => currentIndex < posts.length - 1 && onNavigate(1)}
          onMouseEnter={() => !rightDisabled && setHoverSide("right")}
          onMouseLeave={() => {
            setHoverSide((s) => (s === "right" ? null : s));
            rightArrowQuickTo.current?.(0);
          }}
          onMouseMove={(e) => {
            if (rightDisabled) return;
            const vh = window.innerHeight;
            const maxOffset = 136.5;
            const offset = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - vh / 2));
            rightArrowQuickTo.current?.(offset);
          }}
          disabled={rightDisabled}
          aria-label="Weiter"
          style={{
            position: "fixed",
            top: "calc(50% - 150px)",
            right: "max(24px, calc(50% - 706px))",
            left: "calc(100% - max(106px, calc(50% - 624px)) - 1px)",
            height: 300,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: rightDisabled ? "default" : "pointer",
            pointerEvents: rightDisabled ? "none" : "auto",
            zIndex: 4,
          }}
        />
      </div>

      {post && (
        <PreviewFooter
          footerRef={footerRef}
          currentIndex={currentIndex}
          total={posts.length}
          onGoTo={onGoTo}
          phase={phase}
        />
      )}

      {/* Track — holds one slide per post, all stacked; only the active slide is
          opaque. Navigation crossfades + scales + translates between them. */}
      <div
        ref={trackRef}
        {...(phase === "slider" ? bindDrag() : {})}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100vw",
          touchAction: phase === "slider" ? "pan-y" : undefined,
        }}
      >
        {posts.map((p, i) => {
          // Virtualisierung: nur aktiver Slide + 1 Nachbar links/rechts wird
          // gemountet. Bei einem Slider mit z.B. 22 Posts hängen sonst 22×
          // (Image + DOM + Skeleton) parallel im Speicher → iOS-Mobile-OOM
          // nach 2-3 Open/Close-Cycles. Mit Radius 1 sind es max 3.
          //
          // Beim Swipen/Klick wird currentIndex aktualisiert, React rendert
          // die neue Nachbarschaft, useEffect-basierte Nav-Animation läuft
          // wie bisher (slideWrapperRefs für nicht-gemountete Slides sind
          // null → killTweensOf early-return, kein Side-Effect).
          const isVisible = Math.abs(i - currentIndex) <= 1;
          if (!isVisible) return null;
          return (
            <div
              key={p.slug}
              ref={(el) => {
                if (el) slideWrapperRefs.current.set(p.slug, el);
                else slideWrapperRefs.current.delete(p.slug);
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: isMobile ? "95px 13px 120px" : "95px 130px 120px",
                overflowY: "auto",
                overflowX: "hidden",
                boxSizing: "border-box",
                opacity: i === initialIndexRef.current ? 1 : 0,
                pointerEvents: i === initialIndexRef.current ? "auto" : "none",
                // Slide-Wrapper bekommt transform: scale() vom Page-Turn →
                // erzeugt einen eigenen Stacking-Context. Ohne expliziten
                // z-Index liegt er bei "auto" und PreviewHeader (z=65) rückt
                // wieder darüber. Mit z=70 hier (gleich wie Box) bleibt der
                // Wrapper über dem Header.
                zIndex: 70,
                // willChange entfernt: war permanent auf jedem Slide-Wrapper
                // gesetzt → unnötiger GPU-Layer pro Slide. Mit Virtualisierung
                // max 3 Slides gleichzeitig, aber auch 3 dauerhafte Layer
                // sind unnötig. Browser promoten beim Animations-Start.
              }}
            >
              <SlidePreview
                post={p}
                extras={extrasCache[p.slug] ?? null}
                setBoxRef={setBoxRef(p.slug)}
                setImageRef={setImageRef(p.slug)}
                setTextRef={setTextRef(p.slug)}
                setInfoRef={setInfoRef(p.slug)}
                setCategoryRef={setCategoryRef(p.slug)}
                setBottomRef={setBottomRef(p.slug)}
                onClose={requestClose}
                isMobile={isMobile}
                phase={phase}
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
          padding: "95px 130px 120px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1200,
            height: "min(600px, calc(100vh - 320px))",
            pointerEvents: "none",
          }}
        >
        </div>
      </div>

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
  setCategoryRef: (el: HTMLElement | null) => void;
  setBottomRef: (el: HTMLDivElement | null) => void;
  onClose: () => void;
  isMobile: boolean;
  phase: Phase;
}

function SlidePreview({
  post,
  extras,
  setBoxRef,
  setImageRef,
  setTextRef,
  setInfoRef,
  setCategoryRef,
  setBottomRef,
  onClose,
  isMobile,
  phase,
}: SlidePreviewProps) {
  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
  const subCategory = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
  const postLink = `/${mainCategory?.slug || "beitraege"}/${subCategory?.slug || "allgemein"}/${post.slug}`;
  const imageUrl = post.featuredImage?.node.sourceUrl;
  const toolsToShow = useMemo(() => (extras?.tools ?? []).slice(0, 3), [extras]);

  // Image element — same DOM identity in both layouts; only positioning style differs.
  const imageElement = (
    <div
      ref={setImageRef}
      data-flip-id={`preview-${post.slug}-image`}
      style={
        isMobile
          ? {
              position: "relative",
              width: "100%",
              height: MOBILE_IMAGE_HEIGHT,
              background: "transparent",
              borderRadius: IMAGE_RADIUS_CSS,
              pointerEvents: "none",
              overflow: "hidden",
              flexShrink: 0,
            }
          : {
              position: "absolute",
              top: PREVIEW_PADDING_TOP,
              left: PREVIEW_PADDING,
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
              background: "transparent",
              borderRadius: IMAGE_RADIUS_CSS,
              pointerEvents: "none",
              overflow: "hidden",
            }
      }
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={post.featuredImage?.node.altText || ""}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 1,
            display: "block",
          }}
        />
      )}
      {subCategory && (
        <span
          ref={setCategoryRef}
          style={{
            position: "absolute",
            top: 13,
            left: 13,
            zIndex: 2,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--color-text-primary)",
            background: "rgba(255, 255, 255, 0.85)",
            padding: "5px 10px",
            borderRadius: 4,
            opacity: 0,
          }}
        >
          {subCategory.name}
        </span>
      )}
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
  );

  const finanztoolsBlock = toolsToShow.length > 0 && (
    <div>
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
  );

  const lesedauerSpan = (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 15,
        color: "var(--color-text-medium)",
        whiteSpace: "nowrap",
      }}
    >
      {extras && extras.readingTime > 0
        ? `Lesedauer: ${extras.readingTime} Min.`
        : " "}
    </span>
  );

  const descriptionEl = extras?.firstParagraph ? (
    <p
      lang="de"
      style={{
        fontFamily: "Merriweather, serif",
        fontWeight: 400,
        fontSize: isMobile ? "16px" : "18px",
        lineHeight: 1.6,
        color: "var(--color-text-primary)",
        margin: 0,
      }}
    >
      {extras.firstParagraph}
    </p>
  ) : (
    <SkeletonParagraph />
  );

  if (isMobile) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1200,
        }}
      >
        <div
          ref={setBoxRef}
          data-flip-id={`preview-${post.slug}-box`}
          style={{
            position: "relative",
            width: "100%",
            overflow: "visible",
            background: "#ffffff",
            borderRadius: PREVIEW_BORDER_RADIUS,
            boxShadow: PREVIEW_SHADOW,
            padding: 24,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            // Box muss ÜBER PreviewHeader (z=65) liegen — sonst rückt
            // "Ratgebervorschau" nach dem ersten Swipe wieder darüber
            // weil die navigierten Slides keinen restoreBoxToNatural-
            // Pfad durchlaufen, der den z-Index sonst auf "70" setzt.
            zIndex: 70,
          }}
        >
          {/* Top text — faded by morph via setTextRef */}
          <div
            ref={setTextRef}
            style={{
              display: "flex",
              flexDirection: "column",
              opacity: 0,
            }}
          >
            <p lang="de" style={textSublineStyle}>
              {post.title}
            </p>
            {untertitel && (
              <p lang="de" style={{ ...textTitleStyle, fontSize: "26px" }}>
                {untertitel}
              </p>
            )}
          </div>

          {/* Image — outside textRef so opacity 0 of textRef doesn't hide it.
              The wrapper holds a fixed height so the slot doesn't collapse when
              the image is taken out of flow (position: fixed) during the morph.
              width: 100% prevents collapse during the brief window where the
              morph applies box.alignItems = "center" before textTween clears it. */}
          <div
            style={{
              marginTop: 20,
              width: "100%",
              height: MOBILE_IMAGE_HEIGHT,
              flexShrink: 0,
            }}
          >
            {imageElement}
          </div>

          {/* Bottom block — Description + Finanztools/Lesedauer + Button.
              EIN Wrapper mit setBottomRef → GSAP-gesteuertes Opacity-Fade
              synchron mit textRef (statt phase-basiertem CSS-Fade der 0.5s
              später feuert). Während des Morphs wird die Width gepinned,
              damit der Text nicht reflowt.
              Initial-Opacity per Phase: bei "opening" startet das Fade-In
              via GSAP von 0; bei "slider" (Swipe zu anderer Slide nach
              dem Open) muss die neue Slide direkt sichtbar sein → 1. */}
          <div ref={setBottomRef} style={{ opacity: phase === "slider" ? 1 : 0 }}>
          <div style={{ marginTop: 20 }}>{descriptionEl}</div>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>{finanztoolsBlock}</div>
            {lesedauerSpan}
          </div>

          {/* Button — Teil des bottom-blocks für synchrones Fade */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 24,
            }}
          >
            <Link href={postLink} onClick={onClose} style={{ textDecoration: "none" }}>
              <PreviewReadButton label="Ratgeber lesen" />
            </Link>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1200,
      }}
    >
      {/* Box — the white card */}
      <div
        ref={setBoxRef}
        data-flip-id={`preview-${post.slug}-box`}
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          background: "#ffffff",
          borderRadius: PREVIEW_BORDER_RADIUS,
          boxShadow: PREVIEW_SHADOW,
          padding: `${PREVIEW_PADDING_TOP}px ${PREVIEW_PADDING}px ${PREVIEW_PADDING}px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          zIndex: 70,
        }}
      >
        {/* Text wrapper — fades as a unit */}
        <div
          ref={setTextRef}
          style={{
            display: "flex",
            flexDirection: "column",
            opacity: 0,
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

          {/* Lower section — description */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 28,
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                marginTop: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  color: "var(--color-text-medium)",
                  whiteSpace: "nowrap",
                }}
              >
                {extras && extras.readingTime > 0
                  ? `Lesedauer: ${extras.readingTime} Min.`
                  : "\u00A0"}
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
          top: PREVIEW_PADDING_TOP,
          left: PREVIEW_PADDING,
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          background: "transparent",
          borderRadius: IMAGE_RADIUS_CSS,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
          {imageUrl && (
          <img
            src={imageUrl}
            alt={post.featuredImage?.node.altText || ''}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              zIndex: 1,
              display: "block",
            }}
          />
        )}
        {/* Kategorie oben links — fadet während des Morph synchron ein/aus.
            Wird in der finalen Preview-Größe immer gezeigt, unabhängig davon
            ob die Source-Card eine Kategorie trägt oder nicht. */}
        {subCategory && (
          <span
            ref={setCategoryRef}
            style={{
              position: "absolute",
              top: 13,
              left: 13,
              zIndex: 2,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--color-text-primary)",
              background: "rgba(255, 255, 255, 0.85)",
              padding: "5px 10px",
              borderRadius: 4,
              opacity: 0,
            }}
          >
            {subCategory.name}
          </span>
        )}
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
function PreviewHeader({ current, total, phase, exiting }: { current: number; total: number; phase: Phase; exiting: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fadedOutRef = useRef(false);

  useLayoutEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (exiting && !fadedOutRef.current) {
      fadedOutRef.current = true;
      gsap.to(ref.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
      return;
    }
    if (fadedOutRef.current) return; // einmal exiting, nicht zurückfaden
    if (phase === "slider") {
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
    } else if (phase === "closing") {
      gsap.to(ref.current, { opacity: 0, duration: 0.35, ease: "power2.in" });
    }
  }, [phase, exiting]);

  // Mobile: take the logo's top-left slot (LogoBar plays its out animation
  // when preview opens). Desktop: keep centered above the slider.
  const positionStyle: React.CSSProperties = isMobile
    ? { top: 36, left: 16 }
    : { top: 36, left: "50%", transform: "translateX(-50%)" };

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        ...positionStyle,
        display: "flex",
        alignItems: "center",
        gap: 5,
        pointerEvents: "none",
        fontFamily: "Merriweather, serif",
        fontSize: 18,
        color: "var(--color-text-primary)",
        opacity: 0,
        whiteSpace: "nowrap",
        zIndex: 65,
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
// PreviewFooter — fixed row below the slides: reading time + dots + CTA
// ────────────────────────────────────────────────────────────────────────────
function PreviewFooter({
  footerRef,
  currentIndex,
  total,
  onGoTo,
  phase,
}: {
  footerRef: React.RefObject<HTMLDivElement | null>;
  currentIndex: number;
  total: number;
  onGoTo: (index: number) => void;
  phase: Phase;
}) {
  if (total <= 1) return null;
  return (
    <div
      ref={footerRef}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 40,
        transform: "translateX(-50%)",
        zIndex: 6,
        pointerEvents: "auto",
      }}
    >
      <InstagramDots current={currentIndex} total={total} onGoTo={onGoTo} visible={phase === "slider"} />
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
// Shared text styles
// ────────────────────────────────────────────────────────────────────────────
const textSublineStyle: React.CSSProperties = {
  fontFamily: "Merriweather, serif",
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "20px",
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
  fontSize: "36px",
  lineHeight: 1.2,
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
