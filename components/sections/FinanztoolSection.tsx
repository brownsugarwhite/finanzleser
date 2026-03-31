"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import lottie from "lottie-web";
import type { AnimationItem } from "lottie-web";
import Button from "@/components/ui/Button";
import InlineSVG from "@/components/ui/InlineSVG";
import vergleicheAnim from "@/assets/lottie/vergleicheAnim.json";

// Reverse the trim path direction of the "baseline" layer
// Swaps start/end keyframes so the stroke draws in the opposite direction
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

  // Original: start=0 (static), end=0→100 (animated)
  // Reversed: start=100→0 (animated), end=100 (static)
  const originalEnd = trim.e;
  trim.e = { a: 0, k: 100, ix: trim.e.ix };
  // Reverse the keyframe values: 0→100 becomes 100→0
  const reversedKeyframes = JSON.parse(JSON.stringify(originalEnd));
  if (reversedKeyframes.a === 1 && reversedKeyframes.k) {
    for (const kf of reversedKeyframes.k) {
      if (kf.s) kf.s = kf.s.map((v: number) => 100 - v);
    }
  }
  trim.s = reversedKeyframes;

  return data;
}

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

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
    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
  </svg>
);

function MiniCard({ title, desc }: { title: string; desc: string }) {
  const [infoHovered, setInfoHovered] = useState(false);
  return (
    <div style={{
      width: '100%',
      maxWidth: 200,
      background: 'rgba(181, 181, 181, 0.10)',
      borderRadius: 30,
      padding: 15,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      overflow: 'hidden',
    }}>
      <p lang="de" style={{
        fontFamily: "var(--font-body, 'Open Sans', sans-serif)",
        fontWeight: 600,
        fontSize: 17,
        lineHeight: 1.3,
        color: 'var(--color-text-primary)',
        margin: 0,
        hyphens: 'auto',
        WebkitHyphens: 'auto',
      }}>
        {title}
      </p>
      <p style={{
        fontFamily: "var(--font-body, 'Open Sans', sans-serif)",
        fontWeight: 400,
        fontSize: 15,
        lineHeight: 1.3,
        color: 'var(--color-text-medium)',
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {desc}
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}>
        <div
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: infoHovered ? 'none' : '1px solid var(--color-text-primary)',
            background: infoHovered ? 'var(--color-text-primary)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.1s, border 0.1s',
            ['--fill-0' as string]: infoHovered ? '#ffffff' : 'var(--color-text-primary)',
          }}>
          <InlineSVG
            src="/icons/info_i.svg"
            alt="Info"
            style={{ width: 9, height: 17 }}
          />
        </div>
        <div style={{
          width: 51,
          height: 42,
          borderRadius: 18,
          background: 'rgba(198, 200, 204, 0.23)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 5,
          cursor: 'pointer',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 14,
            backgroundColor: 'var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            paddingLeft: 1,
          }}>
            <svg width="11" height="15" viewBox="0 0 11 15" fill="none">
              <path d="M1.5 1.50009L9.5 7.50009L1.5 13.5001" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinanztoolSection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Heading scroll animation
  useEffect(() => {
    if (!headingRef.current) return;
    gsap.set(headingRef.current, { opacity: 0, filter: "blur(16px)" });
    gsap.to(headingRef.current, {
      opacity: 1, filter: "blur(0px)", ease: "power2.out",
      scrollTrigger: { trigger: headingRef.current, start: "bottom bottom", end: "bottom 70%", scrub: true },
    });
    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()); };
  }, []);

  // Patch all strokes to 1px non-scaling
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

  // Lottie animation — lazy load when visible
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
    <section style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 4vw, 40px)" }}>
      <div style={{ display: "flex", gap: 24, marginTop: "-100vh" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Heading */}
          <div ref={headingRef} style={{ marginTop: "100vh" }}>
            <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontStyle: "italic", fontWeight: 300, fontSize: 21, lineHeight: 1.38, color: "var(--color-text-medium)", margin: 0 }}>
              Die Finanztools
            </p>
            <p style={{ fontFamily: "var(--font-heading, 'Merriweather', serif)", fontWeight: 900, fontSize: 40, lineHeight: 1.3, color: "var(--color-text-primary)", margin: 0, whiteSpace: "nowrap" }}>
              Alles in eigener Hand
            </p>
          </div>

          {/* Lottie Animation */}
          <div style={{ width: "100%", marginTop: -76 }}>
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

          {/* Finanztool Slider */}
          <div style={{ position: "sticky", bottom: 0, height: 150, display: "flex", alignItems: "flex-end", gap: 5, paddingTop: 23, paddingBottom: 23 }}>
            {TOOLS.map((tool, idx) => {
              const isActive = activeCard === tool.title;
              return (
                <div key={tool.title} style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
                  {idx > 0 && <div style={{ marginBottom: 50 }}><Spark /></div>}
                  <div
                    onClick={() => setActiveCard(isActive ? null : tool.title)}
                    style={{
                      width: isActive ? 470 : 150,
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

        {/* Preview Wrapper */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 0, paddingTop: '100vh' }}>
          {/* Heading */}
          <p style={{
            fontFamily: "Merriweather, serif",
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.3,
            color: "var(--color-text-primary)",
            margin: "0 0 20px 0",
            textAlign: 'right',
          }}>
            Neuste<br />Rechner
          </p>

          {/* Mini Cards */}
          {[
            { title: "Rentenbesteuerung Rechner 2026", desc: "Die Rentenbesteuerung bezieht sich auf die Besteuerung von Einkommen aus..." },
            { title: "Rentenrechner 2026", desc: "Die mittels dem Rentenrechner ermittelte Rentenversicherung dient grundsätzlich..." },
            { title: "Altersteilzeitrechner 2026", desc: "Die Altersteilzeit und die Frührente kann nach dem Altersteilzeitrechner und dem..." },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {idx > 0 && (
                <div style={{ padding: '10px 0' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden>
                    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                  </svg>
                </div>
              )}
              <MiniCard title={item.title} desc={item.desc} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
