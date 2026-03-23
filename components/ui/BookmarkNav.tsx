"use client";
import Image from "next/image";
import { useEffect, useRef, useCallback, useState } from "react";
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

/* ── Component ──────────────────────────────────── */

export default function BookmarkNav() {
  const [isMobileView, setIsMobileView] = useState(false);
  const bookmarkRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const burgerWrapRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLDivElement>(null);
  const burgerLinesRef = useRef<HTMLDivElement[]>([]);
  const lupeRef = useRef<HTMLButtonElement>(null);
  const newsletterRef = useRef<HTMLDivElement>(null);
  const searchPillRef = useRef<HTMLDivElement>(null);
  const searchInnerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const burgerVisible = useRef(false);
  const searchOpen = useRef(false);
  const megaOpen = useRef(false);
  const bodyDefaultW = useRef(0);
  const innerStartX = useRef(0);

  /* ── Mobile view detection ── */

  useEffect(() => {
    const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
    setIsMobileView(isMobile());
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const handleMediaChange = (e: MediaQueryListEvent) => setIsMobileView(e.matches);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  /* ── Burger reveal on scroll ── */

  useEffect(() => {
    const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

    // Show burger immediately on mobile/tablet
    if (isMobile()) {
      burgerVisible.current = true;
      if (burgerWrapRef.current) {
        gsap.set(burgerWrapRef.current, { width: BTN_SIZE });
        burgerLinesRef.current.forEach((line) => gsap.set(line, { width: BURGER_LINE_W }));
      }
      if (newsletterRef.current) {
        gsap.set(newsletterRef.current, { width: 0 });
      }
    }

    const onOut = () => {
      if (!burgerVisible.current) {
        burgerVisible.current = true;
        showBurger();
      }
    };
    const onIn = () => {
      if (isMobile()) return; // keep burger visible on mobile
      if (burgerVisible.current) {
        burgerVisible.current = false;
        hideBurger();
      }
    };

    const onResize = () => {
      if (isMobile() && !burgerVisible.current) {
        burgerVisible.current = true;
        showBurger();
      } else if (!isMobile() && burgerVisible.current && window.scrollY === 0) {
        burgerVisible.current = false;
        hideBurger();
      }
    };

    window.addEventListener("nav-scrolled-out", onOut);
    window.addEventListener("nav-scrolled-in", onIn);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("nav-scrolled-out", onOut);
      window.removeEventListener("nav-scrolled-in", onIn);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const showBurger = () => {
    if (!burgerWrapRef.current || searchOpen.current) return;

    // Don't collapse newsletter if mega menu is open
    if (newsletterRef.current && !megaOpen.current) {
      gsap.to(newsletterRef.current, { width: 0, opacity: 0, duration: 0.4, ease: "power2.out" });
    }

    if (megaOpen.current) {
      // Set X shape, then stagger lines in
      const [top, mid, bot] = burgerLinesRef.current;
      burgerIsX.current = true;
      gsap.set(top, { y: BURGER_GAP + 2, rotation: 45, width: 0 });
      gsap.set(mid, { opacity: 0, scaleX: 0, width: BURGER_LINE_W });
      gsap.set(bot, { y: -(BURGER_GAP + 2), rotation: -45, width: 0 });
      gsap.fromTo(burgerWrapRef.current, { width: 0 }, { width: BTN_SIZE, duration: 0.4, ease: "power2.out" });
      [top, bot].forEach((line, i) => {
        gsap.to(line, { width: BURGER_LINE_W, duration: 0.3, delay: 0.15 + i * 0.06, ease: "power2.out" });
      });
    } else {
      gsap.fromTo(burgerWrapRef.current, { width: 0 }, { width: BTN_SIZE, duration: 0.4, ease: "power2.out" });
      burgerLinesRef.current.forEach((line, i) => {
        gsap.fromTo(line, { width: 0 }, {
          width: BURGER_LINE_W, duration: 0.3, delay: 0.15 + i * 0.06, ease: "power2.out",
        });
      });
    }
  };

  const hideBurger = () => {
    if (!burgerWrapRef.current || searchOpen.current) return;

    // Burger collapses, newsletter expands simultaneously
    burgerLinesRef.current.forEach((line, i) => {
      gsap.to(line, { width: 0, duration: 0.2, delay: (2 - i) * 0.04, ease: "power2.inOut" });
    });
    gsap.to(burgerWrapRef.current, { width: 0, duration: 0.4, ease: "power2.out" });
    if (newsletterRef.current) {
      const el = newsletterRef.current;
      gsap.set(el, { clearProps: "width" });
      const targetW = el.offsetWidth;
      gsap.fromTo(el, { width: 0, opacity: 0 }, { width: targetW, opacity: 1, duration: 0.4, ease: "power2.out", onComplete: () => { el.style.width = ""; } });
    }
  };

  /* ── Search ── */

  const openSearch = useCallback(() => {
    if (searchOpen.current) return;
    searchOpen.current = true;
    window.dispatchEvent(new CustomEvent("search-opened"));

    const pill = searchPillRef.current;
    const body = bodyRef.current;
    const lupe = lupeRef.current;
    if (!pill || !body || !lupe) return;

    // Calculate pill's starting right from the actual lupe button position
    const bodyRect = body.getBoundingClientRect();
    const lupeRect = lupe.getBoundingClientRect();
    const PILL_START_RIGHT = bodyRect.right - lupeRect.right;
    const PILL_END_RIGHT = 15;

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
    let FULL_PILL_W_ACTUAL = SEARCH_W;
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

    // Input text fades in with color change
    if (searchInputRef.current) {
      tl.to(searchInputRef.current, {
        color: "rgba(255,255,255,1)",
        duration: 0.25,
        ease: "power2.out",
      }, 0.55);
    }

  }, []);

  const closeSearch = useCallback(() => {
    if (!searchOpen.current) return;
    searchOpen.current = false;
    window.dispatchEvent(new CustomEvent("search-closed"));

    const pill = searchPillRef.current;
    const body = bodyRef.current;
    if (!pill || !body) return;

    // Restore buttons at correct sizes (invisible) FIRST so measurements are correct
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
    if (searchInputRef.current) {
      tl.to(searchInputRef.current, { color: "rgba(255,255,255,0)", duration: 0.15, ease: "power2.in" }, 0);
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
    [showBurger ? burgerWrapRef.current : null].filter(Boolean).forEach((el) => {
      gsap.to(el, { opacity: 1, duration: 0.3, delay: 0.2, ease: "power3.out" });
    });

    // Reset burger opacity so showBurger works later even if burger wasn't visible now
    if (burgerWrapRef.current && !showBurger) {
      gsap.set(burgerWrapRef.current, { opacity: 1 });
    }
  }, []);

  /* ── Close search on click outside ── */

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!searchOpen.current) return;
      const target = e.target as HTMLElement;
      if (searchPillRef.current?.contains(target)) return;
      if (lupeRef.current?.contains(target)) return;
      if (bookmarkRef.current?.contains(target)) return;
      closeSearch();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [closeSearch]);

  /* ── Burger to X animation ── */

  const burgerIsX = useRef(false);

  const animateToX = () => {
    if (burgerIsX.current) return;
    burgerIsX.current = true;
    const lines = burgerLinesRef.current;
    if (lines.length < 3) return;
    const [top, mid, bot] = lines;
    const tl = gsap.timeline();
    tl.to(top, { y: BURGER_GAP + 2, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(bot, { y: -(BURGER_GAP + 2), duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(mid, { opacity: 0, scaleX: 0, duration: 0.15, ease: "power2.in" }, 0);
    tl.to(top, { rotation: 45, duration: 0.25, ease: "power2.out" }, 0.15);
    tl.to(bot, { rotation: -45, duration: 0.25, ease: "power2.out" }, 0.15);
  };

  const animateToBurger = () => {
    if (!burgerIsX.current) return;
    burgerIsX.current = false;
    const lines = burgerLinesRef.current;
    if (lines.length < 3) return;
    const [top, mid, bot] = lines;
    const tl = gsap.timeline();
    tl.to(top, { rotation: 0, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(bot, { rotation: 0, duration: 0.2, ease: "power2.inOut" }, 0);
    tl.to(top, { y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
    tl.to(mid, { opacity: 1, scaleX: 1, duration: 0, ease: "power2.out" }, 0.15);
    tl.to(bot, { y: 0, duration: 0.2, ease: "power2.out" }, 0.15);
  };

  const newsletterW = useRef(0);

  const showNewsletter = () => {
    if (!newsletterRef.current || !burgerVisible.current || window.matchMedia("(max-width: 1024px)").matches) return;
    const el = newsletterRef.current;
    gsap.killTweensOf(el);
    // Measure natural width if we haven't yet
    if (!newsletterW.current) {
      const cur = el.style.width;
      el.style.width = "";
      newsletterW.current = el.offsetWidth;
      el.style.width = cur || "0px";
    }
    gsap.to(el, { width: newsletterW.current, opacity: 1, duration: 0.4, ease: "power2.out" });
  };

  const hideNewsletter = () => {
    if (!newsletterRef.current || !burgerVisible.current || window.matchMedia("(max-width: 1024px)").matches) return;
    gsap.killTweensOf(newsletterRef.current);
    gsap.to(newsletterRef.current, { width: 0, opacity: 0, duration: 0.4, ease: "power2.out" });
  };

  // Burger click: toggle mega menu
  const toggleBurgerX = () => {
    if (!megaOpen.current) {
      // Open mega
      window.dispatchEvent(new CustomEvent("burger-opened", { detail: { label: "Menü" } }));
      // On mobile, dispatch mega-show directly (no FixedNav/TopNav to handle it)
      if (window.matchMedia("(max-width: 1024px)").matches) {
        window.dispatchEvent(new CustomEvent("mega-show", { detail: { label: "Menü" } }));
      }
      animateToX();
    } else {
      // Close mega
      window.dispatchEvent(new CustomEvent("mega-hide"));
      window.dispatchEvent(new CustomEvent("mega-closed"));
    }
  };

  // Sync burger visual + newsletter with mega state
  useEffect(() => {
    const onMegaShow = () => {
      if (megaOpen.current) return; // already open, just switching buttons
      megaOpen.current = true;
      if (burgerVisible.current) {
        animateToX();
        showNewsletter();
      } else {
        // Burger not visible — force show it as X, newsletter is already visible
        burgerVisible.current = true;
        if (burgerWrapRef.current) {
          const [top, mid, bot] = burgerLinesRef.current;
          burgerIsX.current = true;
          gsap.set(top, { y: BURGER_GAP + 2, rotation: 45, width: 0 });
          gsap.set(mid, { opacity: 0, scaleX: 0, width: BURGER_LINE_W });
          gsap.set(bot, { y: -(BURGER_GAP + 2), rotation: -45, width: 0 });
          gsap.fromTo(burgerWrapRef.current, { width: 0 }, { width: BTN_SIZE, duration: 0.4, ease: "power2.out" });
          [top, bot].forEach((line, i) => {
            gsap.to(line, { width: BURGER_LINE_W, duration: 0.3, delay: 0.15 + i * 0.06, ease: "power2.out" });
          });
        }
      }
    };
    const onMegaClosed = () => {
      megaOpen.current = false;

      const navEl = document.querySelector("nav");
      const navOnScreen = navEl && navEl.getBoundingClientRect().bottom > 0;

      const isMobile = window.matchMedia("(max-width: 1024px)").matches;

      if (isMobile) {
        // Mobile — just animate X back to burger, keep visible
        animateToBurger();
      } else if (navOnScreen) {
        // Desktop at top — shrink X lines out, then collapse wrapper
        burgerIsX.current = false;
        burgerVisible.current = false;
        const [top, , bot] = burgerLinesRef.current;
        if (top) gsap.to(top, { width: 0, duration: 0.25, ease: "power2.inOut" });
        if (bot) gsap.to(bot, { width: 0, duration: 0.25, delay: 0.06, ease: "power2.inOut" });
        if (burgerWrapRef.current) {
          gsap.to(burgerWrapRef.current, { width: 0, duration: 0.3, delay: 0.15, ease: "power2.inOut",
            onComplete: () => {
              // Reset line transforms for next time
              burgerLinesRef.current.forEach((line) => {
                gsap.set(line, { clearProps: "y,rotation,opacity,scaleX" });
              });
            },
          });
        }
      } else {
        // Scrolled — animate X back to burger, hide newsletter
        animateToBurger();
        hideNewsletter();
      }
    };
    window.addEventListener("mega-show", onMegaShow);
    window.addEventListener("mega-closed", onMegaClosed);
    return () => {
      window.removeEventListener("mega-show", onMegaShow);
      window.removeEventListener("mega-closed", onMegaClosed);
    };
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
      className="bookmark-nav"
      style={{
        position: "fixed",
        top: isMobileView ? "17px" : "23px",
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

      {/* Blur rectangle behind the gradient body (not spikes) */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "calc(100% - 40px)",
        height: "100%",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        pointerEvents: "none",
        zIndex: -1,
      }} />

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
        {/* Newsletter button — clipping wrapper */}
        <div ref={newsletterRef} className="newsletter-btn" style={{ overflow: "hidden", flexShrink: 0 }}>
          <button
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
            Newsletter
          </button>
        </div>

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
            <input
              ref={searchInputRef}
              className="search-input"
              type="text"
              placeholder="Finanzleser durchsuchen"
              onKeyDown={(e) => { if (e.key === "Escape") closeSearch(); }}
              style={{
                fontFamily: "'Open Sans', sans-serif",
                fontSize: "18px",
                fontWeight: 400,
                color: "rgba(255,255,255,0)",
                flexShrink: 0,
                border: "none",
                background: "transparent",
                outline: "none",
                width: 230,
                caretColor: "white",
              }}
            />
            <button
              onClick={closeSearch}
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
          </div>
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
            onClick={toggleBurgerX}
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
