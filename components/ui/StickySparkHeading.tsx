"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";

function SmallSpark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
    </svg>
  );
}

function LargeSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block", flexShrink: 0 }}>
      <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)" />
    </svg>
  );
}

interface StickySparkHeadingProps {
  title: string;
  as?: "h1" | "h2" | "h3";
  top?: number;
  zIndex?: number;
}

export default function StickySparkHeading({ title, as = "h2", top = 21, zIndex = 51 }: StickySparkHeadingProps) {
  const sparksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sparksRef.current;
    if (!el) return;
    const sparks = el.querySelectorAll<SVGSVGElement>("svg");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { paddingLeft: 0, paddingRight: 0 },
        {
          paddingLeft: 200,
          paddingRight: 200,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 60%",
            end: `top ${top}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
      gsap.fromTo(
        sparks,
        { rotation: 0, transformOrigin: "50% 50%" },
        {
          rotation: 360,
          transformOrigin: "50% 50%",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 60%",
            end: `top ${top}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });
    return () => ctx.revert();
  }, [top]);

  const Tag = as;

  return (
    <div ref={sparksRef} className="scalable-landing" style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      position: "sticky",
      top,
      zIndex,
      paddingLeft: 40,
      paddingRight: 40,
      boxSizing: "border-box",
    }}>
      <div style={{ flex: 1, height: 1, background: "var(--color-text-primary)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 10, paddingRight: 4 }}>
        <SmallSpark />
        <LargeSpark />
      </div>
      <Tag className="category-title" style={{
        fontFamily: "var(--font-heading, 'Merriweather', serif)",
        fontWeight: 700,
        fontStyle: "italic",
        fontSize: 42,
        color: "var(--color-text-primary)",
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        margin: 0,
        padding: 0,
      }}>
        {title}
      </Tag>
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4, paddingRight: 10 }}>
        <LargeSpark />
        <SmallSpark />
      </div>
      <div style={{ flex: 1, height: 1, background: "var(--color-text-primary)" }} />
    </div>
  );
}
