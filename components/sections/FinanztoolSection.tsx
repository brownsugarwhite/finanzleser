"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function FinanztoolSection() {
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;

    gsap.set(headingRef.current, { opacity: 0, filter: "blur(16px)" });

    gsap.to(headingRef.current, {
      opacity: 1,
      filter: "blur(0px)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: headingRef.current,
        start: "bottom bottom",
        end: "bottom 70%",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 clamp(20px, 4vw, 40px)",
      }}
    >
      <div style={{ display: "flex", gap: 24, marginTop: "-100vh" }}>
        {/* Finanztool Wrapper */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Heading */}
          <div ref={headingRef} style={{ marginTop: "100vh" }}>
            <p
              style={{
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: 21,
                lineHeight: 1.38,
                color: "var(--color-text-medium)",
                margin: 0,
              }}
            >
              Die Finanztools
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                fontWeight: 900,
                fontSize: 40,
                lineHeight: 1.3,
                color: "var(--color-text-primary)",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Alles in eigener Hand
            </p>
          </div>

          {/* Lottie Wrapper (Platzhalter) */}
          <div
            style={{
              minHeight: 600,
              width: "100%",
              marginTop: 24,
              background: "var(--color-bg-subtle)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-medium)",
              fontSize: 14,
            }}
          >
            Lottie Animation Platzhalter
          </div>

          {/* Finanztool Slider */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              display: "flex",
              gap: 5,
              paddingTop: 23,
              paddingBottom: 23,
            }}
          >
            {["Rechner", "Vergleiche", "Checklisten"].map((label, idx) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {idx > 0 && (
                  <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
                  </svg>
                )}
                <div
                  style={{
                    width: 150,
                    flexShrink: 0,
                    height: 90,
                    borderRadius: 23,
                    background: "rgba(245, 245, 245, 0.8)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    display: "flex",
                    flexDirection: "column" as const,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity: 0.5 }}>
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--color-text-primary)" strokeWidth="1.5" />
                    <path d="M8 12h8M12 8v8" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Wrapper */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
          }}
        />
      </div>
    </section>
  );
}
