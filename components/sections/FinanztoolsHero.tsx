"use client";

import { useRef, useEffect, useState } from "react";
import lottie from "lottie-web";
import type { AnimationItem } from "lottie-web";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Spark from "@/components/ui/Spark";
import vergleicheAnim from "@/assets/lottie/vergleicheAnim.json";
import type { Post } from "@/lib/types";

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
  },
  {
    title: "Vergleiche",
    description: "Vergleichen Sie Tarife, Anbieter und Konditionen. Finden Sie das beste Angebot für Ihre Bedürfnisse.",
    cta: "Zu unseren Vergleichen",
    href: "/finanztools/vergleiche",
    color: "var(--color-tool-vergleiche)",
  },
  {
    title: "Checklisten",
    description: "Unsere interaktiven Checklisten helfen Ihnen, nichts zu vergessen. Schritt für Schritt zum Ziel.",
    cta: "Zu unseren Checklisten",
    href: "/finanztools/checklisten",
    color: "var(--color-tool-checklisten)",
  },
];

export default function FinanztoolsHero({ posts = [] }: { posts?: Post[] }) {
  const lottieRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);


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

  function patchStrokes() {
    if (!lottieRef.current) return;
    lottieRef.current.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect').forEach(el => {
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      el.setAttribute('stroke-width', '1');
    });
  }

  function loadAnim(data: any) {
    if (!lottieRef.current) return;
    if (animRef.current) animRef.current.destroy();
    const anim = lottie.loadAnimation({
      container: lottieRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: data,
    });
    anim.addEventListener('DOMLoaded', () => patchStrokes());
    animRef.current = anim;
  }

  // Lottie — lazy load
  useEffect(() => {
    if (!lottieRef.current) return;
    const el = lottieRef.current;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        const anim = lottie.loadAnimation({
          container: el,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: vergleicheAnim,
        });
        animRef.current = anim;
        anim.addEventListener('DOMLoaded', () => patchStrokes());
      }
    }, { rootMargin: '200px' });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (animRef.current) animRef.current.destroy();
    };
  }, []);

  return (
    <section ref={sectionRef} style={{ width: "100%" }}>
      <div style={{ display: "flex", maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px, 4vw, 40px)" }}>
        {/* Left: finanztools_container */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* 1. Spacer — dynamisch berechnet */}
          <div style={{ height: "600px", width: "100%" }} />

          {/* 2. Subheading — sticky bottom */}
          <div style={{ width: 430, height: 23, position: "sticky", bottom: 140, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 700, fontSize: 19, lineHeight: 1.38, color: "var(--color-text-primary)", margin: 0, textAlign: "right", paddingRight: 3 }}>
              Die Finanztools
            </p>
          </div>

          {/* 3. Heading */}
          <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", textAlign: "right", width: 430 }}>
            Alles in eigener Hand
          </p>

          {/* 3. Lottie */}
          <div style={{ width: "100%", marginTop: -76, marginBottom: -270 }}>
            <div ref={lottieRef} style={{ width: "100%" }} />
            <div style={{ position: 'relative', top: -300, display: 'flex', gap: 12 }}>
              <button
                onClick={() => loadAnim(JSON.parse(JSON.stringify(vergleicheAnim)))}
                style={{
                  padding: '10px 24px',
                  borderRadius: 19,
                  border: 'none',
                  background: 'var(--color-pill-bg)',
                  backdropFilter: 'brightness(1.15)',
                  WebkitBackdropFilter: 'brightness(1.15)',
                  cursor: 'pointer',
                  fontFamily: 'Open Sans, sans-serif',
                  fontSize: 16,
                  color: 'var(--color-text-primary)',
                }}
              >
                → Von links
              </button>
              <button
                onClick={() => loadAnim(reverseBaselineTrim(vergleicheAnim))}
                style={{
                  padding: '10px 24px',
                  borderRadius: 19,
                  border: 'none',
                  background: 'var(--color-pill-bg)',
                  backdropFilter: 'brightness(1.15)',
                  WebkitBackdropFilter: 'brightness(1.15)',
                  cursor: 'pointer',
                  fontFamily: 'Open Sans, sans-serif',
                  fontSize: 16,
                  color: 'var(--color-text-primary)',
                }}
              >
                ← Von rechts
              </button>
            </div>
          </div>

          {/* 4. Tool Cards — sticky bottom */}
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
                      background: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "brightness(1.3) blur(13px)",
                      WebkitBackdropFilter: "brightness(1.3) blur(13px)",
                      overflow: "hidden",
                      position: "relative",
                      cursor: "pointer",
                      flexShrink: 0,
                      padding: "27px 23px 23px 27px",
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
                      <svg
                        viewBox="0 0 24 24" fill="none" aria-hidden
                        style={{ opacity: 0.5, width: isActive ? 28 : 36, height: isActive ? 28 : 36, flexShrink: 0 }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--color-text-primary)" strokeWidth="1.5" />
                        <path d="M8 12h8M12 8v8" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
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
                        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 20 }}>
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
        </div>

        {/* Right: preview_container */}
        {/* Vertical dot spacer */}
        <div style={{ width: 14, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
          {/* Dots */}
          <div style={{
            flex: 1,
            marginTop: 60,
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
        <div style={{ width: 300, flexShrink: 0, alignSelf: "stretch", paddingTop: 50, paddingLeft: 23 }}>
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
              const category = post.categories?.nodes?.[0];
              const mainCategory = post.categories?.nodes?.find(
                (cat) => cat.parent === null || cat.parent === 0
              );
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
        </div>
      </div>
    </section>
  );
}
