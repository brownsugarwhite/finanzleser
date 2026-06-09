"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react";
import gsap from "@/lib/gsapConfig";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Spark from "@/components/ui/Spark";
import RevolverSlider from "@/components/ui/RevolverSlider";
import { isMainCategory } from "@/lib/categories";
import type { Post } from "@/lib/types";
import { useArticlePreview } from "@/components/sections/ArticlePreviewProvider";
import { openOverlay } from "@/lib/overlayController";
import type { PreviewSliderContext } from "@/components/sections/ArticleSliderContext";
import InlineSVG from "@/components/ui/InlineSVG";

const TOOLS = [
  {
    title: "Rechner",
    description: "Profitieren Sie von unseren tagesaktuellen Rechnern. Zögern Sie nicht. Sie können noch heute anfangen zu sparen!",
    cta: "Zu unseren Rechnern",
    href: "/finanztools/rechner",
    color: "var(--color-tool-rechner)",
    icon: "/icons/iconRechner.svg",
    image: "/assets/finanztoolSlider/rechner_visual.png",
  },
  {
    title: "Vergleiche",
    description: "Vergleichen Sie Tarife, Anbieter und Konditionen. Finden Sie das beste Angebot für Ihre Bedürfnisse.",
    cta: "Zu unseren Vergleichen",
    href: "/finanztools/vergleiche",
    color: "var(--color-tool-vergleiche)",
    icon: "/icons/iconVergleich.svg",
    image: "/assets/finanztoolSlider/vergleich_visual.png",
  },
  {
    title: "Checklisten",
    description: "Unsere interaktiven Checklisten helfen Ihnen, nichts zu vergessen. Schritt für Schritt zum Ziel.",
    cta: "Zu unseren Checklisten",
    href: "/finanztools/checklisten",
    color: "var(--color-tool-checklisten)",
    icon: "/icons/iconCheckliste.svg",
    image: "/assets/finanztoolSlider/checklisten_visual.png",
  },
];

// Intro-Bild — sichtbar wenn kein Tool aktiv ist (Slide-Index 3)
const INTRO_IMAGE = "/assets/finanztoolSlider/toolbox.png";

// Tool-Bilder etwas kleiner als das Toolbox-Intro
const TOOL_IMAGE_SCALE = "88%";

export default function FinanztoolsHero({ posts = [], latestPosts = [] }: { posts?: Post[]; latestPosts?: Post[] }) {
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
  const alleinHandRef = useRef<HTMLParagraphElement>(null);
  const activeCardRef = useRef<string | null>(null);
  const isScrollingToTarget = useRef(false);
  const lastPastRef = useRef(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Intro-Progress: füllt sich am Auto-Expand-Trigger in 3s, danach öffnet Rechner.
  const [introProgress, setIntroProgress] = useState(0);
  const introProgObj = useRef({ v: 0 });
  const introTweenRef = useRef<gsap.core.Tween | null>(null);

  // Aktueller Slide-Index: 3 (Intro) wenn kein Tool aktiv, sonst Tool-Index.
  // Crossfade läuft rein über opacity (siehe Render), keine Richtungs-/Phasen-Logik nötig.
  const currentSlide = activeCard === null ? 3 : TOOLS.findIndex((t) => t.title === activeCard);

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

  useLayoutEffect(() => {
    cardProgObjs.current.forEach(obj => gsap.killTweensOf(obj));
    toolContentRefs.current.forEach((el) => {
      if (el) gsap.set(el, { height: 0, opacity: 0 });
    });
    if (alleinHandRef.current) {
      gsap.set(alleinHandRef.current, { opacity: 0, filter: "blur(10px)", y: 30 });
    }
  }, []);

  useEffect(() => {
    const el = alleinHandRef.current;
    const trigger = document.querySelector("[data-finanztools-heading]") as HTMLElement;
    if (!el || !trigger) return;

    const onScroll = () => {
      const rect = trigger.getBoundingClientRect();
      const vh = window.innerHeight;
      // Start wenn Die Finanztools seine sticky-Position verlässt (bottom = vh - 140)
      // Ende wenn es bei 50% Viewport angekommen ist
      const startTop = vh - 140 - trigger.offsetHeight;
      const endTop = vh * 0.5;
      const progress = Math.max(0, Math.min(1, (startTop - rect.top) / (startTop - endTop)));
      gsap.set(el, {
        opacity: progress,
        filter: `blur(${10 * (1 - progress)}px)`,
        y: 30 * (1 - progress),
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
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

  // Sync activeCard → ref (readable inside scroll listeners without closure stale-value issues)
  useEffect(() => { activeCardRef.current = activeCard; }, [activeCard]);

  // Auto-expand Rechner when buttons leave sticky-bottom; always collapse when scrolling back up.
  // Am Trigger-Punkt füllt sich erst der Intro-Progress-Bar (3s), danach öffnet Rechner.
  useEffect(() => {
    const cancelFill = () => {
      if (introTweenRef.current) {
        introTweenRef.current.kill();
        introTweenRef.current = null;
      }
      introProgObj.current.v = 0;
      setIntroProgress(0);
    };
    const onScroll = () => {
      // Skip while GSAP is programmatically scrolling to avoid premature collapse mid-animation
      if (isScrollingToTarget.current || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const pastExit = rect.bottom <= window.innerHeight;

      // Scrolled back above exit: cancel a pending fill + collapse any open card
      if (!pastExit) {
        cancelFill();
        if (activeCardRef.current !== null) setActiveCard(null);
        lastPastRef.current = false;
        return;
      }

      // Edge-detection for expand: only trigger on the crossing, not continuously
      if (pastExit !== lastPastRef.current) {
        lastPastRef.current = pastExit;
        if (activeCardRef.current === null && !introTweenRef.current) {
          // Progress-Bar in 3s füllen, dann Rechner öffnen
          introTweenRef.current = gsap.to(introProgObj.current, {
            v: 1,
            duration: 3,
            ease: "none",
            onUpdate: () => setIntroProgress(introProgObj.current.v),
            onComplete: () => {
              introTweenRef.current = null;
              if (activeCardRef.current === null) setActiveCard("Rechner");
            },
          });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      introTweenRef.current?.kill();
    };
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

  return (
    <section ref={sectionRef} style={{ width: "100%", marginBottom: 100 }}>
      <div style={{ display: "flex", maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px, 4vw, 60px)" }}>
        {/* Left: finanztools_container */}
        <div className="ftools-left-col">

          {/* 1. Spacer — dynamisch berechnet, mit Newsletter-Container als Overlay */}
          <div className="ftools-spacer" style={{ width: "100%", height: "390px", position: "relative" }}>
            <div className="ftools-newsletter-box" style={{ width: 330, display: "flex", flexDirection: "column", gap: 9, alignSelf: "flex-start", alignItems: "flex-end" }}>
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
                <div style={{ width: 330, height: 1, background: "rgba(0, 0, 0, 0.07)", marginTop: 30 }} />
              </div>

            {/* Visual — Desktop: zwischen Newsletter und Sidebar (absolute);
                Mobile: full-bleed über Bildschirmbreite. CSS-toggle (statt
                JS-Ternary) damit Mobile-SSR nicht initial in Desktop-Position
                rendert und dann hüpft. */}
            <div className="ftools-visual-wrap">
              <img src="/assets/visuals/mainVisualLanding.png" alt="" aria-hidden style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>

          {/* 2. Subheading + Heading — sticky bottom */}
          <div className="ftools-subheading-row" style={{ width: "100%", height: "auto", position: "sticky", bottom: 140, display: "flex", paddingTop: 256 }}>
            <p data-finanztools-heading className="ftools-subheading-text" style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)" }}>
              Die Finanztools
            </p>
            <p ref={alleinHandRef} style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: 0, opacity: 0 }}>
              Alles in eigener Hand
            </p>
          </div>

          {/* 3. Visual-Slider — gestapelte Bilder, Crossfade zwischen den Slides.
              Toolbox-Intro (volle Breite) treibt die Höhe und ist zugleich Slide 3;
              die 3 Tool-Bilder liegen etwas kleiner + oben zentriert darüber.
              Später durch Animationen/Videos ersetzbar. */}
          <div className="ftools-lottie-slider" style={{ width: "100%", position: "relative", marginTop: 36 }}>
            <img
              src={INTRO_IMAGE}
              alt=""
              aria-hidden
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                opacity: currentSlide === 3 ? 1 : 0,
                transition: "opacity 0.5s ease",
              }}
            />
            {TOOLS.map((tool, i) => (
              <img
                key={i}
                src={tool.image}
                alt=""
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: TOOL_IMAGE_SCALE,
                  height: "auto",
                  opacity: i === currentSlide ? 1 : 0,
                  transition: "opacity 0.5s ease",
                  pointerEvents: "none",
                }}
              />
            ))}
          </div>

          {/* Intro-Progress-Bar (Apple-Style) — zentriert unter dem Slider.
              Füllt am Auto-Expand-Trigger in 3s, dann öffnet Rechner. */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <div
              style={{
                width: 140,
                height: 5,
                borderRadius: 999,
                background: "rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
                opacity: currentSlide === 3 ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            >
              <div
                style={{
                  width: `${introProgress * 100}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "var(--color-brand)",
                }}
              />
            </div>
          </div>

          {/* 4. Tool Cards — Mobile: RevolverSlider; Desktop: sticky cards row.
              Beide rendern + CSS-toggle (.ftools-cards-mobile / -desktop) damit
              SSR-HTML viewport-konsistent ist und kein Hydration-Reflow auftritt. */}
          <div className="ftools-cards-mobile" style={{ position: "sticky", bottom: 0, paddingTop: 23, paddingBottom: 16, width: "100%", zIndex: 10 }}>
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
          <div ref={cardsRef} className="ftools-cards-desktop" style={{ position: "sticky", bottom: 0, height: 150, alignItems: "flex-end", gap: 5, paddingTop: 23, paddingBottom: 23, marginLeft: -15 }}>
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
                      onClick={() => {
                        const wasNoneActive = activeCardRef.current === null;
                        setActiveCard(isActive ? null : tool.title);
                        if (wasNoneActive && sectionRef.current) {
                          const rect = sectionRef.current.getBoundingClientRect();
                          const pastExit = rect.bottom <= window.innerHeight;
                          if (!pastExit) {
                            const targetY = window.scrollY + rect.bottom - window.innerHeight;
                            isScrollingToTarget.current = true;
                            gsap.to(window, {
                              scrollTo: { y: Math.max(0, targetY) },
                              duration: 0.8,
                              ease: "power2.inOut",
                              onComplete: () => {
                                isScrollingToTarget.current = false;
                                if (sectionRef.current) {
                                  lastPastRef.current = sectionRef.current.getBoundingClientRect().bottom <= window.innerHeight;
                                }
                              },
                            });
                          }
                        }
                      }}
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
                          <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 20 }}>
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
        </div>

        {/* Right: preview_container */}
        {/* Vertical dot spacer */}
        <div className="ftools-right-spacer" style={{ width: 14, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
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
        <div className="ftools-right-preview" style={{ width: 300, flexShrink: 0, alignSelf: "stretch", paddingTop: 72, paddingLeft: 23, display: "block" }}>
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
            {(latestPosts.length > 0 ? latestPosts : posts).slice(0, 3).map((post, i) => {
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
                    // Über den Controller → schließt ggf. ein anderes Overlay, Blur sofort.
                    openOverlay("preview", { extended: true });
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

        </div>
      </div>
    </section>
  );
}
