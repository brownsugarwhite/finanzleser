"use client";

import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import lottie from "lottie-web";

gsap.registerPlugin(ScrollToPlugin);
import type { AnimationItem } from "lottie-web";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Spark from "@/components/ui/Spark";
import RevolverSlider from "@/components/ui/RevolverSlider";
import vergleicheAnim from "@/assets/lottie/vergleicheAnim.json";
import { isMainCategory } from "@/lib/categories";
import type { Post, Rechner, Checkliste } from "@/lib/types";
import { useArticlePreview } from "@/components/sections/ArticlePreviewProvider";
import type { PreviewSliderContext } from "@/components/sections/ArticleSliderContext";
import InlineSVG from "@/components/ui/InlineSVG";

function reverseBaselineTrim(animData: any): any {
  const data = JSON.parse(JSON.stringify(animData));
  const baseline = data.layers?.find((l: any) => l.nm === 'baseline');
  if (!baseline?.shapes) return data;

  function findTrim(shapes: any[]): any {
    for (const s of shapes) {
      if (s.ty === 'tm') return s;
      if (s.it) { const r = findTrim(s.it); if (r) return r; }
    }
    return null;
  }

  const trim = findTrim(baseline.shapes);
  if (!trim) return data;

  const originalEnd = trim.e;
  trim.e = { a: 0, k: 100, ix: trim.e.ix };
  const reversedKeyframes = JSON.parse(JSON.stringify(originalEnd));
  if (reversedKeyframes.a === 1 && reversedKeyframes.k) {
    for (const kf of reversedKeyframes.k) {
      if (kf.s) kf.s = kf.s.map((v: number) => 100 - v);
    }
  }
  trim.s = reversedKeyframes;

  return data;
}

const TOOLS = [
  {
    title: "Rechner",
    description: "Profitieren Sie von unseren tagesaktuellen Rechnern. Zögern Sie nicht. Sie können noch heute anfangen zu sparen!",
    cta: "Zu unseren Rechnern",
    href: "/finanztools/rechner",
    color: "var(--color-tool-rechner)",
    icon: "/icons/iconRechner.svg",
    anim: vergleicheAnim, // Platzhalter
  },
  {
    title: "Vergleiche",
    description: "Vergleichen Sie Tarife, Anbieter und Konditionen. Finden Sie das beste Angebot für Ihre Bedürfnisse.",
    cta: "Zu unseren Vergleichen",
    href: "/finanztools/vergleiche",
    color: "var(--color-tool-vergleiche)",
    icon: "/icons/iconVergleich.svg",
    anim: vergleicheAnim,
  },
  {
    title: "Checklisten",
    description: "Unsere interaktiven Checklisten helfen Ihnen, nichts zu vergessen. Schritt für Schritt zum Ziel.",
    cta: "Zu unseren Checklisten",
    href: "/finanztools/checklisten",
    color: "var(--color-tool-checklisten)",
    icon: "/icons/iconCheckliste.svg",
    anim: vergleicheAnim, // Platzhalter
  },
];

export default function FinanztoolsHero({ posts = [], latestPosts = [], rechner = [], checklisten = [] }: { posts?: Post[]; latestPosts?: Post[]; rechner?: Rechner[]; checklisten?: Checkliste[] }) {
  const lottieRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const animRefs = useRef<(AnimationItem | null)[]>([null, null, null]);
  const cardsRef = useRef<HTMLDivElement>(null);
  const toolContentRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const sidebarCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [cardProgs, setCardProgs] = useState<number[]>([0, 0, 0]);
  const cardProgObjs = useRef([{ v: 0 }, { v: 0 }, { v: 0 }]);
  const [contentProgs, setContentProgs] = useState<number[]>([0, 0, 0]);
  const contentProgObjs = useRef([{ v: 0 }, { v: 0 }, { v: 0 }]);
  const [titleWidths, setTitleWidths] = useState<number[]>([0, 0, 0]);
  const { openPreview } = useArticlePreview();

  const sidebarPreviewCtx = useMemo<PreviewSliderContext>(() => ({
    posts: latestPosts,
    emblaApi: null,
    getCardEl: (i) => sidebarCardRefs.current.get(i) ?? null,
  }), [latestPosts]);
  const sectionRef = useRef<HTMLElement>(null);
  const prevIndex = useRef(-1);
  const prevDirection = useRef<"left" | "right" | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(-1);
  const [prevSlide, setPrevSlide] = useState(-1);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [slidePhase, setSlidePhase] = useState<"idle" | "prep" | "go">("idle");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);


  // Measure collapsed card bar width + calculate spacer height
  useEffect(() => {
    const measure = () => {
      if (cardsRef.current && sectionRef.current) {
        const w = cardsRef.current.scrollWidth;
        sectionRef.current.style.setProperty("--tools-bar-width", w + "px");
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeCard]);

  function patchStrokesIn(container: HTMLElement) {
    container.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect').forEach(el => {
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      el.setAttribute('stroke-width', '1');
    });
  }

  function loadAnimAt(index: number, data: any) {
    const container = lottieRefs.current[index];
    if (!container) return;
    if (animRefs.current[index]) animRefs.current[index]!.destroy();
    const anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: data,
    });
    anim.addEventListener('DOMLoaded', () => patchStrokesIn(container));
    animRefs.current[index] = anim;
  }

  // Check baseline trim progress (0-1) by reading trim keyframes from anim data
  function getBaselineProgress(): number {
    const idx = prevIndex.current;
    if (idx < 0) return 1;
    const anim = animRefs.current[idx];
    if (!anim || !anim.isLoaded) return 1;

    // Find the last keyframe of the baseline trim end → that's when baseline is 100% drawn
    const animData = (anim as any).animationData;
    if (!animData) return anim.currentFrame / Math.max(1, anim.totalFrames);
    const baseline = animData.layers?.find((l: any) => l.nm === 'baseline');
    if (!baseline?.shapes) return 1;

    function findTrim(shapes: any[]): any {
      for (const s of shapes) {
        if (s.ty === 'tm') return s;
        if (s.it) { const r = findTrim(s.it); if (r) return r; }
      }
      return null;
    }
    const trim = findTrim(baseline.shapes);
    if (!trim) return 1;

    // Get the frame where trim reaches 100% (last keyframe of end or start)
    const kfs = trim.e?.k || trim.s?.k || [];
    const lastKf = kfs[kfs.length - 1];
    const baselineEndFrame = lastKf?.t || anim.totalFrames;

    return anim.currentFrame / Math.max(1, baselineEndFrame);
  }

  useLayoutEffect(() => {
    cardProgObjs.current.forEach(obj => gsap.killTweensOf(obj));
    toolContentRefs.current.forEach((el) => {
      if (el) gsap.set(el, { height: 0, opacity: 0 });
    });
  }, []);

  useEffect(() => {
    const measure = () => {
      const widths = TOOLS.map((tool) => {
        const span = document.createElement("span");
        span.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:var(--font-heading,'Merriweather',serif);font-size:13.5px;font-weight:600;`;
        span.textContent = tool.title;
        document.body.appendChild(span);
        const w = span.offsetWidth;
        document.body.removeChild(span);
        return w;
      });
      setTitleWidths(widths);
    };
    measure();
    document.fonts.ready.then(measure);
  }, []);

  useEffect(() => {
    TOOLS.forEach((tool, i) => {
      const isActive = activeCard === tool.title;
      const target = isActive ? 1 : 0;
      gsap.to(cardProgObjs.current[i], {
        v: target,
        duration: isActive ? 0.75 : 0.75,
        ease: isActive ? "back.out(1.2)" : "power2.inOut",
        overwrite: true,
        onUpdate: () => {
          setCardProgs([
            cardProgObjs.current[0].v,
            cardProgObjs.current[1].v,
            cardProgObjs.current[2].v,
          ]);
        },
      });
      gsap.to(contentProgObjs.current[i], {
        v: target,
        duration: 0.75,
        ease: isActive ? "power2.out" : "power2.inOut",
        overwrite: true,
        onUpdate: () => {
          setContentProgs([
            contentProgObjs.current[0].v,
            contentProgObjs.current[1].v,
            contentProgObjs.current[2].v,
          ]);
        },
      });
      const contentEl = toolContentRefs.current[i];
      if (contentEl) {
        gsap.to(contentEl, {
          height: isActive ? "auto" : 0,
          opacity: isActive ? 1 : 0,
          duration: isActive ? 0.65 : 0.65,
          ease: isActive ? "back.out(1.1)" : "power2.inOut",
          overwrite: true,
        });
      }
    });
  }, [activeCard]);

  // Slide to active tool + start animation
  useEffect(() => {
    if (activeCard === null) return;
    const newIndex = TOOLS.findIndex(t => t.title === activeCard);
    if (newIndex < 0 || newIndex === currentSlide) return;

    const isFirstPlay = prevIndex.current < 0;
    const comesFromRight = !isFirstPlay && newIndex > prevIndex.current;
    const dir: "left" | "right" = comesFromRight ? "right" : "left";
    setDirection(dir);

    // Stroke direction
    const animData = TOOLS[newIndex].anim;
    const data = comesFromRight ? JSON.parse(JSON.stringify(animData)) : reverseBaselineTrim(animData);
    const progress = getBaselineProgress();

    // Reset previous anim after transition
    const prevIdx = prevIndex.current;
    if (prevIdx >= 0 && animRefs.current[prevIdx]) {
      setTimeout(() => animRefs.current[prevIdx]?.goToAndStop(0, true), 500);
    }

    if (isFirstPlay) {
      // First play: slide already in viewport, no slide animation
      setCurrentSlide(newIndex);
      setSlidePhase("idle");
      loadAnimAt(newIndex, data);
      prevDirection.current = dir;
    } else {
      // Phase 1: position new slide off-screen (no transition)
      setPrevSlide(currentSlide);
      setCurrentSlide(newIndex);
      setSlidePhase("prep");

      // Phase 2: next frame → animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlidePhase("go");

          const dirChanged = prevDirection.current !== null && prevDirection.current !== dir;
          if (dirChanged || progress >= 0.8) {
            loadAnimAt(newIndex, data);
          } else {
            setTimeout(() => loadAnimAt(newIndex, data), 500);
          }
          prevDirection.current = dir;
        });
      });
    }

    prevIndex.current = newIndex;
  }, [activeCard]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animRefs.current.forEach(a => a?.destroy());
    };
  }, []);

  return (
    <section ref={sectionRef} style={{ width: "100%", marginBottom: 100 }}>
      <div style={{ display: "flex", maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px, 4vw, 60px)" }}>
        {/* Left: finanztools_container */}
        <div style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : undefined }}>

          {/* 1. Spacer — dynamisch berechnet, mit Newsletter-Container als Overlay */}
          <div style={{ width: "100%", height: "300px", position: "relative" }}>
            <div style={{ width: isMobile ? "100%" : 330, display: "flex", flexDirection: "column", gap: 9, alignSelf: "flex-start", alignItems: "flex-end" }}>
              <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)", textAlign: "right", marginTop: 72 }}>
                Newsletter
              </p>
              <p
                lang="de"
                style={{
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  fontWeight: 650,
                  fontSize: 16,
                  lineHeight: 1.3,
                  color: "var(--color-text-primary)",
                  textAlign: "right",
                  hyphens: "auto",
                  WebkitHyphens: "auto",
                  wordBreak: "break-word",
                }}
              >
                Bleiben Sie mit unserem Finanzleser.de<br />Newsletter immer auf dem neusten Stand!
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", width: "100%",  marginTop: 12 }}>
                <Button onClick={() => {}} label="Jetzt abonnieren" />
              </div>

              {/* Horizontale Linie */}
              <div style={{ width: isMobile ? "100%" : 330, height: 1, background: "rgba(0, 0, 0, 0.07)", marginTop: 30 }} />
            </div>

            {/* Visual — zwischen Newsletter und Sidebar */}
            {!isMobile && (
              <div style={{
                position: "absolute",
                top: 23,
                left: 370,
                right: 23,
                height: "30vw",
              }}>
                <InlineSVG src="/assets/visuals/mainVisualLanding.svg" style={{ width: "100%", height: "100%" }} />
              </div>
            )}
          </div>

          {/* 2. Subheading — sticky bottom */}
          <div style={{ width: isMobile ? "100%" : 330, height: "auto", position: "sticky", bottom: 140, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 256 }}>
            <p data-finanztools-heading style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)", margin: 0, textAlign: "right", paddingRight: 3 }}>
              Die Finanztools
            </p>
          </div>

          {/* 3. Heading */}
          <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: 0, textAlign: "right", width: isMobile ? "auto" : 330 }}>
            Alles in<br />eigener Hand
          </p>

          {/* 3. Lottie Slider — stacked, slides enter from left/right */}
          <div style={{ width: "100%", marginTop: isMobile ? -13 : -76, marginBottom: isMobile ? -130 : -270, overflow: "hidden", position: "relative" }}>
            {/* Sizing ghost — maintains aspect ratio */}
            <div style={{ width: "100%", aspectRatio: "1 / 1" }} />
            {TOOLS.map((_, i) => {
              const isCurrent = i === currentSlide;
              const isExiting = i === prevSlide && prevSlide !== currentSlide;
              const isVisible = isCurrent || isExiting;

              let tx: string;
              if (isCurrent) {
                // prep: start off-screen, go: animate to center
                tx = slidePhase === "prep"
                  ? (direction === "right" ? "100%" : "-100%")
                  : "0%";
              } else if (isExiting) {
                // prep: still at center, go: animate out
                tx = slidePhase === "prep"
                  ? "0%"
                  : (direction === "right" ? "-100%" : "100%");
              } else {
                // hidden off-screen
                tx = "100%";
              }

              return (
                <div
                  key={i}
                  ref={(el) => { lottieRefs.current[i] = el; }}
                  onTransitionEnd={() => {
                    if (isExiting) {
                      setSlidePhase("idle");
                      setPrevSlide(-1);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transform: `translateX(${tx})`,
                    transition: (isVisible && slidePhase === "go") ? "transform 0.5s ease" : "none",
                    visibility: isVisible ? "visible" : "hidden",
                  }}
                />
              );
            })}
          </div>

          {/* 4. Tool Cards — sticky bottom (desktop) / revolver (mobile) */}
          {isMobile ? (
            <div style={{ position: "sticky", bottom: 0, paddingTop: 23, paddingBottom: 16, width: "100%", zIndex: 10 }}>
              <RevolverSlider
                tools={TOOLS}
                activeIndex={activeCard !== null ? TOOLS.findIndex(t => t.title === activeCard) : 0}
                onActiveChange={(idx, fromIntro) => {
                  const title = TOOLS[idx].title;
                  if (activeCard !== title) setActiveCard(title);
                  // When clicking from intro state: scroll section bottom into view
                  if (fromIntro && sectionRef.current) {
                    const rect = sectionRef.current.getBoundingClientRect();
                    const sectionBottom = window.scrollY + rect.bottom;
                    const targetY = sectionBottom - window.innerHeight;
                    gsap.to(window, { scrollTo: { y: targetY }, duration: 0.8, ease: "power2.inOut" });
                  }
                }}
              />
            </div>
          ) : (
            <div ref={cardsRef} style={{ position: "sticky", bottom: 0, height: 150, display: "flex", alignItems: "flex-end", gap: 5, paddingTop: 23, paddingBottom: 23, marginLeft: -15 }}>
              {TOOLS.map((tool, idx) => {
                const isActive = activeCard === tool.title;
                const t = cardProgs[idx];

                const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
                const ss = (v: number) => v * v * (3 - 2 * v);
                const eo = (v: number) => 1 - (1 - v) * (1 - v);

                // tc: separates power2.out-Tween — Icon/Titel laufen synchron zur Karte ohne Clamp-Freeze
                const tc = contentProgs[idx];

                const cardWidth = 105 + 370 * t;
                const headerW = (105 + 370 * tc) - 54;

                // Phase 1 (0→0.67): Icon horizontal — easeOut, ~0.5s bei 0.75s Tween
                const iconTX = eo(clamp01(tc / 0.67));
                const iconLeft = ((headerW - 32) / 2) * (1 - iconTX);
                // Phase 2 (0.33→1.0): Icon vertikal + Titel paddingTop — easeOut, ~0.5s
                const tY = eo(clamp01((tc - 0.33) / 0.67));

                const tw = titleWidths[idx] || 0;
                const titleCenterX = (105 + 370 * tc - 54) / 2 - tw / 2;
                const titleTranslateX = titleCenterX * (1 - ss(clamp01(tc / 0.67))) + 40 * ss(clamp01(tc / 0.67));
                const titleFontSize = 13.5 + 10.5 * tc;

                const bgR = Math.round(255 + (250 - 255) * tc);
                const bgG = Math.round(255 + (249 - 255) * tc);
                const bgB = Math.round(255 + (246 - 255) * tc);

                return (
                  <div key={tool.title} style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
                    {idx > 0 && <div style={{ marginBottom: 50 }}><Spark /></div>}
                    <div
                      onClick={() => setActiveCard(isActive ? null : tool.title)}
                      style={{
                        background: `rgba(${bgR}, ${bgG}, ${bgB}, 0.8)`,
                        backdropFilter: `brightness(${1.3 - 0.3 * tc}) blur(${13 + 3 * tc}px)`,
                        WebkitBackdropFilter: `brightness(${1.3 - 0.3 * tc}) blur(${13 + 3 * tc}px)`,
                        boxShadow: `0 3px 23px rgba(0, 0, 0, ${0.02 * (1 - tc)})`,
                        border: `1px solid rgba(104, 108, 106, ${tc})`,
                        overflow: "hidden",
                        position: "relative",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: `23px 27px ${14 + 9 * tc}px`,
                        width: cardWidth,
                        borderRadius: 30 + 16 * tc,
                        willChange: "width, border-radius",
                      }}
                    >
                      {/* Icon + Title */}
                      <div style={{ position: "relative", overflow: "visible" }}>
                        <img
                          src={tool.icon}
                          alt=""
                          aria-hidden
                          style={{
                            position: "absolute",
                            width: 32,
                            height: 32,
                            objectFit: "contain",
                            left: iconLeft,
                            top: -2 + 10 * tY,
                          }}
                        />
                        <span
                          style={{
                            display: "block",
                            paddingTop: 34 * (1 - tY) + 8 * tY,
                            fontFamily: "var(--font-heading, 'Merriweather', serif)",
                            fontWeight: 600,
                            fontSize: titleFontSize,
                            color: "var(--color-text-primary)",
                            whiteSpace: "nowrap",
                            transform: `translateX(${titleTranslateX}px)`,
                            willChange: "transform",
                          }}
                        >
                          {tool.title}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div ref={(el) => { toolContentRefs.current[idx] = el; }} style={{ height: 0, opacity: 0 }}>
                        <div style={{ marginTop: 5 }}>
                          <div style={{ width: isMobile ? "100%" : 420, display: "flex", flexDirection: "column", gap: 20 }}>
                            <p style={{ fontFamily: "var(--font-body, 'Open Sans', sans-serif)", fontWeight: 400, fontSize: 17, lineHeight: 1.38, color: "var(--color-text-medium)", margin: 0 }}>
                              {tool.description}
                            </p>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <Button label={tool.cta} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lesezeichen — faded nach tc > 0.5 ein, vor tc < 0.5 aus */}
                      <div style={{
                          position: "absolute", top: 0, right: 36, width: 28,
                          opacity: Math.max(0, (tc - 0.5) * 2),
                          pointerEvents: "none",
                        }}>
                          <div style={{ width: 28, height: 9, background: tool.color }} />
                          <svg width="28" height="23" viewBox="0 0 28 23" fill="none" aria-hidden style={{ display: "block", marginTop: -1 }}>
                            <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={tool.color} />
                          </svg>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: preview_container */}
        {/* Vertical dot spacer */}
        <div style={{ width: 14, flexShrink: 0, alignSelf: "stretch", display: isMobile ? "none" : "flex", flexDirection: "column" }}>
          {/* Dots */}
          <div style={{
            flex: 1,
            marginTop: 72,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='9'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23686c6a' opacity='0.7'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat-y",
            backgroundPosition: "center top",
            backgroundSize: "3px 9px",
          }} />
          {/* Fade mask — fixed to viewport bottom */}
          <div style={{
            position: "sticky",
            bottom: 0,
            height: "33px",
            marginTop: "-33px",
            marginBottom: "-33px",
            background: "var(--color-bg-page)",
            pointerEvents: "none",
            zIndex: 2,
          }} />
          {/* Arrow */}
          <div style={{ position: "sticky", bottom: 23, display: "flex", justifyContent: "center", zIndex: 3 }}>
            <img src="/icons/arrow down.svg" alt="" style={{ width: 12, height: "auto" }} />
          </div>
        </div>

        {/* Right: preview_container */}
        <div style={{ width: 300, flexShrink: 0, alignSelf: "stretch", paddingTop: 72, paddingLeft: 23, display: isMobile ? "none" : "block" }}>
          <p style={{
            fontFamily: "'Merriweather', serif",
            fontSize: "18px",
            fontWeight: 700,
            lineHeight: 1.3,
            color: "var(--color-text-primary)",
            margin: "0 0 20px 0",
          }}>
            Neuste Beiträge
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 17, paddingTop: 3 }}>
            {(latestPosts.length > 0 ? latestPosts : posts).slice(0, 5).map((post, i) => {
              const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
              const category = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
              const postLink = `/${mainCategory?.slug || "beitraege"}/${category?.slug || "allgemein"}/${post.slug}`;

              return (
                <div
                  key={post.id}
                  ref={(el) => { if (el) sidebarCardRefs.current.set(i, el); }}
                  data-flip-id={`preview-${post.slug}-box`}
                  className="latest-post-item"
                  style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => {
                    openPreview({ ctx: sidebarPreviewCtx, currentIndex: i });
                    window.dispatchEvent(new CustomEvent("menu-opened", { detail: { extended: true } }));
                  }}
                >
                  <div data-card-text style={{ flex: 1, minWidth: 0 }}>
                    <p className="latest-post-category" style={{
                      fontSize: 11,
                      fontFamily: "var(--font-body)",
                      marginBottom: 4,
                      lineHeight: 1.3,
                      color: "var(--color-text-secondary)",
                    }}>
                      {post.title}
                    </p>
                    {post.beitragFelder?.beitragUntertitel && (
                      <p className="latest-post-title" style={{
                        fontSize: 16,
                        fontFamily: "var(--font-heading, 'Merriweather', serif)",
                        fontWeight: 650,
                        margin: "0 0 8px 0",
                        lineHeight: 1.35,
                        hyphens: "auto",
                        WebkitHyphens: "auto",
                        wordBreak: "break-word",
                      }} lang="de">
                        {post.beitragFelder.beitragUntertitel}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontSize: 13,
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        color: "var(--color-text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}>
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: "1px solid var(--color-text-secondary)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          ["--fill-0" as string]: "var(--color-text-secondary)",
                        }}>
                          <InlineSVG
                            src="/icons/info_i.svg"
                            alt="Info"
                            style={{ width: 5, height: 10 }}
                          />
                        </span>
                        Vorschau
                      </span>
                      <Link
                        href={postLink}
                        className="article-read-link"
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "13px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}>
                          Ratgeber lesen
                        </span>
                        <span
                          className="article-read-line"
                          style={{ height: 0, borderTop: "1px solid currentColor", flexShrink: 0 }}
                        />
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 17.45 15.77"
                          fill="none"
                          aria-hidden
                          style={{ flexShrink: 0, transform: "rotate(180deg)", marginLeft: "-12px" }}
                        >
                          <polyline
                            points="16.95 15.27 8.27 8.11 16.95 .5"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tool-Liste — wechselt je nach aktiver Card */}
          {activeCard && (() => {
            const toolMap: Record<string, { title: string; items: { title: string; slug: string }[] }> = {
              "Rechner": { title: "Unsere Rechner", items: rechner.slice(0, 4).map(r => ({ title: r.title, slug: r.slug })) },
              "Vergleiche": { title: "Unsere Vergleiche", items: [] },
              "Checklisten": { title: "Unsere Checklisten", items: checklisten.slice(0, 4).map(c => ({ title: c.title, slug: c.slug })) },
            };
            const tool = toolMap[activeCard];
            if (!tool || tool.items.length === 0) return null;

            const hrefBase = activeCard === "Rechner" ? "/finanztools/rechner" : activeCard === "Checklisten" ? "/finanztools/checklisten" : "/finanztools/vergleiche";

            return (
              <div style={{ marginTop: 30 }}>
                <p style={{
                  fontFamily: "'Merriweather', serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: "var(--color-text-primary)",
                  margin: "0 0 20px 0",
                }}>
                  {tool.title}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 17, paddingTop: 3 }}>
                  {tool.items.map((item) => (
                    <Link key={item.slug} href={`${hrefBase}/${item.slug}`} className="latest-post-item" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="latest-post-title" style={{
                          fontSize: 16,
                          fontFamily: "var(--font-heading, 'Merriweather', serif)",
                          fontWeight: 650,
                          margin: 0,
                          lineHeight: 1.3,
                          hyphens: "auto",
                          WebkitHyphens: "auto",
                          wordBreak: "break-word",
                        }} lang="de">
                          {item.title}
                        </p>
                      </div>
                      <div className="latest-post-icon" style={{
                        width: 50,
                        height: 50,
                        borderRadius: 23,
                        background: "transparent",
                        flexShrink: 0,
                      }} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
