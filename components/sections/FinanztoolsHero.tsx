"use client";

import { useRef, useEffect, useState } from "react";
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
    icon: "/icons/rechner_icon.svg",
    anim: vergleicheAnim, // Platzhalter
  },
  {
    title: "Vergleiche",
    description: "Vergleichen Sie Tarife, Anbieter und Konditionen. Finden Sie das beste Angebot für Ihre Bedürfnisse.",
    cta: "Zu unseren Vergleichen",
    href: "/finanztools/vergleiche",
    color: "var(--color-tool-vergleiche)",
    icon: "/icons/vergleich_icon.svg",
    anim: vergleicheAnim,
  },
  {
    title: "Checklisten",
    description: "Unsere interaktiven Checklisten helfen Ihnen, nichts zu vergessen. Schritt für Schritt zum Ziel.",
    cta: "Zu unseren Checklisten",
    href: "/finanztools/checklisten",
    color: "var(--color-tool-checklisten)",
    icon: "/icons/checkliste_icon.svg",
    anim: vergleicheAnim, // Platzhalter
  },
];

export default function FinanztoolsHero({ posts = [], rechner = [], checklisten = [] }: { posts?: Post[]; rechner?: Rechner[]; checklisten?: Checkliste[] }) {
  const lottieRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const animRefs = useRef<(AnimationItem | null)[]>([null, null, null]);
  const cardsRef = useRef<HTMLDivElement>(null);
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
      <div style={{ display: "flex", maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px, 4vw, 40px)" }}>
        {/* Left: finanztools_container */}
        <div style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : undefined }}>

          {/* 1. Spacer — dynamisch berechnet, mit Newsletter-Container als Overlay */}
          <div style={{ width: "100%", height: "500px", position: "relative" }}>
            <div style={{ width: isMobile ? "100%" : 430, display: "flex", flexDirection: "column", gap: 9, alignSelf: "flex-start", alignItems: "flex-end", marginTop: 36 }}>
              <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)", textAlign: "right" }}>
                Newsletter
              </p>
              <p
                lang="de"
                style={{
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  fontWeight: 600,
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
              <div style={{ width: isMobile ? "100%" : 300, height: 1, background: "rgba(0, 0, 0, 0.07)", marginTop: 30 }} />
            </div>

            {/* Visual Platzhalter — zwischen Newsletter und Sidebar */}
            {!isMobile && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 460,
                right: 23,
                height: "30vw",
                background: "rgba(0, 0, 0, 0.06)",                
              }} />
            )}
          </div>

          {/* 2. Subheading — sticky bottom */}
          <div style={{ width: isMobile ? "100%" : 430, height: "auto", position: "sticky", bottom: 140, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 256 }}>
            <p data-finanztools-heading style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)", margin: 0, textAlign: "right", paddingRight: 3 }}>
              Die Finanztools
            </p>
          </div>

          {/* 3. Heading */}
          <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: 0, whiteSpace: isMobile ? "normal" : "nowrap", textAlign: "right", width: isMobile ? "auto" : 430 }}>
            Alles in eigener Hand
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
            <div ref={cardsRef} style={{ position: "sticky", bottom: 0, height: 150, display: "flex", alignItems: "flex-end", gap: 5, paddingTop: 23, paddingBottom: 23 }}>
              {TOOLS.map((tool, idx) => {
                const isActive = activeCard === tool.title;
                return (
                  <div key={tool.title} style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
                    {idx > 0 && <div style={{ marginBottom: 50 }}><Spark /></div>}
                    <div
                      onClick={() => setActiveCard(isActive ? null : tool.title)}
                      style={{
                        width: isActive ? 470 : 130,
                        borderRadius: isActive ? 36 : 23,
                        background: isActive ? "rgba(250, 249, 246, 0.8)" : "rgba(255, 255, 255, 0.8)",
                        backdropFilter: isActive ? "blur(16px)" : "brightness(1.3) blur(13px)",
                        WebkitBackdropFilter: isActive ? "blur(16px)" : "brightness(1.3) blur(13px)",
                        boxShadow: isActive ? "none" : "0 3px 23px rgba(0, 0, 0, 0.02)",
                        border: isActive ? "1px solid var(--color-text-medium)" : "none",
                        overflow: "hidden",
                        position: "relative",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: "27px 23px 23px 27px",
                        transition: "background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease, border 0.3s ease, width 0.3s ease, border-radius 0.3s ease",
                      }}
                    >
                      {/* Icon + Title */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: isActive ? "row" : "column",
                          alignItems: "center",
                          justifyContent: isActive ? "flex-start" : "center",
                          gap: isActive ? 10 : 6,
                          height: isActive ? "auto" : 50,
                        }}
                      >
                        <img
                          src={tool.icon}
                          alt=""
                          aria-hidden
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-heading, 'Merriweather', serif)",
                            fontSize: isActive ? 24 : 16,
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tool.title}
                        </span>
                      </div>

                      {/* Card Content */}
                      {isActive && (
                        <div style={{ marginTop: 9 }}>
                          <div style={{ width: isMobile ? "100%" : 420, display: "flex", flexDirection: "column", gap: 20 }}>
                            <p style={{ fontFamily: "var(--font-body, 'Open Sans', sans-serif)", fontWeight: 400, fontSize: 17, lineHeight: 1.38, color: "var(--color-text-medium)", margin: 0 }}>
                              {tool.description}
                            </p>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <Button label={tool.cta} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lesezeichen */}
                      {isActive && (
                        <div style={{ position: "absolute", top: 0, right: 36, width: 28 }}>
                          <div style={{ width: 28, height: 9, background: tool.color }} />
                          <svg width="28" height="23" viewBox="0 0 28 23" fill="none" aria-hidden style={{ display: "block", marginTop: -1 }}>
                            <path d="M13.9991 8.58256L28 22.5817V6.8343e-07L0 1.90735e-06L0 22.5817L13.9991 8.58256Z" fill={tool.color} />
                          </svg>
                        </div>
                      )}
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
            marginTop: 46,
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
        <div style={{ width: 300, flexShrink: 0, alignSelf: "stretch", paddingTop: 36, paddingLeft: 23, display: isMobile ? "none" : "block" }}>
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
            {posts.slice(0, 5).map((post) => {
              const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
              const category = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
              const postLink = `/${mainCategory?.slug || "beitraege"}/${category?.slug || "allgemein"}/${post.slug}`;

              return (
                <Link key={post.id} href={postLink} className="latest-post-item" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {category && (
                      <p className="latest-post-category" style={{
                        fontSize: 12,
                        fontFamily: "var(--font-body)",
                        marginBottom: 3,
                        lineHeight: 1.3,
                      }}>
                        {category.name}
                      </p>
                    )}
                    <p className="latest-post-title" style={{
                      fontSize: 16,
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      fontWeight: 600,
                      margin: 0,
                      lineHeight: 1.3,
                      hyphens: "auto",
                      WebkitHyphens: "auto",
                      wordBreak: "break-word",
                    }} lang="de">
                      {post.title}
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
                          fontWeight: 600,
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
