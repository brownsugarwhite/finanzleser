"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import Image from "next/image";
import gsap from "@/lib/gsapConfig";
import TopNav from "@/components/layout/TopNav";
import PoweredByLine from "@/components/ui/PoweredByLine";
import QuickLinksRow from "@/components/ui/QuickLinksRow";
import SearchPill from "@/components/sections/SearchPill";

export default function LandingIntro() {
  const heroRef = useRef<HTMLElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const mobileBubbleRef = useRef<HTMLDivElement>(null);
  const leoWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;

    // Hero an den Viewport-Top ziehen.
    if (heroRef.current) {
      const offset = heroRef.current.offsetTop;
      heroRef.current.style.marginTop = -offset + "px";
      heroRef.current.style.paddingTop = offset + "px";
    }
  }, []);

  // Expand search pill when Leo undocks
  useEffect(() => {
    const collapseSlot = (animate: boolean) => {
      const outer = outerRef.current;
      const wrap = leoWrapRef.current;
      const slot = document.getElementById("leo-dock-slot");
      if (!outer || !slot) return;

      if (animate) {
        gsap.to(slot, { width: 0, duration: 0.5, ease: "power2.inOut" });
        gsap.to(outer, { gap: 0, duration: 0.5, ease: "power2.inOut" });
        if (wrap) gsap.to(wrap, { width: 0, overflow: "hidden", duration: 0.5, ease: "power2.inOut" });
      } else {
        gsap.set(slot, { width: 0 });
        gsap.set(outer, { gap: 0 });
        if (wrap) gsap.set(wrap, { width: 0, overflow: "hidden" });
      }
    };

    // Already scrolled on mount → collapse immediately + hide bubble
    if (window.scrollY > 5) {
      collapseSlot(false);
      if (bubbleRef.current) gsap.set(bubbleRef.current, { opacity: 0 });
    }

    const handleUndock = () => {
      collapseSlot(true);
      if (bubbleRef.current) gsap.to(bubbleRef.current, { opacity: 0, y: -6, duration: 0.35, ease: "power2.in" });
    };
    window.addEventListener("leo-undocked", handleUndock);
    return () => window.removeEventListener("leo-undocked", handleUndock);
  }, []);

  // Mobile-Sprechblase (über dem fixed Leo unten rechts): scrollt mit (absolut in der
  // Section) und faded beim Scrollen aus.
  useEffect(() => {
    const el = mobileBubbleRef.current;
    if (!el || !window.matchMedia("(max-width: 767px)").matches) return;
    // Fixed neben Leo; faded AUS während „Alles in eigener Hand" einfadet (gleiche Schwelle:
    // Start an Button-Oberkante, voll bei 60% Viewport).
    const onScroll = () => {
      const allein = document.querySelector(".ftools-m-allein");
      const btns = document.querySelector(".ftools-m-stage");
      if (!allein || !btns) { el.style.opacity = "1"; return; }
      const start = btns.getBoundingClientRect().top;
      const range = Math.max(1, start - 0.6 * window.innerHeight);
      const p = Math.min(1, Math.max(0, (start - allein.getBoundingClientRect().top) / range));
      el.style.opacity = String(1 - p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Newsletter-Button (Mobile) ausbluren wenn die Bookmark-Suche aufgeht — gleicher
  // Mechanismus + Timing wie das Logo in LogoBar, damit beide synchron laufen.
  useEffect(() => {
    const isMobileMQ = () => window.matchMedia("(max-width: 767px)").matches;
    const getBtn = () => document.querySelector<HTMLElement>(".bookmark-newsletter");
    const onSearchOpen = () => {
      if (!isMobileMQ()) return;
      const el = getBtn();
      if (!el) return;
      gsap.to(el, { filter: "blur(8px)", opacity: 0, duration: 0.45, ease: "power2.inOut" });
    };
    const onSearchClose = () => {
      const el = getBtn();
      if (!el) return;
      gsap.to(el, {
        filter: "blur(0px)", opacity: 1, duration: 0.35, delay: 0.35, ease: "power2.out",
        onComplete: () => { el.style.filter = ""; },
      });
    };
    window.addEventListener("search-opened", onSearchOpen);
    window.addEventListener("search-closed", onSearchClose);
    return () => {
      window.removeEventListener("search-opened", onSearchOpen);
      window.removeEventListener("search-closed", onSearchClose);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="landing-hero"
      style={{
        backgroundColor: "var(--color-bg-page)",
        minHeight: "auto",
        position: "relative",
      }}
    >
      {/* Newsletter-Button (Mobile-Landing) — links auf Bookmark-Höhe, scrollt ganz normal mit */}
      <a
        data-scale-extended
        className="bookmark-newsletter"
        href="#newsletter"
        aria-label="Newsletter"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        <img src="/icons/iconNewsletter.svg" alt="" aria-hidden="true" />
        <span>Newsletter</span>
      </a>

      <div data-scale-extended className="landing-inner" style={{ maxWidth: "1200px", margin: "-16px auto 0px auto", padding: "0 24px" }}>
        {/* Logo */}
        <div className="landing-logo" style={{ display: "flex", justifyContent: "center", marginBottom: "11px" }}>
          <Image
            src="/icons/fl_logo.svg"
            alt="finanzleser"
            width={421}
            height={49}
            priority
            unoptimized
            style={{ width: "100%", maxWidth: "460px", height: "auto" }}
          />
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Merriweather', serif",
            fontSize: "18px",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--color-text-medium)",
            textAlign: "center",
            margin: "0 0 23px 0",
          }}
        >
          Das digitale Finanzmagazin
        </p>

        {/* Pill Bar + Leo */}
        <div
          ref={outerRef}
          className="landing-pillbar"
          style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 60 }}
        >
          {/* Geteiltes Such-Eingabefeld (identisch zur Suchseite). Wächst via flex:1,
              wenn Leo beim ersten Scroll abdockt (collapseSlot schrumpft den Slot). */}
          <div style={{ display: "flex", flex: 1, minWidth: 0 }}>
            <SearchPill />
          </div>

          {/* Leo Dock Slot + Speech Bubble (Desktop only — auf Mobile lebt Leo
              im sticky #leo-dock-slot-mobile oben in der Section). */}
          <div ref={leoWrapRef} className="landing-leo-wrap" style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
            {/* Speech bubble — fades out when Leo undocks */}
            <div
              ref={bubbleRef}
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 25,
                pointerEvents: "none",
              }}
            >
              <div style={{ position: "relative", width: 141, height: 81 }}>
                <svg width="141" height="81" viewBox="0 0 141 81" fill="none" style={{ display: "block" }}>
                  <path
                    d="M39 0.5H102C109.491 0.5 115.075 0.50021 119.475 0.916016C123.867 1.33112 127.029 2.1569 129.69 3.77539C132.769 5.64729 135.353 8.23137 137.225 11.3096C140.486 16.6722 140.5 20.9959 140.5 34C140.5 41.4986 140.499 45.8181 140.086 48.9561C139.678 52.0507 138.872 53.982 137.225 56.6904C135.353 59.7686 132.769 62.3527 129.69 64.2246C127.029 65.8431 123.867 66.6689 119.475 67.084C115.075 67.4998 109.491 67.5 102 67.5H36.7988L36.6533 67.6396L24.2842 79.5498L26.4912 67.958L26.5996 67.3867L26.0186 67.3643C19.159 67.1051 14.8065 66.3511 11.3096 64.2246C8.23137 62.3527 5.64729 59.7686 3.77539 56.6904C2.12841 53.982 1.32151 52.0507 0.914062 48.9561C0.500937 45.8181 0.5 41.4986 0.5 34C0.5 20.9959 0.514407 16.6722 3.77539 11.3096C5.64729 8.23137 8.23137 5.64729 11.3096 3.77539C13.9712 2.1569 17.1329 1.33112 21.5254 0.916016C25.9254 0.50021 31.5089 0.5 39 0.5Z"
                    fill="none"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth="1"
                  />
                </svg>
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: 68,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  fontFamily: "Merriweather, serif",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "rgba(0,0,0,0.55)",
                  lineHeight: 1.4,
                  pointerEvents: "none",
                }}>
                  <span>Fragen Sie unseren</span>
                  <span>KI-Agenten LEO</span>
                </div>
              </div>
            </div>
            <div
              id="leo-dock-slot"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 70,
                height: 70,
              }}
            />
          </div>
        </div>

      </div>

      {/* Nav Links */}
      <TopNav className="landing-nav" style={{ marginTop: "23px", alignItems: "center", paddingLeft: "0" }} />

      {/* DotLine + Powered by */}
      <div className="landing-dotline" style={{ position: "relative", zIndex: 51, width: "100%", display: "flex", justifyContent: "center", marginTop: "3px" }}>
        {/* Behält 1060px Breite, schrumpft aber unter ~1160px mit und hält dabei
            links + rechts 50px Abstand zum Bildrand (zentriert via .landing-dotline). */}
        <PoweredByLine showArrow style={{ width: "min(1060px, calc(100% - 100px))" }} />
      </div>

      {/* Schnellzugriff-Links 12px unter der Dotline (Landing). */}
      <div style={{ position: "relative", zIndex: 51, width: "100%", display: "flex", justifyContent: "center" }}>
        <QuickLinksRow style={{ width: "min(1060px, calc(100% - 100px))" }} />
      </div>

      {/* Mobile-Sprechblase über dem fixed Leo (unten rechts) — Blase gespiegelt (Tail
          zeigt nach unten-rechts), Text normal. Scrollt mit der Section + faded (JS). */}
      <div
        ref={mobileBubbleRef}
        data-scale-extended
        className="landing-bubble-mobile"
        aria-hidden
        style={{ position: "fixed", bottom: 89, right: 36, zIndex: 60, pointerEvents: "none" }}
      >
        <div style={{ position: "relative", width: 141, height: 81, transform: "scaleX(-1)" }}>
          <svg width="141" height="81" viewBox="0 0 141 81" fill="none" style={{ display: "block" }}>
            <path
              d="M39 0.5H102C109.491 0.5 115.075 0.50021 119.475 0.916016C123.867 1.33112 127.029 2.1569 129.69 3.77539C132.769 5.64729 135.353 8.23137 137.225 11.3096C140.486 16.6722 140.5 20.9959 140.5 34C140.5 41.4986 140.499 45.8181 140.086 48.9561C139.678 52.0507 138.872 53.982 137.225 56.6904C135.353 59.7686 132.769 62.3527 129.69 64.2246C127.029 65.8431 123.867 66.6689 119.475 67.084C115.075 67.4998 109.491 67.5 102 67.5H36.7988L36.6533 67.6396L24.2842 79.5498L26.4912 67.958L26.5996 67.3867L26.0186 67.3643C19.159 67.1051 14.8065 66.3511 11.3096 64.2246C8.23137 62.3527 5.64729 59.7686 3.77539 56.6904C2.12841 53.982 1.32151 52.0507 0.914062 48.9561C0.500937 45.8181 0.5 41.4986 0.5 34C0.5 20.9959 0.514407 16.6722 3.77539 11.3096C5.64729 8.23137 8.23137 5.64729 11.3096 3.77539C13.9712 2.1569 17.1329 1.33112 21.5254 0.916016C25.9254 0.50021 31.5089 0.5 39 0.5Z"
              fill="none"
              stroke="rgba(0,0,0,0.55)"
              strokeWidth="1"
            />
          </svg>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 68,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            fontFamily: "Merriweather, serif", fontStyle: "italic", fontSize: 13,
            color: "rgba(0,0,0,0.55)", lineHeight: 1.4, transform: "scaleX(-1)",
          }}>
            <span>Fragen Sie unseren</span>
            <span>KI-Agenten LEO</span>
          </div>
        </div>
      </div>

      <style>{`
        /* ── ≤1024px: Dotline raus, Pillbar (Search + Leo-Wrap)
              komplett aus, Logo rutscht 36px nach unten. Leo lebt im globalen Slot. ── */
        @media (max-width: 1024px) {
          .landing-dotline { display: none !important; }
          .landing-pillbar { display: none !important; }
        }
        /* Mobile-Sprechblase nur ≤767 */
        .landing-bubble-mobile { display: none; }
        @media (max-width: 767px) {
          .landing-bubble-mobile { display: block; }
          /* Logo erst auf Mobile nach unten schieben (vorher bleibt es wie bei >1024). */
          .landing-logo { margin-top: 16px !important; }
          /* Mobile-Seitenpadding clamp: 20px bei 400px → max 40px */
          .landing-inner { padding-left: clamp(20px, 5vw, 40px) !important; padding-right: clamp(20px, 5vw, 40px) !important; }
        }
      `}</style>
    </section>
  );
}
