"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import Image from "next/image";
import { useRef, useCallback, useState, useEffect, useLayoutEffect } from "react";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

/* ── Constants ── */

const BURGER_LINE_W = 20;
const BURGER_GAP = 5;
const BTN_BORDER_RADIUS = 15;
const BTN_HEIGHT = 36;
const BTN_PADDING = 10;
const BOOKMARK_H = 50;

const SEARCH_W = 270;
const GLASS_H = 70;
const GLASS_R = 30;

const GLASS_STYLE = {
  background: "rgba(255,255,255,0.01)",
  backdropFilter: "blur(5px) brightness(1.15)",
  WebkitBackdropFilter: "blur(5px) brightness(1.15)",
  border: "none",
  outline: "1px solid rgba(255,255,255,0.5)",
  outlineOffset: "-1px",
  boxShadow: "0px 4px 4px rgba(0,0,0,0.1), inset 0px 4px 4px rgba(0,0,0,0.08)",
};

const PRIMARY_LIGHT = "#6dca1c";

/* ── Component ── */

export default function BookmarkNav() {
  const [finansToolsState, setFinanztoolsState] = useState<"default" | "hover" | "active">("default");
  const [burgerState, setBurgerState] = useState<"default" | "hover" | "active">("default");

  // Burger refs
  const wrapperRefs = useRef<HTMLDivElement[]>([]);
  const lineRefs = useRef<HTMLDivElement[]>([]);
  const burgerBtnRef = useRef<HTMLButtonElement>(null);
  const burgerIsX = useRef(false);
  const burgerVisible = useRef(false);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  // Mobile detection
  const isMobile = useIsMobile();

  // Search refs
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchPillRef = useRef<HTMLDivElement>(null);
  const searchInnerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSpacerRef = useRef<HTMLDivElement>(null);
  const searchOpen = useRef(false);

  const innerStartX = useRef(0);

  /* ══════════════════════════════════════════════════
     INIT: GSAP-Transform-Setup auf den Burger-Linien.
     Wir besitzen transform/transformOrigin der Linien EXKLUSIV via GSAP —
     React darf sie nicht im JSX-Inline-Style verwalten, sonst überschreibt
     ein Re-Render (burgerState-Change bei Hover) die laufende GSAP-Animation.
     ══════════════════════════════════════════════════ */
  useLayoutEffect(() => {
    lineRefs.current.forEach((line) => {
      if (line) gsap.set(line, { scaleX: 0, transformOrigin: "right center" });
    });
  }, []);

  /* ══════════════════════════════════════════════════
     SCROLL TRIGGER: Burger reveal/hide
     ══════════════════════════════════════════════════ */

  useEffect(() => {
    const createTrigger = (isInit = false) => {
      // Mobile: Burger ist immer sichtbar — kein ScrollTrigger.
      if (isMobile) {
        const btn = burgerBtnRef.current;
        if (!btn) return;
        gsap.set(btn, { width: BTN_HEIGHT, paddingRight: 8, overflow: "hidden" });
        lineRefs.current.forEach((line) => { if (line) gsap.set(line, { scaleX: 1 }); });
        burgerVisible.current = true;
        return;
      }

      const navEl = (document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]")) as HTMLElement | null;
      if (!navEl || !burgerBtnRef.current) return;

      if (isInit) {
        gsap.set(burgerBtnRef.current, { width: 0, padding: 0, overflow: "hidden" });
        lineRefs.current.forEach((line) => {
          if (line) gsap.set(line, { scaleX: 0 });
        });
        burgerVisible.current = false;
      }

      triggerRef.current = ScrollTrigger.create({
        trigger: navEl,
        start: "bottom top",
        onEnter: () => revealBurger(),
        onLeaveBack: () => hideBurger(),
      });
    };

    const revealBurger = () => {
      if (burgerVisible.current) return;
      burgerVisible.current = true;
      window.dispatchEvent(new CustomEvent("nav-scrolled-out"));
      const btn = burgerBtnRef.current;
      if (!btn) return;

      gsap.to(btn, { width: BTN_HEIGHT, paddingRight: 8, duration: 0.3, ease: "power2.inOut" });
      lineRefs.current.forEach((line, i) => {
        if (!line) return;
        gsap.to(line, { scaleX: 1, duration: 0.3, delay: 0.15 + i * 0.08, ease: "power2.out" });
      });

      // Compensate pill position when burger pushes spacer
      if (searchOpen.current && searchPillRef.current) {
        const curX = gsap.getProperty(searchPillRef.current, "x") as number;
        gsap.to(searchPillRef.current, { x: curX + BTN_HEIGHT, duration: 0.3, ease: "power2.inOut" });
      }
    };

    const hideBurger = () => {
      if (!burgerVisible.current) return;
      burgerVisible.current = false;
      window.dispatchEvent(new CustomEvent("nav-scrolled-in"));
      const btn = burgerBtnRef.current;
      if (!btn) return;

      lineRefs.current.forEach((line, i) => {
        if (!line) return;
        gsap.to(line, { scaleX: 0, duration: 0.2, delay: i * 0.08, ease: "power2.out" });
      });
      gsap.to(btn, { width: 0, paddingRight: 0, duration: 0.3, ease: "power2.inOut" });

      // Compensate pill position when burger releases spacer
      if (searchOpen.current && searchPillRef.current) {
        const curX = gsap.getProperty(searchPillRef.current, "x") as number;
        gsap.to(searchPillRef.current, { x: curX - BTN_HEIGHT, duration: 0.3, ease: "power2.inOut" });
      }
    };

    const raf = requestAnimationFrame(() => { createTrigger(true); });
    const onKill = () => { if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; } };
    const onRecreate = () => { createTrigger(); };

    window.addEventListener("scroll-anim-kill", onKill);
    window.addEventListener("scroll-anim-recreate", onRecreate);
    return () => {
      cancelAnimationFrame(raf);
      if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; }
      window.removeEventListener("scroll-anim-kill", onKill);
      window.removeEventListener("scroll-anim-recreate", onRecreate);
    };
  }, [isMobile]);

  /* ══════════════════════════════════════════════════
     BURGER ANIMATIONS
     ══════════════════════════════════════════════════ */

  const animateToX = useCallback(() => {
    if (burgerIsX.current) return;
    burgerIsX.current = true;
    const w = wrapperRefs.current;
    if (w.length < 3) return;
    const [top, mid, bot] = w;
    const tl = gsap.timeline();
    tl.to(top, { y: BURGER_GAP + 2, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(bot, { y: -(BURGER_GAP + 2), duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(mid, { opacity: 0, duration: 0.15, ease: "power2.in" }, 0);
    tl.to(top, { rotation: 45, duration: 0.25, ease: "power2.out" }, 0.15);
    tl.to(bot, { rotation: -45, duration: 0.25, ease: "power2.out" }, 0.15);
  }, []);

  const animateToBurger = useCallback(() => {
    if (!burgerIsX.current) return;
    burgerIsX.current = false;
    const w = wrapperRefs.current;
    if (w.length < 3) return;
    const [top, mid, bot] = w;
    const tl = gsap.timeline();
    tl.to(top, { rotation: 0, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(bot, { rotation: 0, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(top, { y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
    tl.to(mid, { opacity: 1, duration: 0.15, ease: "power2.out" }, 0.15);
    tl.to(bot, { y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
  }, []);

  const revealAsX = useCallback(() => {
    const btn = burgerBtnRef.current;
    const w = wrapperRefs.current;
    const lines = lineRefs.current;
    if (!btn || w.length < 3 || lines.length < 3) return;
    const [wTop, wMid, wBot] = w;

    burgerVisible.current = true;
    burgerIsX.current = true;

    gsap.set(wTop, { y: BURGER_GAP + 2, rotation: 45 });
    gsap.set(wMid, { opacity: 0 });
    gsap.set(wBot, { y: -(BURGER_GAP + 2), rotation: -45 });
    // transformOrigin: "center center" für die scaleX-Animation der X-Linien.
    // Default-CSS hat "right center" (für Burger-Reveal von rechts). Bei rotiertem
    // Wrapper (45°/-45°) wächst die Linie damit von einer Ecke aus → Pfeil-Form.
    // Mit "center center" wachsen die Linien symmetrisch von der Mitte → sauberes X.
    lines.forEach((line) => { if (line) gsap.set(line, { scaleX: 0, transformOrigin: "center center" }); });

    gsap.to(btn, { width: BTN_HEIGHT, paddingRight: 8, duration: 0.3, ease: "power2.inOut" });
    [lines[0], lines[2]].forEach((line, i) => {
      if (!line) return;
      gsap.to(line, { scaleX: 1, duration: 0.3, delay: 0.15 + i * 0.08, ease: "power2.out" });
    });
  }, []);

  const hideAsX = useCallback(() => {
    const btn = burgerBtnRef.current;
    const lines = lineRefs.current;
    const w = wrapperRefs.current;
    if (!btn || lines.length < 3) return;

    burgerIsX.current = false;
    burgerVisible.current = false;

    // Symmetrisch zu revealAsX kollabieren — center center transformOrigin.
    [lines[0], lines[2]].forEach((line, i) => {
      if (!line) return;
      gsap.to(line, { scaleX: 0, transformOrigin: "center center", duration: 0.2, delay: i * 0.08, ease: "power2.out" });
    });
    gsap.to(btn, {
      width: 0, paddingRight: 0, duration: 0.3, delay: 0.2, ease: "power2.inOut",
      onComplete: () => {
        w.forEach((wr) => { if (wr) gsap.set(wr, { rotation: 0, y: 0, opacity: 1 }); });
        // transformOrigin der Linien zurück auf CSS-Default für nachfolgende Burger-Reveal-Animationen.
        lines.forEach((line) => { if (line) gsap.set(line, { transformOrigin: "right center" }); });
      },
    });
  }, []);

  // Burger ↔ X on menu open/close
  useEffect(() => {
    const handleMenuOpened = (e: Event) => {
      const label = (e as CustomEvent).detail?.label;
      if (!label) return;
      // Preview hat seinen eigenen Close-Button im weißen Container — Burger
      // bleibt im Hintergrund-Layer und wird nicht zum X.
      if (label === "preview") return;
      if (burgerIsX.current) return;

      const btn = burgerBtnRef.current;
      if (!btn) return;

      // Race-Killer: in-flight Reveal/Hide-Tweens (von ScrollTrigger ausgelöst)
      // killen, sonst läuft revealBurger's line-scaleX-Animation parallel zu
      // unserem animateToX → Wrapper rotieren, Linien sind aber noch
      // halb-gedrawt mit "right center"-Origin → Krähenfuss-X.
      gsap.killTweensOf(btn);
      lineRefs.current.forEach((line) => { if (line) gsap.killTweensOf(line); });
      wrapperRefs.current.forEach((w) => { if (w) gsap.killTweensOf(w); });

      // Pfad-Auswahl auf Basis der TATSÄCHLICHEN Button-Breite, nicht des
      // burgerVisible-Flags (der Flag kann durch in-flight ScrollTrigger
      // bereits true sein, obwohl der Button noch animiert).
      const currentWidth = (gsap.getProperty(btn, "width") as number) || 0;
      const fullyVisible = currentWidth >= BTN_HEIGHT - 1;

      if (fullyVisible) {
        // Burger ist vollständig sichtbar → einfacher Burger→X-Morph.
        // Linien werden nicht angerührt (bleiben scaleX:1) — animateToX
        // rotiert nur die Wrapper.
        lineRefs.current.forEach((line) => {
          if (line) gsap.set(line, { scaleX: 1 });
        });
        animateToX();
      } else {
        // Burger nicht voll sichtbar (mid-reveal oder hidden) → revealAsX
        // setzt Button-Width + draw-in der X-Linien aus dem Center.
        revealAsX();
      }
    };
    window.addEventListener("menu-opened", handleMenuOpened);
    return () => window.removeEventListener("menu-opened", handleMenuOpened);
  }, [animateToX, revealAsX]);

  useEffect(() => {
    const handleMenuClosed = () => {
      if (!burgerIsX.current) return;
      // Mobile: Button bleibt immer sichtbar — nur X → Lines.
      if (isMobile) { animateToBurger(); return; }
      const navEl = document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]");
      const navIsHidden = !navEl || navEl.getBoundingClientRect().bottom < 0;
      if (navIsHidden) animateToBurger();
      else hideAsX();
    };
    window.addEventListener("menu-closed", handleMenuClosed);
    return () => window.removeEventListener("menu-closed", handleMenuClosed);
  }, [animateToBurger, hideAsX, isMobile]);

  const toggleBurger = useCallback(() => {
    if (burgerIsX.current) {
      if (isMobile) {
        // Mobile: Button bleibt immer sichtbar — nur X → Lines.
        animateToBurger();
      } else {
        const navEl = document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]");
        const navIsHidden = !navEl || navEl.getBoundingClientRect().bottom < 0;
        if (navIsHidden) animateToBurger();
        else hideAsX();
      }
      window.dispatchEvent(new CustomEvent("burger-closed"));
      window.dispatchEvent(new CustomEvent("menu-closed"));
    } else {
      animateToX();
      window.dispatchEvent(new CustomEvent("burger-opened"));
      // On mobile, the booklet covers the bookmark/logo area — ContentScaler should
      // also blur Logo + Landing search pill (extended mode). On desktop, keep TopNav
      // sharp because it slides in as the burger nav.
      window.dispatchEvent(
        new CustomEvent("menu-opened", { detail: isMobile ? { extended: true } : {} })
      );
    }
  }, [animateToX, animateToBurger, hideAsX, isMobile]);

  /* ══════════════════════════════════════════════════
     SEARCH PILL (always visible, collapsed = lupe only)
     ══════════════════════════════════════════════════ */

  // Calculate inner x-offset so only lupe button is visible in collapsed pill
  const calcInnerOffset = useCallback(() => {
    const inner = searchInnerRef.current;
    if (!inner) return 0;
    const lupeBtn = inner.querySelector("button") as HTMLElement | null;
    if (!lupeBtn) return 0;
    return -(lupeBtn.offsetLeft);
  }, []);

  // Set inner offset on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      const offset = calcInnerOffset();
      innerStartX.current = offset;
      if (searchInnerRef.current) gsap.set(searchInnerRef.current, { x: offset });
    });
  }, [calcInnerOffset]);

  const openSearch = useCallback(() => {
    if (searchOpen.current) return;
    searchOpen.current = true;

    const pill = searchPillRef.current;
    const body = bodyRef.current;
    const inner = searchInnerRef.current;
    if (!pill || !body || !inner) return;

    const FULL_W = inner.scrollWidth;

    // Shift right over burger if visible
    const burgerW = burgerBtnRef.current ? (gsap.getProperty(burgerBtnRef.current, "width") as number) : 0;
    const shiftX = burgerW > 0 ? burgerW + 4 : 0; // 4 = gap

    // Apply glass style at current size before expanding
    gsap.set(pill, { ...GLASS_STYLE });

    const tl = gsap.timeline();

    const EXPANDED_BODY_W = 310; // ← hier anpassen

    // Pill expands left (width) + shifts right (x) over burger
    tl.to(pill, { width: FULL_W, x: shiftX, duration: 0.8, ease: "back.out(1)" }, 0);
    tl.to(inner, { x: 0, duration: 0.8, ease: "back.out(1)" }, 0);
    tl.to(body, { width: EXPANDED_BODY_W, duration: 0.8, ease: "back.out(1.3)" }, 0);

    // Height pulse (top relative to spacer, center vertically)
    const topCenter = (BTN_HEIGHT - GLASS_H) / 2;
    tl.to(pill, { height: GLASS_H, top: topCenter, borderRadius: GLASS_R, duration: 0.15, ease: "power2.out" }, 0);
    tl.to(pill, { height: BTN_HEIGHT, top: 0, borderRadius: BTN_BORDER_RADIUS, duration: 0.45, ease: "power3.out" }, 0.35);

    // Glass → green (keep backdrop effects, remove shadows + outline)
    tl.to(pill, {
      background: PRIMARY_LIGHT,
      boxShadow: "none",
      outline: "1px solid transparent",
      duration: 0.3, ease: "power2.out",
      onComplete: () => searchInputRef.current?.focus(),
    }, 0.45);

    // Input text fade in
    if (searchInputRef.current) {
      tl.to(searchInputRef.current, { color: "rgba(255,255,255,1)", duration: 0.25, ease: "power2.out" }, 0.55);
    }
  }, []);

  const closeSearch = useCallback(() => {
    if (!searchOpen.current) return;
    searchOpen.current = false;

    const pill = searchPillRef.current;
    const body = bodyRef.current;
    if (!pill || !body) return;

    // Measure target body width (burger already at correct state from scroll)
    const currentWidth = body.offsetWidth;
    body.style.width = "";
    const targetWidth = body.offsetWidth;
    body.style.width = `${currentWidth}px`;

    const tl = gsap.timeline();

    // Text fade out
    if (searchInputRef.current) {
      tl.to(searchInputRef.current, { color: "rgba(255,255,255,0)", duration: 0.15, ease: "power2.in" }, 0);
      searchInputRef.current.value = "";
    }

    // Green → glass
    tl.to(pill, { ...GLASS_STYLE, duration: 0.2, ease: "power2.out" }, 0.05);

    // Height pulse (center vertically relative to spacer)
    const topCenter = (BTN_HEIGHT - GLASS_H) / 2;
    tl.to(pill, { height: GLASS_H, top: topCenter, borderRadius: GLASS_R, duration: 0.2, ease: "power2.out" }, 0.15);

    // Collapse pill + inner + shift back
    tl.to(pill, {
      width: BTN_HEIGHT, height: BTN_HEIGHT, x: 0,
      top: 0, borderRadius: BTN_BORDER_RADIUS,
      duration: 0.5, ease: "power2.inOut",
      onComplete: () => {
        gsap.set(pill, {
          background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none",
          outline: "none", outlineOffset: "0px", boxShadow: "none",
        });
      },
    }, 0.35);
    tl.to(searchInnerRef.current, { x: innerStartX.current, duration: 0.5, ease: "power2.inOut" }, 0.35);

    // Body shrinks back
    tl.to(body, {
      width: targetWidth, duration: 0.5, ease: "power2.inOut",
      onComplete: () => { body.style.width = ""; },
    }, 0.35);
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!searchOpen.current) return;
      const target = e.target as HTMLElement;
      if (searchPillRef.current?.contains(target)) return;
      closeSearch();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [closeSearch]);


  /* ══════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════ */

  const getButtonBackground = (state: "default" | "hover" | "active") => {
    if (state === "active") return "var(--color-btn-active)";
    if (state === "hover") return "var(--color-btn-hover)";
    return "transparent";
  };

  const getButtonStyle = (state: "default" | "hover" | "active") => ({
    background: getButtonBackground(state),
    transition: "background 0.15s ease",
  });

  /* ══════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════ */

  return (
    <div style={{ display: "flex", alignItems: "center", height: BOOKMARK_H }}>
      {/* Spike */}
      <div style={{ width: 40, height: BOOKMARK_H, marginRight: -1, flexShrink: 0 }}>
        <Image
          src="/icons/lesezeichen-spikes.svg"
          alt=""
          width={40}
          height={BOOKMARK_H}
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-hidden
        />
      </div>

      {/* Green body */}
      <div
        ref={bodyRef}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          height: BOOKMARK_H,
          gap: 4,
          paddingLeft: 1,
          paddingRight: 25,
          overflow: "visible",
          background: "linear-gradient(to left, rgba(22,142,3,0.8), #45a117)",
        }}
      >
        {/* Finanztools Button — nur Desktop */}
        {!isMobile && (
          <button
            onClick={() => { window.dispatchEvent(new CustomEvent("finanztools-toggle")); }}
            onMouseEnter={() => setFinanztoolsState("hover")}
            onMouseLeave={() => setFinanztoolsState("default")}
            onMouseDown={() => setFinanztoolsState("active")}
            onMouseUp={() => setFinanztoolsState("hover")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: BTN_HEIGHT, paddingLeft: BTN_PADDING, paddingRight: BTN_PADDING,
              borderRadius: BTN_BORDER_RADIUS, border: "none", color: "white",
              fontFamily: '"Open Sans", sans-serif', fontSize: 17, fontWeight: 400,
              cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none",
              ...getButtonStyle(finansToolsState),
            }}
          >
            Finanztools
          </button>
        )}

        {/* Search Pill — inside a flex-flow spacer, absolute within it */}
        <div ref={searchSpacerRef} style={{ width: BTN_HEIGHT, height: BTN_HEIGHT, flexShrink: 0, position: "relative" }}>
          <div
            ref={searchPillRef}
            onClick={() => { if (!searchOpen.current) openSearch(); }}
            onMouseEnter={(e) => { if (!searchOpen.current) e.currentTarget.style.background = getButtonBackground("hover"); }}
            onMouseLeave={(e) => { if (!searchOpen.current) e.currentTarget.style.background = "transparent"; }}
            onMouseDown={(e) => { if (!searchOpen.current) e.currentTarget.style.background = getButtonBackground("active"); }}
            onMouseUp={(e) => { if (!searchOpen.current) e.currentTarget.style.background = getButtonBackground("hover"); }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: BTN_HEIGHT,
              height: BTN_HEIGHT,
              borderRadius: BTN_BORDER_RADIUS,
              overflow: "hidden",
              cursor: "pointer",
              background: "transparent",
              transition: "background 0.15s ease",
              zIndex: 3,
            }}
          >
            <div
              ref={searchInnerRef}
              style={{
                position: "absolute",
                top: 0, left: 0,
                display: "flex",
                alignItems: "center",
                height: "100%",
                width: "fit-content",
                paddingLeft: 15,
                paddingRight: 4,
                whiteSpace: "nowrap",
              }}
            >
              <input
                ref={searchInputRef}
                className="search-input"
                type="text"
                placeholder="Beiträge durchsuchen"
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeSearch();
                  if (e.key === "Enter" && searchInputRef.current?.value.trim()) {
                    window.location.href = `/suche?q=${encodeURIComponent(searchInputRef.current.value)}`;
                  }
                }}
                style={{
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: 18, fontWeight: 400,
                  color: "rgba(255,255,255,0)",
                  flexShrink: 0, border: "none",
                  background: "transparent", outline: "none",
                  width: 215, caretColor: "white",
                }}
              />
              <button
                onClick={(e) => {
                  if (!searchOpen.current) return;
                  e.stopPropagation();
                  const query = searchInputRef.current?.value.trim();
                  if (query) {
                    window.location.href = `/suche?q=${encodeURIComponent(query)}`;
                  } else {
                    closeSearch();
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: BTN_HEIGHT, height: BTN_HEIGHT, borderRadius: BTN_BORDER_RADIUS,
                  border: "none", background: "transparent", cursor: "pointer",
                  flexShrink: 0, padding: 0, marginLeft: 12,
                }}
              >
                <Image src="/icons/lupe.svg" alt="Suche" width={18} height={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Burger Button */}
        <button
          ref={burgerBtnRef}
          onClick={toggleBurger}
          onMouseEnter={() => setBurgerState("hover")}
          onMouseLeave={() => setBurgerState("default")}
          onMouseDown={() => setBurgerState("active")}
          onMouseUp={() => setBurgerState("hover")}
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end",
            justifyContent: "center", width: 0, height: BTN_HEIGHT,
            borderRadius: BTN_BORDER_RADIUS, border: "none", cursor: "pointer",
            gap: BURGER_GAP, paddingRight: 0, overflow: "hidden",
            ...getButtonStyle(burgerState),
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={(el) => { if (el) wrapperRefs.current[i] = el; }}
              style={{ width: BURGER_LINE_W, height: 2, transformOrigin: "center" }}
            >
              <div
                ref={(el) => { if (el) lineRefs.current[i] = el; }}
                style={{
                  width: "100%", height: "100%", background: "white",
                  borderRadius: 1,
                  // KEIN transform/transformOrigin im JSX-Inline-Style!
                  // React würde diese bei jedem Re-Render (z.B. burgerState-Change
                  // bei Hover/Click) wieder auf scaleX(0)/right-center setzen und
                  // damit GSAP-Animationen mid-flight resetten → "Krähenfuss"-X
                  // oder Pop-In ohne Animation. Initialisierung erfolgt einmalig
                  // per gsap.set in useLayoutEffect (siehe unten).
                }}
              />
            </div>
          ))}
        </button>
      </div>
    </div>
  );
}
