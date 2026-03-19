"use client";
import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

/* ── Constants ──────────────────────────────────── */

const COLORS = {
  primary: "#45A117",
  primaryLight: "#6dca1c",
  hoverBg: "rgba(109,202,28,0.3)",
  gradientFrom: "rgba(22,142,3,0.8)",
};

const BTN_SIZE = 36;
const BTN_RADIUS = 15;
const BOOKMARK_H = 50;
const BURGER_LINE_W = 20;
const BURGER_GAP = 5;
const SEARCH_W = 270;
const CLOSE_BTN = 28;
const CLOSE_GAP = 10;
const GLASS_H = 70;
const GLASS_R = 30;

const GLASS_STYLE = {
  background: "rgba(255,255,255,0.01)",
  backdropFilter: "blur(4px) saturate(120%)",
  WebkitBackdropFilter: "blur(4px) saturate(120%)",
  border: "none",
  outline: "1px solid rgba(255,255,255,0.2)",
  outlineOffset: "-1px",
  boxShadow: "0px 4px 4px rgba(0,0,0,0.1), inset 0px 4px 4px rgba(0,0,0,0.08)",
};

/* ── Component ──────────────────────────────────── */

export default function BookmarkNav() {
  const bookmarkRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const burgerWrapRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLDivElement>(null);
  const burgerLinesRef = useRef<HTMLDivElement[]>([]);
  const finanzToolsRef = useRef<HTMLButtonElement>(null);
  const lupeRef = useRef<HTMLButtonElement>(null);
  const searchPillRef = useRef<HTMLDivElement>(null);
  const searchTextRef = useRef<HTMLSpanElement>(null);
  const searchInnerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const burgerVisible = useRef(false);
  const searchOpen = useRef(false);
  const bodyDefaultW = useRef(0);
  const innerStartX = useRef(0);

  /* ── Burger reveal on scroll ── */

  useEffect(() => {
    const topNav = document.querySelector("nav");
    if (!topNav) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !burgerVisible.current) {
          burgerVisible.current = true;
          showBurger();
        } else if (entry.isIntersecting && burgerVisible.current) {
          burgerVisible.current = false;
          hideBurger();
        }
      },
      { threshold: 0, rootMargin: "0px" }
    );

    observer.observe(topNav);
    return () => observer.disconnect();
  }, []);

  const showBurger = () => {
    if (!burgerWrapRef.current || searchOpen.current) return;

    gsap.set(burgerWrapRef.current, { width: 0 });
    const tl = gsap.timeline();
    tl.to(burgerWrapRef.current, {
      width: BTN_SIZE * 1.15, duration: 0.3, ease: "power2.out",
    }).to(burgerWrapRef.current, {
      width: BTN_SIZE, duration: 0.4, ease: "back.out(2.5)",
    });

    burgerLinesRef.current.forEach((line, i) => {
      gsap.fromTo(line, { width: 0 }, {
        width: BURGER_LINE_W, duration: 0.4, delay: 0.12 + i * 0.1, ease: "back.out(2)",
      });
    });
  };

  const hideBurger = () => {
    if (!burgerWrapRef.current || searchOpen.current) return;

    burgerLinesRef.current.forEach((line, i) => {
      gsap.to(line, { width: 0, duration: 0.25, delay: (2 - i) * 0.06, ease: "power2.inOut" });
    });

    const tl = gsap.timeline({ delay: 0.1 });
    tl.to(burgerWrapRef.current, { width: 0, duration: 0.4, ease: "power2.inOut" });
  };

  /* ── Search ── */

  const openSearch = useCallback(() => {
    if (searchOpen.current) return;
    searchOpen.current = true;

    const pill = searchPillRef.current;
    const body = bodyRef.current;
    const lupe = lupeRef.current;
    if (!pill || !body || !lupe) return;

    const FULL_PILL_W = SEARCH_W + CLOSE_GAP + CLOSE_BTN;
    const X_OFFSET = CLOSE_BTN + CLOSE_GAP; // how far pill extends right to reveal X

    // Calculate pill's starting right from the actual lupe button position
    const bodyRect = body.getBoundingClientRect();
    const lupeRect = lupe.getBoundingClientRect();
    // Pill right = distance from body's right edge to lupe button's right edge
    const PILL_START_RIGHT = bodyRect.right - lupeRect.right;
    const PILL_END_RIGHT = Math.max(15, PILL_START_RIGHT - X_OFFSET - 10);

    bodyDefaultW.current = body.offsetWidth;

    gsap.set(pill, {
      display: "block",
      right: PILL_START_RIGHT,
      top: (BOOKMARK_H - BTN_SIZE) / 2,
      width: BTN_SIZE,
      height: BTN_SIZE,
      borderRadius: BTN_RADIUS,
      ...GLASS_STYLE,
      opacity: 1,
    });
    // Measure actual inner content width and lupe position
    let FULL_PILL_W_ACTUAL = FULL_PILL_W;
    if (searchInnerRef.current) {
      gsap.set(searchInnerRef.current, { x: 0 }); // reset to measure
      const inner = searchInnerRef.current;
      FULL_PILL_W_ACTUAL = inner.offsetWidth;
      const innerLupe = inner.querySelectorAll("button")[0]; // first button = lupe
      const lupeLeftInInner = innerLupe.offsetLeft;
      innerStartX.current = -lupeLeftInInner;
      gsap.set(inner, { x: innerStartX.current });
    }
    gsap.set(lupe, { opacity: 0 });

    const tl = gsap.timeline();

    // Width + right + inner: smooth and calm
    tl.to(pill, {
      width: FULL_PILL_W_ACTUAL,
      right: PILL_END_RIGHT,
      duration: 0.8,
      ease: "back.out(1)",
    });
    tl.to(searchInnerRef.current, {
      x: 0,
      duration: 0.8,
      ease: "back.out(1)",
    }, "<");

    // Height: peaks at 70px early, holds, settles gently
    tl.to(pill, {
      height: GLASS_H,
      top: (BOOKMARK_H - GLASS_H) / 2,
      borderRadius: `${GLASS_R}px`,
      duration: 0.15,
      ease: "power2.out",
    }, 0);
    tl.to(pill, {
      height: BTN_SIZE,
      top: (BOOKMARK_H - BTN_SIZE) / 2,
      borderRadius: `${BTN_RADIUS}px`,
      duration: 0.45,
      ease: "power3.out",
    }, 0.35);

    // Body expands in sync
    tl.to(body, {
      width: FULL_PILL_W_ACTUAL + PILL_END_RIGHT,
      duration: 0.8,
      ease: "back.out(1)",
    }, 0);

    // Glass → green
    tl.to(pill, {
      background: COLORS.primaryLight,
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      outline: "1px solid transparent",
      boxShadow: "none",
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => searchInputRef.current?.focus(),
    }, 0.45);

    // Text fades in
    if (searchTextRef.current) {
      tl.to(searchTextRef.current, {
        opacity: 0.65,
        duration: 0.25,
        ease: "power2.out",
      }, 0.35);
    }

  }, []);

  const closeSearch = useCallback(() => {
    if (!searchOpen.current) return;
    searchOpen.current = false;

    const pill = searchPillRef.current;
    const body = bodyRef.current;
    if (!pill || !body) return;

    // Restore buttons at correct sizes (invisible) FIRST so measurements are correct
    if (finanzToolsRef.current) gsap.set(finanzToolsRef.current, { opacity: 0 });
    if (lupeRef.current) gsap.set(lupeRef.current, { opacity: 0 });
    if (burgerWrapRef.current) {
      if (burgerVisible.current) {
        gsap.set(burgerWrapRef.current, { width: BTN_SIZE, opacity: 0 });
        burgerLinesRef.current.forEach((line) => gsap.set(line, { width: BURGER_LINE_W }));
      } else {
        gsap.set(burgerWrapRef.current, { width: 0, opacity: 0 });
        burgerLinesRef.current.forEach((line) => gsap.set(line, { width: 0 }));
      }
    }

    // Measure target body width and lupe position with buttons in place
    const currentWidth = body.offsetWidth;
    body.style.width = "";
    const targetWidth = body.offsetWidth;
    body.style.width = `${currentWidth}px`;

    const ISX = innerStartX.current;

    // Calculate lupe position for collapse target

    const tl = gsap.timeline();

    // Fade out text
    if (searchTextRef.current) {
      tl.to(searchTextRef.current, { opacity: 0, duration: 0.15, ease: "power2.in" }, 0);
    }

    // Green → glass
    tl.to(pill, {
      ...GLASS_STYLE,
      duration: 0.2,
      ease: "power2.out",
    }, 0.05);

    // Height pulse during shrink
    tl.to(pill, {
      height: GLASS_H,
      top: (BOOKMARK_H - GLASS_H) / 2,
      borderRadius: `${GLASS_R}px`,
      duration: 0.2,
      ease: "power2.out",
    }, 0.15);

    // Collapse to lupe size — right follows lupe position every frame
    // Collapse to lupe size — gentle easeInOut
    const bodyRect = body.getBoundingClientRect();
    const lupeRect = lupeRef.current?.getBoundingClientRect();
    const pillTargetRight = lupeRect ? bodyRect.right - lupeRect.right : 17;

    tl.to(pill, {
      width: BTN_SIZE,
      right: pillTargetRight,
      height: BTN_SIZE,
      top: (BOOKMARK_H - BTN_SIZE) / 2,
      borderRadius: `${BTN_RADIUS}px`,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.set(pill, { display: "none" });
        if (lupeRef.current) gsap.set(lupeRef.current, { opacity: 1 });
      },
    }, 0.35);
    tl.to(searchInnerRef.current, {
      x: ISX,
      duration: 0.5,
      ease: "power2.inOut",
    }, "<");

    // Body shrinks in sync
    tl.to(body, {
      width: targetWidth,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => { body.style.width = ""; },
    }, 0.1);

    // Fade buttons back in through the glass blur
    const showBurger = burgerVisible.current;
    [finanzToolsRef.current, showBurger ? burgerWrapRef.current : null].filter(Boolean).forEach((el) => {
      gsap.to(el, { opacity: 1, duration: 0.3, delay: 0.2, ease: "power3.out" });
    });

    // Reset burger opacity so showBurger works later even if burger wasn't visible now
    if (burgerWrapRef.current && !showBurger) {
      gsap.set(burgerWrapRef.current, { opacity: 1 });
    }
  }, []);

  /* ── Hover helpers ── */

  const onBtnEnter = (el: HTMLElement) => gsap.to(el, { background: COLORS.hoverBg, duration: 0.15 });
  const onBtnLeave = (el: HTMLElement) => gsap.to(el, { background: "transparent", duration: 0.15 });
  const onBtnDown = (el: HTMLElement) => gsap.to(el, { background: COLORS.primaryLight, duration: 0.08 });
  const onBtnUp = (el: HTMLElement) => gsap.to(el, { background: COLORS.hoverBg, duration: 0.15 });

  /* ── Render ── */

  return (
    <div
      ref={bookmarkRef}
      style={{
        position: "fixed",
        top: "23px",
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "stretch",
        height: `${BOOKMARK_H}px`,
        pointerEvents: "auto",
      }}
    >
      {/* Spikes */}
      <div style={{ width: 40, height: "100%", marginRight: -1, flexShrink: 0 }}>
        <Image
          src="/icons/lesezeichen-spikes.svg"
          alt=""
          width={40}
          height={BOOKMARK_H}
          aria-hidden
          style={{ display: "block", width: 40, height: "100%" }}
        />
      </div>

      {/* Green gradient body */}
      <div
        ref={bodyRef}
        style={{
          position: "relative",
          height: "100%",
          overflow: "visible",
          background: `linear-gradient(to left, ${COLORS.gradientFrom}, ${COLORS.primary})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "4px",
          paddingLeft: 1,
          paddingRight: 17,
          marginRight: -1,
        }}
      >
        {/* Finanztools button */}
        <button
          ref={finanzToolsRef}
          onMouseEnter={(e) => onBtnEnter(e.currentTarget)}
          onMouseLeave={(e) => onBtnLeave(e.currentTarget)}
          onMouseDown={(e) => onBtnDown(e.currentTarget)}
          onMouseUp={(e) => onBtnUp(e.currentTarget)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: BTN_SIZE, padding: "0 10px", borderRadius: BTN_RADIUS,
            border: "none", background: "transparent", cursor: "pointer",
            whiteSpace: "nowrap", fontFamily: "'Open Sans', sans-serif",
            fontSize: "17px", fontWeight: 400, color: "white",
          }}
        >
          Finanztools
        </button>

        {/* Lupe button */}
        <button
          ref={lupeRef}
          onClick={openSearch}
          onMouseEnter={(e) => onBtnEnter(e.currentTarget)}
          onMouseLeave={(e) => onBtnLeave(e.currentTarget)}
          onMouseDown={(e) => onBtnDown(e.currentTarget)}
          onMouseUp={(e) => onBtnUp(e.currentTarget)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_RADIUS,
            border: "none", background: "transparent", cursor: "pointer", padding: 1,
          }}
        >
          <Image src="/icons/lupe.svg" alt="Suche" width={18} height={18} />
        </button>

        {/* Search pill — absolute, overflow hidden, starts hidden */}
        <div
          ref={searchPillRef}
          style={{
            display: "none",
            position: "absolute",
            overflow: "hidden",
            zIndex: 3,
          }}
        >
          {/* Inner content — absolutely positioned from left, shifted so lupe is visible */}
          <div
            ref={searchInnerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              alignItems: "center",
              gap: 0,
              height: "100%",
              width: "fit-content",
              paddingLeft: 15,
              paddingRight: 4,
              whiteSpace: "nowrap",
            }}
          >
            <span
              ref={searchTextRef}
              style={{
                fontFamily: "'Open Sans', sans-serif",
                fontSize: "18px",
                fontWeight: 400,
                color: "white",
                flexShrink: 0,
                opacity: 0,
              }}
            >
              Finanzleser durchsuchen
            </span>
            <button
              onMouseEnter={(e) => onBtnEnter(e.currentTarget)}
              onMouseLeave={(e) => onBtnLeave(e.currentTarget)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_RADIUS,
                border: "none", background: "transparent", cursor: "pointer",
                flexShrink: 0, padding: 0, marginLeft: 12,
              }}
            >
              <Image src="/icons/lupe.svg" alt="Suchen" width={18} height={18} />
            </button>
            <button
              onClick={closeSearch}
              onMouseEnter={(e) => onBtnEnter(e.currentTarget)}
              onMouseLeave={(e) => onBtnLeave(e.currentTarget)}
              aria-label="Suche schließen"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: CLOSE_BTN, height: CLOSE_BTN, borderRadius: BTN_RADIUS,
                border: "none", background: "transparent", cursor: "pointer",
                flexShrink: 0, padding: 0, marginLeft: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M1 1L13 13M1 13L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            onKeyDown={(e) => { if (e.key === "Escape") closeSearch(); }}
            style={{
              position: "absolute",
              width: 0, height: 0, opacity: 0,
              border: "none", background: "transparent",
            }}
          />
        </div>

        {/* Burger — clipping wrapper */}
        <div
          ref={burgerWrapRef}
          style={{ width: 0, height: BTN_SIZE, overflow: "hidden", flexShrink: 0, marginRight: -2 }}
        >
          <div
            ref={burgerRef}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-end",
              justifyContent: "center", width: BTN_SIZE, height: BTN_SIZE,
              borderRadius: BTN_RADIUS, cursor: "pointer", background: "transparent",
              gap: BURGER_GAP, paddingRight: (BTN_SIZE - BURGER_LINE_W) / 2,
            }}
            onMouseEnter={(e) => onBtnEnter(e.currentTarget)}
            onMouseLeave={(e) => onBtnLeave(e.currentTarget)}
            onMouseDown={(e) => onBtnDown(e.currentTarget)}
            onMouseUp={(e) => onBtnUp(e.currentTarget)}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                ref={(el) => { if (el) burgerLinesRef.current[i] = el; }}
                style={{ width: 0, height: 2, borderRadius: 1, background: "white" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
