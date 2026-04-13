"use client";

import Image from "next/image";
import { useRef, useCallback, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BURGER_LINE_W = 20;
const BURGER_GAP = 5;
const BTN_BORDER_RADIUS = 15;
const BTN_HEIGHT = 36;
const BTN_PADDING = 10;

export default function BookmarkNav() {
  const [finansToolsState, setFinanztoolsState] = useState<"default" | "hover" | "active">("default");
  const [lupeState, setLupeState] = useState<"default" | "hover" | "active">("default");
  const [burgerState, setBurgerState] = useState<"default" | "hover" | "active">("default");

  // Wrapper refs: handle rotation + Y movement for X animation
  const wrapperRefs = useRef<HTMLDivElement[]>([]);
  // Line refs: handle scaleX for reveal/hide animation
  const lineRefs = useRef<HTMLDivElement[]>([]);
  const burgerBtnRef = useRef<HTMLButtonElement>(null);
  const burgerIsX = useRef(false);
  const burgerVisible = useRef(false);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  // ScrollTrigger: Burger reveal/hide when TopNav leaves/enters viewport
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
        gsap.to(line, {
          scaleX: 1, duration: 0.3, delay: 0.15 + i * 0.08, ease: "power2.out",
        });
      });
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
    };

    const raf = requestAnimationFrame(() => {
      createTrigger(true);
    });

    const onKill = () => {
      if (triggerRef.current) { triggerRef.current.kill(); triggerRef.current = null; }
    };
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

  // X animation: operates on WRAPPERS (rotation + Y), not lines
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

  // Burger animation: operates on WRAPPERS
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

  // Reveal as X: pre-set wrappers to X positions, then scale in lines from right
  const revealAsX = useCallback(() => {
    const btn = burgerBtnRef.current;
    const w = wrapperRefs.current;
    const lines = lineRefs.current;
    if (!btn || w.length < 3 || lines.length < 3) return;
    const [wTop, wMid, wBot] = w;

    burgerVisible.current = true;
    burgerIsX.current = true;

    // Pre-set wrappers to X formation (instant, no animation)
    gsap.set(wTop, { y: BURGER_GAP + 2, rotation: 45 });
    gsap.set(wMid, { opacity: 0 });
    gsap.set(wBot, { y: -(BURGER_GAP + 2), rotation: -45 });

    // Reset lines to hidden
    lines.forEach((line) => { if (line) gsap.set(line, { scaleX: 0 }); });

    // Expand button
    gsap.to(btn, { width: BTN_HEIGHT, paddingRight: 8, duration: 0.3, ease: "power2.out" });

    // Scale in lines from right (only top and bottom visible since mid wrapper is opacity 0)
    [lines[0], lines[2]].forEach((line, i) => {
      if (!line) return;
      gsap.to(line, {
        scaleX: 1, duration: 0.3, delay: 0.15 + i * 0.08, ease: "power2.out",
      });
    });
  }, []);

  // Hide as X: scale out lines, collapse button, reset wrappers
  const hideAsX = useCallback(() => {
    const btn = burgerBtnRef.current;
    const lines = lineRefs.current;
    const w = wrapperRefs.current;
    if (!btn || lines.length < 3) return;

    burgerIsX.current = false;
    burgerVisible.current = false;

    // Scale out visible lines
    [lines[0], lines[2]].forEach((line, i) => {
      if (!line) return;
      gsap.to(line, { scaleX: 0, duration: 0.2, delay: i * 0.08, ease: "power2.out" });
    });

    // Collapse button, then reset wrappers
    gsap.to(btn, {
      width: 0, paddingRight: 0, duration: 0.3, delay: 0.2, ease: "power2.out",
      onComplete: () => {
        w.forEach((wr) => { if (wr) gsap.set(wr, { rotation: 0, y: 0, opacity: 1 }); });
      },
    });
  }, []);

  // Animate burger to X when megamenu opens via TopNav
  useEffect(() => {
    const handleMenuOpened = (e: Event) => {
      const label = (e as CustomEvent).detail?.label;
      if (!label) return;

      if (burgerVisible.current && !burgerIsX.current) {
        animateToX();
      } else if (!burgerVisible.current) {
        revealAsX();
      }
    };
    window.addEventListener("menu-opened", handleMenuOpened);
    return () => window.removeEventListener("menu-opened", handleMenuOpened);
  }, [animateToX, revealAsX]);

  // Reset burger when menu is closed
  useEffect(() => {
    const handleMenuClosed = () => {
      if (!burgerIsX.current) return;

      const navEl = document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]");
      const navIsHidden = !navEl || navEl.getBoundingClientRect().bottom < 0;

      if (navIsHidden) {
        // Scrolled down: keep burger visible, just go back to lines
        animateToBurger();
      } else {
        // Top of page: hide burger completely
        hideAsX();
      }
    };
    window.addEventListener("menu-closed", handleMenuClosed);
    return () => window.removeEventListener("menu-closed", handleMenuClosed);
  }, [animateToBurger, hideAsX]);

  const toggleBurger = useCallback(() => {
    if (burgerIsX.current) {
      const navEl = document.querySelector(".landing-nav[data-topnav]") || document.querySelector("[data-topnav]");
      const navIsHidden = !navEl || navEl.getBoundingClientRect().bottom < 0;

      if (navIsHidden) {
        // Scrolled down: animate back to burger lines, stay visible
        animateToBurger();
      } else {
        // Top of page: slide out completely
        hideAsX();
      }
      window.dispatchEvent(new CustomEvent("burger-closed"));
      window.dispatchEvent(new CustomEvent("menu-closed"));
    } else {
      animateToX();
      window.dispatchEvent(new CustomEvent("burger-opened"));
      window.dispatchEvent(new CustomEvent("menu-opened"));
    }
  }, [animateToX, animateToBurger, hideAsX]);

  const getButtonBackground = (state: "default" | "hover" | "active") => {
    if (state === "active") return "var(--color-btn-active)";
    if (state === "hover") return "var(--color-btn-hover)";
    return "transparent";
  };

  const getButtonStyle = (state: "default" | "hover" | "active") => ({
    background: getButtonBackground(state),
    transition: "background 0.15s ease",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 50,
      }}
    >
      {/* Spike */}
      <div style={{ width: 40, height: 50, marginRight: -1, flexShrink: 0 }}>
        <Image
          src="/icons/lesezeichen-spikes.svg"
          alt=""
          width={40}
          height={50}
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-hidden
        />
      </div>

      {/* Green rectangle with buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          height: 50,
          gap: 4,
          paddingLeft: 1,
          paddingRight: 25,
          marginRight: -1,
          background: "linear-gradient(to left, rgba(22,142,3,0.8), #45a117)",
        }}
      >
        {/* Finanztools Button */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("finanztools-toggle"));
          }}
          onMouseEnter={() => setFinanztoolsState("hover")}
          onMouseLeave={() => setFinanztoolsState("default")}
          onMouseDown={() => setFinanztoolsState("active")}
          onMouseUp={() => setFinanztoolsState("hover")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: BTN_HEIGHT,
            paddingLeft: BTN_PADDING,
            paddingRight: BTN_PADDING,
            borderRadius: BTN_BORDER_RADIUS,
            border: "none",
            color: "white",
            fontFamily: '"Open Sans", sans-serif',
            fontSize: 17,
            fontWeight: 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
            textDecoration: "none",
            ...getButtonStyle(finansToolsState),
          }}
        >
          Finanztools
        </button>

        {/* Lupe Button */}
        <button
          onMouseEnter={() => setLupeState("hover")}
          onMouseLeave={() => setLupeState("default")}
          onMouseDown={() => setLupeState("active")}
          onMouseUp={() => setLupeState("hover")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: BTN_HEIGHT,
            height: BTN_HEIGHT,
            borderRadius: BTN_BORDER_RADIUS,
            border: "none",
            cursor: "pointer",
            padding: 4,
            ...getButtonStyle(lupeState),
          }}
        >
          <Image
            src="/icons/lupe.svg"
            alt="Suche"
            width={18}
            height={18}
          />
        </button>

        {/* Burger Button — wrapper (rotation/Y) + inner line (scaleX) */}
        <button
          ref={burgerBtnRef}
          onClick={toggleBurger}
          onMouseEnter={() => setBurgerState("hover")}
          onMouseLeave={() => setBurgerState("default")}
          onMouseDown={() => setBurgerState("active")}
          onMouseUp={() => setBurgerState("hover")}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            width: 0,
            height: BTN_HEIGHT,
            borderRadius: BTN_BORDER_RADIUS,
            border: "none",
            cursor: "pointer",
            gap: BURGER_GAP,
            paddingRight: 0,
            overflow: "hidden",
            ...getButtonStyle(burgerState),
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={(el) => { if (el) wrapperRefs.current[i] = el; }}
              style={{
                width: BURGER_LINE_W,
                height: 2,
                transformOrigin: "center",
              }}
            >
              <div
                ref={(el) => { if (el) lineRefs.current[i] = el; }}
                style={{
                  width: "100%",
                  height: "100%",
                  background: "white",
                  borderRadius: 1,
                  transformOrigin: "right center",
                  transform: "scaleX(0)",
                }}
              />
            </div>
          ))}
        </button>
      </div>
    </div>
  );
}
