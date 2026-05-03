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

interface SparkHeadingProps {
  title: string;
  as?: "h1" | "h2" | "h3";
}

const DOCK_DURATION = 0.4;
const DOCK_EASE = "power2.out";
const DOCKED_FONT_SIZE = 25;
const HOME_FONT_SIZE_DESKTOP = 42;
const HOME_FONT_SIZE_MOBILE = 36;

export default function SparkHeading({ title, as = "h2" }: SparkHeadingProps) {
  // Outer wrapper bleibt immer im Flow — wird als ScrollTrigger-Trigger
  // verwendet, damit der Trigger funktioniert auch nachdem der innere
  // Container in den fixed-positionierten Slot gemorpht wurde.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLHeadingElement>(null);
  const leftSparksRef = useRef<HTMLDivElement>(null);
  const rightSparksRef = useRef<HTMLDivElement>(null);
  const leftLineRef = useRef<HTMLDivElement>(null);
  const rightLineRef = useRef<HTMLDivElement>(null);

  const isDockedRef = useRef(false);
  const homeParentRef = useRef<HTMLElement | null>(null);
  // Original-Nachbar im DOM merken — damit Undock per insertBefore die
  // exakte Position wiederherstellt. Bei Kategorie-Seiten hat das Heading
  // Geschwister im Parent (CategoryHeader rendert pre/post-Heading-Divs);
  // appendChild würde das Heading ans Ende werfen → Flip-Endposition falsch.
  const homeNextSiblingRef = useRef<Node | null>(null);

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
      // Original-Nachbar merken VOR dem reparent.
      homeNextSiblingRef.current = container.nextSibling;
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
      // Mit insertBefore an Original-Position einfügen, falls Nachbar
      // noch im selben Parent ist; sonst Fallback appendChild.
      const sibling = homeNextSiblingRef.current;
      if (sibling && sibling.parentNode === home) {
        home.insertBefore(container, sibling);
      } else {
        home.appendChild(container);
      }
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

    // Instant-Dock ohne Animation — für Page-Load wenn bereits an
    // gedockter Scroll-Position (ScrollTrigger feuert onEnter nur bei
    // tatsächlichem Crossing in der aktuellen Session).
    const dockInstant = () => {
      const target = document.getElementById("ratgeber-flip-target");
      if (!target || isDockedRef.current) return;
      isDockedRef.current = true;
      const sparks = Array.from(container.querySelectorAll<SVGSVGElement>("svg"));
      homeNextSiblingRef.current = container.nextSibling;
      target.appendChild(container);
      container.style.width = "100%";
      container.style.padding = "0";
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
        // Desktop: flip kurz bevor das Heading oben rausläuft (7% von top).
        // Mobile: früher (20%) — sonst dockt es zu spät.
        start: isMobile ? "top 20%" : "top 7%",
        onEnter: dock,
        onLeaveBack: undock,
      });
    });

    // Initial-State prüfen: wenn schon gescrollt → instant dock.
    if (stTrigger && (stTrigger as ScrollTrigger).scroll() >= (stTrigger as ScrollTrigger).start) {
      dockInstant();
    }

    return () => {
      // Wenn beim Unmount noch gedockt: an Original-Position zurück, damit
      // ctx.revert() den DOM nicht mit dem leeren Slot stehen lässt.
      if (isDockedRef.current && homeParentRef.current && container.parentElement !== homeParentRef.current) {
        const home = homeParentRef.current;
        const sibling = homeNextSiblingRef.current;
        if (sibling && sibling.parentNode === home) {
          home.insertBefore(container, sibling);
        } else {
          home.appendChild(container);
        }
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
    // Outer wrapper mit fester Höhe — reserviert den Layout-Platz, damit
    // beim Flip-Dock (Container wird in den Slot reparented) keine Geschwister
    // hochrutschen und der Undock visuell wieder an die Original-Position
    // landet. Wird intern statt extern gerendert, damit Kategorie-Seiten
    // (CategoryHeader rendert das Heading direkt im Fragment) auch funktionieren.
    // Dient gleichzeitig als ScrollTrigger-Trigger (bleibt immer im Flow).
    <div ref={wrapperRef} style={{
      width: "100%",
      maxWidth: 1200,
      margin: "0 auto",
      height: 60,
    }}>
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
    </div>
  );
}
