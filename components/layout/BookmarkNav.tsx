"use client";

import Image from "next/image";
import { useRef, useCallback, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
  backdropFilter: "blur(3px) saturate(130%)",
  WebkitBackdropFilter: "blur(3px) saturate(130%)",
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

  // Search refs
  const bodyRef = useRef<HTMLDivElement>(null);
  const searchPillRef = useRef<HTMLDivElement>(null);
  const searchInnerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSpacerRef = useRef<HTMLDivElement>(null);
  const searchOpen = useRef(false);
  const innerStartX = useRef(0);

  /* ══════════════════════════════════════════════════
     SCROLL TRIGGER: Burger reveal/hide
     ══════════════════════════════════════════════════ */

  useEffect(() => {
    const createTrigger = (isInit = false) => {
      const navEl = (document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]")) as HTMLElement | null;
      if (!navEl || !burgerBtnRef.current) return;

      if (isInit) {
        gsap.set(burgerBtnRef.current, { width: 0, padding: 0, overflow: "hidden" });
        lineRefs.current.forEach((line) => {
          if (line) gsap.set(line, { scaleX: 0 });
        });
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
      const btn = burgerBtnRef.current;
      if (!btn) return;

      gsap.to(btn, { width: BTN_HEIGHT, paddingRight: 8, duration: 0.3, ease: "power2.out" });
      lineRefs.current.forEach((line, i) => {
        if (!line) return;
        gsap.to(line, { scaleX: 1, duration: 0.3, delay: 0.15 + i * 0.08, ease: "power2.out" });
      });

      // Compensate pill position when burger pushes spacer
      if (searchOpen.current && searchPillRef.current) {
        const curX = gsap.getProperty(searchPillRef.current, "x") as number;
        gsap.to(searchPillRef.current, { x: curX + BTN_HEIGHT, duration: 0.3, ease: "power2.out" });
      }
    };

    const hideBurger = () => {
      if (!burgerVisible.current) return;
      burgerVisible.current = false;
      const btn = burgerBtnRef.current;
      if (!btn) return;

      lineRefs.current.forEach((line, i) => {
        if (!line) return;
        gsap.to(line, { scaleX: 0, duration: 0.2, delay: i * 0.08, ease: "power2.out" });
      });
      gsap.to(btn, { width: 0, paddingRight: 0, duration: 0.3, delay: 0.25, ease: "power2.out" });

      // Compensate pill position when burger releases spacer
      if (searchOpen.current && searchPillRef.current) {
        const curX = gsap.getProperty(searchPillRef.current, "x") as number;
        gsap.to(searchPillRef.current, { x: curX - BTN_HEIGHT, duration: 0.3, delay: 0.25, ease: "power2.out" });
      }
    };

    const raf = requestAnimationFrame(() => { createTrigger(true); });
    const onKill = () => { if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; } };
    const onRecreate = () => { createTrigger(); };

    window.addEventListener("scroll-anim-kill", onKill);
    window.addEventListener("scroll-anim-recreate", onRecreate);
    return () => {
      cancelAnimationFrame(raf);
      if (triggerRef.current) triggerRef.current.kill();
      window.removeEventListener("scroll-anim-kill", onKill);
      window.removeEventListener("scroll-anim-recreate", onRecreate);
    };
  }, []);

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
    lines.forEach((line) => { if (line) gsap.set(line, { scaleX: 0 }); });

    gsap.to(btn, { width: BTN_HEIGHT, paddingRight: 8, duration: 0.3, ease: "power2.out" });
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

    [lines[0], lines[2]].forEach((line, i) => {
      if (!line) return;
      gsap.to(line, { scaleX: 0, duration: 0.2, delay: i * 0.08, ease: "power2.out" });
    });
    gsap.to(btn, {
      width: 0, paddingRight: 0, duration: 0.3, delay: 0.2, ease: "power2.out",
      onComplete: () => {
        w.forEach((wr) => { if (wr) gsap.set(wr, { rotation: 0, y: 0, opacity: 1 }); });
      },
    });
  }, []);

  // Burger ↔ X on menu open/close
  useEffect(() => {
    const handleMenuOpened = (e: Event) => {
      const label = (e as CustomEvent).detail?.label;
      if (!label) return;
      if (burgerVisible.current && !burgerIsX.current) animateToX();
      else if (!burgerVisible.current) revealAsX();
    };
    window.addEventListener("menu-opened", handleMenuOpened);
    return () => window.removeEventListener("menu-opened", handleMenuOpened);
  }, [animateToX, revealAsX]);

  useEffect(() => {
    const handleMenuClosed = () => {
      if (!burgerIsX.current) return;
      const navEl = document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]");
      const navIsHidden = !navEl || navEl.getBoundingClientRect().bottom < 0;
      if (navIsHidden) animateToBurger();
      else hideAsX();
    };
    window.addEventListener("menu-closed", handleMenuClosed);
    return () => window.removeEventListener("menu-closed", handleMenuClosed);
  }, [animateToBurger, hideAsX]);

  const toggleBurger = useCallback(() => {
    if (burgerIsX.current) {
      const navEl = document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]");
      const navIsHidden = !navEl || navEl.getBoundingClientRect().bottom < 0;
      if (navIsHidden) animateToBurger();
      else hideAsX();
      window.dispatchEvent(new CustomEvent("burger-closed"));
      window.dispatchEvent(new CustomEvent("menu-closed"));
    } else {
      animateToX();
      window.dispatchEvent(new CustomEvent("burger-opened"));
      window.dispatchEvent(new CustomEvent("menu-opened"));
    }
  }, [animateToX, animateToBurger, hideAsX]);

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

    const EXPANDED_BODY_W = 330; // ← hier anpassen

    // Pill expands left (width) + shifts right (x) over burger
    tl.to(pill, { width: FULL_W, x: shiftX, duration: 0.8, ease: "back.out(1)" }, 0);
    tl.to(inner, { x: 0, duration: 0.8, ease: "back.out(1)" }, 0);
    tl.to(body, { width: EXPANDED_BODY_W, duration: 0.8, ease: "back.out(1)" }, 0);

    // Height pulse (top relative to spacer, center vertically)
    const topCenter = (BTN_HEIGHT - GLASS_H) / 2;
    tl.to(pill, { height: GLASS_H, top: topCenter, borderRadius: GLASS_R, duration: 0.15, ease: "power2.out" }, 0);
    tl.to(pill, { height: BTN_HEIGHT, top: 0, borderRadius: BTN_BORDER_RADIUS, duration: 0.45, ease: "power3.out" }, 0.35);

    // Glass → green
    tl.to(pill, {
      background: PRIMARY_LIGHT,
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      outline: "1px solid transparent",
      boxShadow: "none",
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
          marginRight: -1,
          overflow: "visible",
          background: "linear-gradient(to left, rgba(22,142,3,0.8), #45a117)",
        }}
      >
        {/* Finanztools Button */}
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

        {/* Search Pill — inside a flex-flow spacer, absolute within it */}
        <div ref={searchSpacerRef} style={{ width: BTN_HEIGHT, height: BTN_HEIGHT, flexShrink: 0, position: "relative" }}>
          <div
            ref={searchPillRef}
            onClick={() => { if (!searchOpen.current) openSearch(); }}
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
                  width: 230, caretColor: "white",
                }}
              />
              <button
                onClick={(e) => { if (searchOpen.current) { e.stopPropagation(); closeSearch(); } }}
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
                  borderRadius: 1, transformOrigin: "right center", transform: "scaleX(0)",
                }}
              />
            </div>
          ))}
        </button>
      </div>
    </div>
  );
}
