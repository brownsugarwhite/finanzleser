"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger, Flip } from "@/lib/gsapConfig";

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

interface SparkHeadingProps {
  title: string;
  as?: "h1" | "h2" | "h3";
  /**
   * Optional: ID einer Section. Wenn das untere Ende dieser Section beim
   * Scrollen den Viewport durchquert, wird das Heading scrubbed
   * ausgefadet + ausgeblurt.
   * Start: section.bottom == 50% viewport (vom top).
   * End:   section.bottom == 0%  viewport (= komplett raus).
   */
  fadeSectionId?: string;
}

const DOCK_DURATION = 0.4;
const DOCK_EASE = "power2.out";
const DOCKED_FONT_SIZE = 25;
const FADE_BLUR_MAX = 16;

export default function SparkHeading({ title, as = "h2", fadeSectionId }: SparkHeadingProps) {
  // Wrapper trägt padding + Box-Geometrie (CSS-Klasse), bleibt im Flow.
  // Container ist die reine Animations-Box (Flip ↔ Slot) — kein padding,
  // damit flex:1-Linien während Flip-absolute und nach dem Snap auf
  // mathematisch identischer Width-Basis sind → kein Sprung am Ende.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLHeadingElement>(null);
  const leftSparksRef = useRef<HTMLDivElement>(null);
  const rightSparksRef = useRef<HTMLDivElement>(null);
  const leftLineRef = useRef<HTMLDivElement>(null);
  const rightLineRef = useRef<HTMLDivElement>(null);

  const isDockedRef = useRef(false);
  const homeParentRef = useRef<HTMLElement | null>(null);
  const homeNextSiblingRef = useRef<Node | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const tag = tagRef.current;
    const leftSparks = leftSparksRef.current;
    const rightSparks = rightSparksRef.current;
    const leftLine = leftLineRef.current;
    const rightLine = rightLineRef.current;
    if (!container || !tag || !leftSparks || !rightSparks || !leftLine || !rightLine) return;

    homeParentRef.current = container.parentElement;

    const dock = () => {
      const target = document.getElementById("ratgeber-flip-target");
      if (!target || isDockedRef.current) return;
      isDockedRef.current = true;
      const sparks = Array.from(container.querySelectorAll<SVGSVGElement>("svg"));

      // Capture VOR Reparent — nur fontSize, kein padding mehr
      // (Padding lebt am Wrapper und ist hier irrelevant).
      const state = Flip.getState(container, { props: "fontSize" });
      homeNextSiblingRef.current = container.nextSibling;
      target.appendChild(container);
      container.style.fontSize = `${DOCKED_FONT_SIZE}px`;

      const tl = gsap.timeline();
      tl.add(Flip.from(state, {
        duration: DOCK_DURATION,
        ease: DOCK_EASE,
        absolute: true,
        props: "fontSize",
      }), 0);
      // KEIN clearProps bei Sparks — sie sollen am Ende bei scale:0
      // bleiben (versteckt im Slot), sonst springen sie zurück zu scale:1.
      sparks.forEach((spark) => {
        tl.fromTo(
          spark,
          { rotation: 0, scale: 1, transformOrigin: "50% 50%" },
          { rotation: 360, scale: 0, duration: DOCK_DURATION, ease: DOCK_EASE },
          0
        );
      });
      tl.fromTo(leftLine, { scaleX: 1 }, { scaleX: 0, transformOrigin: "right center", duration: DOCK_DURATION, ease: DOCK_EASE }, 0);
      tl.fromTo(rightLine, { scaleX: 1 }, { scaleX: 0, transformOrigin: "left center", duration: DOCK_DURATION, ease: DOCK_EASE }, 0);
    };

    const undock = () => {
      if (!isDockedRef.current) return;
      const home = homeParentRef.current;
      if (!home) return;
      isDockedRef.current = false;
      const sparks = Array.from(container.querySelectorAll<SVGSVGElement>("svg"));

      const state = Flip.getState(container, { props: "fontSize" });
      const sibling = homeNextSiblingRef.current;
      if (sibling && sibling.parentNode === home) {
        home.insertBefore(container, sibling);
      } else {
        home.appendChild(container);
      }
      // Inline-fontSize clearen → CSS-Klasse (responsive) greift wieder.
      container.style.fontSize = "";

      const tl = gsap.timeline();
      tl.add(Flip.from(state, {
        duration: DOCK_DURATION,
        ease: DOCK_EASE,
        absolute: true,
        props: "fontSize",
      }), 0);
      sparks.forEach((spark) => {
        tl.fromTo(
          spark,
          { rotation: 360, scale: 0, transformOrigin: "50% 50%" },
          { rotation: 0, scale: 1, duration: DOCK_DURATION, ease: DOCK_EASE },
          0
        );
      });
      tl.fromTo(leftLine, { scaleX: 0 }, { scaleX: 1, transformOrigin: "right center", duration: DOCK_DURATION, ease: DOCK_EASE }, 0);
      tl.fromTo(rightLine, { scaleX: 0 }, { scaleX: 1, transformOrigin: "left center", duration: DOCK_DURATION, ease: DOCK_EASE }, 0);
    };

    const dockInstant = () => {
      const target = document.getElementById("ratgeber-flip-target");
      if (!target || isDockedRef.current) return;
      isDockedRef.current = true;
      const sparks = Array.from(container.querySelectorAll<SVGSVGElement>("svg"));
      homeNextSiblingRef.current = container.nextSibling;
      target.appendChild(container);
      container.style.fontSize = `${DOCKED_FONT_SIZE}px`;
      sparks.forEach((spark) => {
        gsap.set(spark, { rotation: 360, scale: 0, transformOrigin: "50% 50%" });
      });
      gsap.set(leftLine, { scaleX: 0, transformOrigin: "right center" });
      gsap.set(rightLine, { scaleX: 0, transformOrigin: "left center" });
    };

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    let stTrigger: ScrollTrigger | null = null;
    const ctx = gsap.context(() => {
      stTrigger = ScrollTrigger.create({
        // Wrapper als Trigger, NICHT der Container — sonst tracked
        // ScrollTrigger nach dem Dock einen fixed-positionierten Trigger,
        // dessen Scroll-Position konstant bleibt → onLeaveBack feuert nie.
        trigger: wrapperRef.current,
        start: isMobile ? "top 15%" : "top 10%",
        onEnter: dock,
        onLeaveBack: undock,
      });

      // Scroll-Fade + Blur basierend auf einer Section weiter unten.
      // Greift unabhängig vom Dock-State — animiert das Container-Element
      // direkt, egal ob es im Heim-Wrapper oder im Slot lebt.
      if (fadeSectionId) {
        const fadeSection = document.getElementById(fadeSectionId);
        if (fadeSection) {
          ScrollTrigger.create({
            trigger: fadeSection,
            start: "bottom 50%",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              const c = containerRef.current;
              if (!c) return;
              const p = self.progress;
              c.style.opacity = String(1 - p);
              c.style.filter = `blur(${p * FADE_BLUR_MAX}px)`;
            },
          });
        }
      }
    });

    if (stTrigger && (stTrigger as ScrollTrigger).scroll() >= (stTrigger as ScrollTrigger).start) {
      dockInstant();
    }

    return () => {
      if (isDockedRef.current && homeParentRef.current && container.parentElement !== homeParentRef.current) {
        const home = homeParentRef.current;
        const sibling = homeNextSiblingRef.current;
        if (sibling && sibling.parentNode === home) {
          home.insertBefore(container, sibling);
        } else {
          home.appendChild(container);
        }
        container.style.fontSize = "";
        container.style.opacity = "";
        container.style.filter = "";
      }
      ctx?.revert();
    };
  }, [fadeSectionId]);

  const Tag = as;

  return (
    // Outer: padding + Box-Geometrie (kein positioning context).
    // Stage: positioning context (position:relative) UND Width = outer-
    // content-area. Container während Flip-absolute hat width:100% relativ
    // zur Stage-padding-box = 100% identisch zu natural-flow-Width. Kein Snap.
    <div className="spark-heading-outer">
      <div ref={wrapperRef} className="spark-heading-stage">
      <div ref={containerRef} className="scalable-landing spark-heading-container" style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 0,
        boxSizing: "border-box",
      }}>
        <div ref={leftLineRef} style={{ flex: 1, height: 1, background: "var(--color-text-primary)" }} />
        <div ref={leftSparksRef} style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 10, paddingRight: 4 }}>
          <SmallSpark />
          <LargeSpark />
        </div>
        <Tag ref={tagRef as React.RefObject<HTMLHeadingElement>} className="category-title" style={{
          fontFamily: "var(--font-heading, 'Merriweather', serif)",
          fontWeight: 700,
          fontStyle: "italic",
          // 1em statt expliziter Pixel — der h2 erbt damit 1:1 die Container-
          // fontSize. UA-Default für h2 ist 1.5em → ohne Override wäre der
          // Text 1.5× größer als gewünscht. Flip animiert nur Container-fontSize.
          fontSize: "1em",
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
        <div ref={rightSparksRef} style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4, paddingRight: 10 }}>
          <LargeSpark />
          <SmallSpark />
        </div>
        <div ref={rightLineRef} style={{ flex: 1, height: 1, background: "var(--color-text-primary)" }} />
      </div>
      </div>
    </div>
  );
}
