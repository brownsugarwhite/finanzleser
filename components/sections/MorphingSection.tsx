"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MorphingSectionProps {
  variant?: "default" | "inverted";
  zIndex?: number;
  heading?: string;
  text?: string;
  children?: React.ReactNode;
}

export default function MorphingSection({ variant = "default", zIndex, heading, text, children }: MorphingSectionProps) {
  const inverted = variant === "inverted";
  const resolvedZIndex = zIndex ?? (inverted ? 2 : 1);
  const innerSectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = innerSectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: inner,
          start: "top bottom",
          end: "top top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(section, {
        paddingLeft: "0px",
        paddingRight: "0px",
        ease: "power2.in",
      }, 0).to(inner, {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        ease: "power2.in",
      }, 0);
    });

    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") {
      requestAnimationFrame(onLoad);
    } else {
      window.addEventListener("load", onLoad);
    }
    const t = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        minHeight: 800,
        zIndex: resolvedZIndex,
        width: "100%",
      }}
    >
      {/* Morphing Section — absolute dahinter */}
      <section
        ref={innerSectionRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          paddingLeft: "10vw",
          paddingRight: "10vw",
          background: "transparent",
        }}
      >
        <div
          ref={innerRef}
          style={{
            width: "100%",
            minHeight: "230vh",
            position: "relative",
            background: inverted ? "var(--color-bg-page)" : "#fff",
            borderTopLeftRadius: 57,
            borderTopRightRadius: 57,
            boxShadow: inverted ? "none" : "0 3px 23px rgba(0, 0, 0, 0.02)",
            overflow: "hidden",
          }}
        >
          {/* Heading — über den Gradients */}
          {(heading || text) && (
            <div style={{ position: "relative", zIndex: 3, left: "50%", transform: "translateX(-50%)", width: "100vw" }}>
              <div style={{ padding: "70px calc(10vw + 70px) 0" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {heading && (
                    <h2 style={{
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      fontWeight: 600,
                      fontSize: 19,
                      lineHeight: 1.38,
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}>
                      {heading}
                    </h2>
                  )}
                  {text && (
                    <p style={{
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      fontWeight: 900,
                      fontSize: 40,
                      lineHeight: 1.3,
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}>
                      {text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Slider — unter den Gradients */}
          {children && (
            <div style={{ position: "absolute", zIndex: 1, left: "50%", transform: "translateX(-50%)", width: "100vw" }}>
              {children}
            </div>
          )}

          {/* Gradient Fade — links */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 250,
            background: `linear-gradient(to right, ${inverted ? "var(--color-bg-page)" : "#fff"}, transparent)`,
            pointerEvents: "none",
            zIndex: 2,
          }} />

          {/* Gradient Fade — rechts */}
          <div style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: 250,
            background: `linear-gradient(to left, ${inverted ? "var(--color-bg-page)" : "#fff"}, transparent)`,
            pointerEvents: "none",
            zIndex: 2,
          }} />
        </div>
      </section>
    </div>
  );
}
