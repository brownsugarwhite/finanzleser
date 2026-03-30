"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";

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

export default function FinanztoolSection() {
  const headingRef = useRef<HTMLDivElement>(null);
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

          {/* Lottie Platzhalter */}
          <div style={{ minHeight: 450, width: "100%", marginTop: 24, background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-medium)", fontSize: 14 }}>
            Lottie Animation Platzhalter
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
        <div style={{ width: 300, flexShrink: 0 }} />
      </div>
    </section>
  );
}
