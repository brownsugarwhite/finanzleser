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
const SEARCH_W = 280;
const GLASS_H = 70;
const GLASS_R = 23;
const REST_TOP = (BOOKMARK_H - BTN_SIZE) / 2;

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const burgerVisible = useRef(false);
  const searchOpen = useRef(false);
  const bodyDefaultW = useRef(0);

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

    // Calculate lupe position relative to body
    const bodyRect = body.getBoundingClientRect();
    const lupeRect = lupe.getBoundingClientRect();
    // Align pill so its inner lupe icon lands exactly on the real lupe icon
    // Real lupe: icon centered in 36px button → center at lupeRect.right - 18px from body right
    // Pill lupe: icon centered in 36px button, inside paddingRight:4 → center at pillRight + 4 + 18 from body right
    // Match centers: pillRight + 22 = bodyRight - lupeCenter → pillRight = bodyRight - lupeCenter - 22
    const lupeCenterFromRight = bodyRect.right - (lupeRect.left + lupeRect.width / 2);
    const pillLupeCenterOffset = 4 + BTN_SIZE / 2; // paddingRight + half button
    const lupeRight = lupeCenterFromRight - pillLupeCenterOffset;
    const lupeTop = lupeRect.top - bodyRect.top;
    const PILL_PAD_RIGHT = 25; // space from body right edge (matches paddingRight)

    // Store body default width for restore
    bodyDefaultW.current = body.offsetWidth;

    // Start: glass pill at lupe's exact position
    gsap.set(pill, {
      display: "flex",
      position: "absolute",
      right: lupeRight,
      top: lupeTop,
      width: BTN_SIZE,
      height: BTN_SIZE,
      borderRadius: `${BTN_RADIUS}px`,
      ...GLASS_STYLE,
      opacity: 1,
      zIndex: 3,
    });

    // Hide the real lupe behind the pill
    gsap.set(lupe, { opacity: 0 });

    const tl = gsap.timeline();

    // Phase 1: Width grows to 80%
    tl.to(pill, {
      width: SEARCH_W * 0.8,
      right: PILL_PAD_RIGHT,
      borderRadius: `${GLASS_R}px`,
      duration: 1.8,
      ease: "power2.in",
    });

    // Height reaches 70px faster than width
    tl.to(pill, {
      height: GLASS_H,
      top: -(GLASS_H - BOOKMARK_H) / 2,
      duration: 0.8,
      ease: "power2.inOut",
    }, 0);

    // Phase 2: Settle to 100% width + 36px height with bouncy easeInOut
    tl.to(pill, {
      width: SEARCH_W,
      height: BTN_SIZE,
      top: REST_TOP,
      borderRadius: `${BTN_RADIUS}px`,
      duration: 1.2,
      ease: "back.out(2)",
    });

    // Body expands across the whole animation
    tl.to(body, {
      width: SEARCH_W + PILL_PAD_RIGHT + 10,
      duration: 3,
      ease: "power2.inOut",
    }, 0);

    // Glass → green (starts when settle begins)
    tl.to(pill, {
      background: COLORS.primaryLight,
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      outline: "1px solid transparent",
      boxShadow: "none",
      duration: 1,
      ease: "power2.out",
      onComplete: () => searchInputRef.current?.focus(),
    }, 1.8);

    // Text fades in during glass → green transition
    if (searchTextRef.current) {
      tl.to(searchTextRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      }, 1.6);
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
    if (burgerWrapRef.current && burgerVisible.current) {
      gsap.set(burgerWrapRef.current, { width: BTN_SIZE, opacity: 0 });
      burgerLinesRef.current.forEach((line) => gsap.set(line, { width: BURGER_LINE_W }));
    }

    // Measure target body width and lupe position with buttons in place
    const currentWidth = body.offsetWidth;
    body.style.width = "";
    const targetWidth = body.offsetWidth;
    body.style.width = `${currentWidth}px`;

    const bodyRect = body.getBoundingClientRect();
    const lupeRect = lupeRef.current?.getBoundingClientRect();
    const lupeCenterFromRight = lupeRect ? bodyRect.right - (lupeRect.left + lupeRect.width / 2) : 25;
    const pillLupeCenterOffset = 4 + BTN_SIZE / 2;
    const lupeRight = lupeCenterFromRight - pillLupeCenterOffset;

    const tl = gsap.timeline();

    // Fade out text
    if (searchTextRef.current) {
      tl.to(searchTextRef.current, { opacity: 0, duration: 0.6, ease: "power2.in" });
    }

    // Green → glass
    tl.to(pill, {
      ...GLASS_STYLE,
      duration: 0.8,
      ease: "power2.out",
    }, 0.3);

    // Phase 1: Shrink to 80% width + height pulses to 70px
    tl.to(pill, {
      width: SEARCH_W * 0.8,
      height: GLASS_H,
      top: -(GLASS_H - BOOKMARK_H) / 2,
      borderRadius: `${GLASS_R}px`,
      duration: 1.2,
      ease: "back.in(2)",
    }, 0.8);

    // Phase 2: Collapse to lupe position (measured with burger in place)
    tl.to(pill, {
      width: BTN_SIZE,
      height: BTN_SIZE,
      right: lupeRight,
      top: REST_TOP,
      borderRadius: `${BTN_RADIUS}px`,
      duration: 1.8,
      ease: "power2.out",
      onComplete: () => {
        gsap.set(pill, { display: "none" });
        if (lupeRef.current) gsap.set(lupeRef.current, { opacity: 1 });
      },
    });

    // Body shrinks to natural width across the whole animation
    tl.to(body, {
      width: targetWidth,
      duration: 3,
      ease: "power2.inOut",
      onComplete: () => { body.style.width = ""; },
    }, 0);

    // Fade buttons back in early so they're visible through the glass blur
    [finanzToolsRef.current, burgerVisible.current ? burgerWrapRef.current : null].filter(Boolean).forEach((el) => {
      gsap.to(el, { opacity: 1, duration: 1.2, delay: 0.8, ease: "power3.out" });
    });
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
        top: "15px",
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
          paddingRight: 25,
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

        {/* Search pill — absolute, clips fixed-width inner content like a mask */}
        <div
          ref={searchPillRef}
          style={{
            display: "none",
            position: "absolute",
            height: BTN_SIZE,
            width: BTN_SIZE,
            overflow: "hidden",
            borderRadius: BTN_RADIUS,
            zIndex: 3,
          }}
        >
          {/* Fixed-width content — never moves, pill just reveals it */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: SEARCH_W,
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 7,
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
            <div style={{ flex: 1 }} />
            <button
              onClick={closeSearch}
              onMouseEnter={(e) => onBtnEnter(e.currentTarget)}
              onMouseLeave={(e) => onBtnLeave(e.currentTarget)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_RADIUS,
                border: "none", background: "transparent", cursor: "pointer",
                flexShrink: 0, padding: 0,
              }}
            >
              <Image src="/icons/lupe.svg" alt="Suchen" width={18} height={18} />
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
          style={{ width: 0, height: BTN_SIZE, overflow: "hidden", flexShrink: 0 }}
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
