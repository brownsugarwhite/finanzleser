"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useEffect, useRef, useState } from "react";
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

interface StickySparkHeadingProps {
  title: string;
  as?: "h1" | "h2" | "h3";
}

const DOCK_DURATION = 0.4;
const DOCK_EASE = "power2.out";
const DOCKED_FONT_SIZE = 25;
const HOME_FONT_SIZE_DESKTOP = 42;
const HOME_FONT_SIZE_MOBILE = 36;

export default function StickySparkHeading({ title, as = "h2" }: StickySparkHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLHeadingElement>(null);
  const leftSparksRef = useRef<HTMLDivElement>(null);
  const rightSparksRef = useRef<HTMLDivElement>(null);
  const leftLineRef = useRef<HTMLDivElement>(null);
  const rightLineRef = useRef<HTMLDivElement>(null);

  const isDockedRef = useRef(false);
  const homeParentRef = useRef<HTMLElement | null>(null);

  // Responsive Home-Font: Mobile 38, Desktop 42.
  const [homeFontSize, setHomeFontSize] = useState(HOME_FONT_SIZE_DESKTOP);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const apply = () => setHomeFontSize(mql.matches ? HOME_FONT_SIZE_MOBILE : HOME_FONT_SIZE_DESKTOP);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const tag = tagRef.current;
    const leftSparks = leftSparksRef.current;
    const rightSparks = rightSparksRef.current;
    const leftLine = leftLineRef.current;
    const rightLine = rightLineRef.current;
    if (!container || !tag || !leftSparks || !rightSparks || !leftLine || !rightLine) return;

    // Heim-Parent merken, damit wir beim Undock + Unmount sauber zurück appenden.
    // Der Heim-Wrapper hat in app/page.tsx feste Dimensionen (max-width 1200,
    // height 60), der Slot in LogoBar ebenfalls (220×30) — Flip morpht
    // zwischen zwei stabilen Boxen ohne Layout-Sprünge.
    homeParentRef.current = container.parentElement;

    const dock = () => {
      const target = document.getElementById("ratgeber-flip-target");
      if (!target || isDockedRef.current) return;
      isDockedRef.current = true;

      // Alle 4 Sparks individuell — jede SVG rotiert um ihren eigenen Mittelpunkt.
      const sparks = Array.from(container.querySelectorAll<SVGSVGElement>("svg"));

      // 1) State VOR Modifikationen erfassen. fontSize liegt auf dem Container
      //    (h2 erbt) — so animiert Flip die Schriftgröße ohne den h2 selbst
      //    aus dem Flex-Flow zu reißen. Container-Höhe schrumpft synchron mit
      //    Position-Morph → kein Snap am Ende durch geänderte natural-rest.
      const state = Flip.getState(container, { props: "padding,fontSize" });
      // 2) DOM + Styles auf Ziel-Zustand setzen (slot, padding 0, font 18).
      target.appendChild(container);
      container.style.width = "100%";
      container.style.padding = "0";
      container.style.fontSize = `${DOCKED_FONT_SIZE}px`;
      // 3) Flip + Sub-Animationen in einer Timeline, alle bei time 0 → garantiert
      //    synchroner Start und kein Konflikt mit Flip-internem Setup.
      const tl = gsap.timeline();
      tl.add(Flip.from(state, {
        duration: DOCK_DURATION,
        ease: DOCK_EASE,
        absolute: true,
        props: "padding,fontSize",
      }), 0);
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

      const state = Flip.getState(container, { props: "padding,fontSize" });
      home.appendChild(container);
      container.style.width = "";
      container.style.padding = "";
      // Live lesen — useEffect-deps sind [], also würde die State-Capture
      // bei einem späteren Mobile↔Desktop-Resize stale sein.
      const liveHomeFontSize = window.matchMedia("(max-width: 767px)").matches
        ? HOME_FONT_SIZE_MOBILE
        : HOME_FONT_SIZE_DESKTOP;
      container.style.fontSize = `${liveHomeFontSize}px`;
      const tl = gsap.timeline();
      tl.add(Flip.from(state, {
        duration: DOCK_DURATION,
        ease: DOCK_EASE,
        absolute: true,
        props: "padding,fontSize",
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

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        // Desktop: flip kurz bevor das Heading oben rausläuft (7% von top).
        // Mobile: früher (20%) — sonst dockt es zu spät.
        start: isMobile ? "top 20%" : "top 7%",
        onEnter: dock,
        onLeaveBack: undock,
      });
    });

    return () => {
      // Wenn beim Unmount noch gedockt: zurück in den Home-Parent appenden, damit
      // ctx.revert() den DOM nicht mit dem leeren Slot stehen lässt.
      if (isDockedRef.current && homeParentRef.current && container.parentElement !== homeParentRef.current) {
        homeParentRef.current.appendChild(container);
        container.style.width = "";
        container.style.maxWidth = "";
        container.style.margin = "";
        container.style.padding = "";
      }
      ctx?.revert();
    };
  }, []);

  const Tag = as;

  return (
    <div ref={containerRef} className="scalable-landing" style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      paddingLeft: 40,
      paddingRight: 40,
      boxSizing: "border-box",
      // fontSize hier setzen statt auf dem h2 — der h2 erbt es. Damit kann
      // Flip die fontSize allein auf dem Container animieren, ohne den h2
      // als Flip-Target (mit absolute:true) aus dem Flex-Flow zu reißen.
      fontSize: homeFontSize,
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
  );
}
