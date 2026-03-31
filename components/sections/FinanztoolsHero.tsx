"use client";

import { useRef, useEffect, useState } from "react";
import lottie from "lottie-web";
import type { AnimationItem } from "lottie-web";
import Button from "@/components/ui/Button";
import vergleicheAnim from "@/assets/lottie/vergleicheAnim.json";

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

const Spark = () => (
  <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
  </svg>
);

export default function FinanztoolsHero() {
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
      <div style={{ display: "flex", gap: 24, maxWidth: 1400, padding: "0 clamp(20px, 4vw, 40px)" }}>
        {/* Left: finanztools_container */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* 1. Spacer — dynamisch berechnet */}
          <div style={{ height: "calc(50vh - 220px)", width: "100%" }} />

          {/* 2. Heading — sticky bottom */}
          <div style={{ width: 460, height: 100, position: "sticky", bottom: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontStyle: "italic", fontWeight: 300, fontSize: 21, lineHeight: 1.38, color: "var(--color-text-medium)", margin: 0, textAlign: "right", paddingRight: 3 }}>
              Die Finanztools
            </p>
            <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap", textAlign: "right" }}>
              Alles in eigener Hand
            </p>
          </div>

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
                  background: 'rgba(198, 200, 204, 0.23)',
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
                  background: 'rgba(198, 200, 204, 0.23)',
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
                      width: isActive ? 470 : 140,
                      borderRadius: isActive ? 36 : 23,
                      background: "var(--color-tool-card-bg)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
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
        <div style={{ width: 300, flexShrink: 0 }} />
      </div>
    </section>
  );
}
