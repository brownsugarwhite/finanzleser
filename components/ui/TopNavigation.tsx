"use client";
import { Merriweather } from "next/font/google";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

const merriweather = Merriweather({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-nav",
});

const NAV_ITEMS = [
  { label: "Finanzen", href: "/finanzen" },
  { label: "Versicherungen", href: "/versicherungen" },
  { label: "Steuern", href: "/steuern" },
  { label: "Recht", href: "/recht" },
];

/* ── Constants ──────────────────────────────────── */

const PILL_H = 44;
const PILL_R = 17;
const PX = 20; // horizontal padding around button text inside pill

const COLORS = {
  text: "#334a27",
  green: "#45A117",
  pink: "#D3005E",
  white: "#ffffff",
};

const PILL_SHADOW = "0px 4px 4px rgba(0,0,0,0.1), inset 0px 4px 4px rgba(0,0,0,0.08)";
const PILL_BORDER = "rgba(255,255,255,0.5)";

/* ── Styles ─────────────────────────────────────── */

const NAV_BTN_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-nav)",
  fontSize: "18px",
  fontWeight: 700,
  color: COLORS.text,
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: `12px ${PX}px`,
  margin: `0 -${PX}px`,
  position: "relative",
  zIndex: 1,
};

const LENS_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-nav)",
  fontSize: "18px",
  fontWeight: 700,
  color: COLORS.green,
  whiteSpace: "nowrap",
};

const ITEMS_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "25px",
};

/* ── Helpers ────────────────────────────────────── */

const Spark = () => (
  <Image src="/icons/nav-spark.svg" alt="" width={12} height={12} aria-hidden style={{ pointerEvents: "none" }} />
);

const blobRadius = (h: number) => `${Math.max(PILL_R, h / 2)}px`;

const pillPos = (container: DOMRect, btn: DOMRect) => ({
  x: btn.left - container.left,
  w: btn.width,
});

/* ── Component ──────────────────────────────────── */

export default function TopNavigation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const megaTitleRef = useRef<HTMLHeadingElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const lastHoveredLabel = useRef("");

  const pillVisible = useRef(false);
  const menuOpen = useRef(false);
  const activeLabel = useRef("");
  const [megaShown, setMegaShown] = useState(false);

  // ── Lens sync (runs every frame) ──

  useEffect(() => {
    const sync = () => {
      if (!pillRef.current || !lensRef.current) return;
      const px = gsap.getProperty(pillRef.current, "x") as number;
      const pw = gsap.getProperty(pillRef.current, "width") as number;
      gsap.set(lensRef.current, { x: -px });
      lensRef.current.style.transformOrigin = `${px + pw / 2}px center`;
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, []);

  // ── Pill style transitions ──

  const setPillHover = (instant = false) => {
    if (!pillRef.current || !lensRef.current) return;
    const d = instant ? 0 : 0.2;
    gsap.to(pillRef.current, {
      background: COLORS.white, borderColor: PILL_BORDER, boxShadow: PILL_SHADOW,
      duration: d, ease: "power2.out",
    });
    lensRef.current.querySelectorAll("span").forEach((s) =>
      gsap.to(s, { color: COLORS.green, duration: d })
    );
    lensRef.current.querySelectorAll("img").forEach((img) =>
      gsap.to(img, { filter: "none", duration: d })
    );
  };

  const setPillActive = () => {
    if (!pillRef.current || !lensRef.current) return;
    gsap.to(pillRef.current, {
      background: COLORS.pink, borderColor: "transparent", boxShadow: "none",
      duration: 0.15, ease: "power2.in",
    });
    lensRef.current.querySelectorAll("span").forEach((s) =>
      gsap.to(s, { color: COLORS.white, duration: 0.15 })
    );
    lensRef.current.querySelectorAll("img").forEach((img) =>
      gsap.to(img, { filter: "brightness(0) invert(1)", duration: 0.15 })
    );
  };

  // ── Page content blur ──

  const blurPageContent = (blur: boolean) => {
    const nav = containerRef.current?.closest("nav");
    const pageWrapper = nav?.parentElement;
    if (!pageWrapper) return;

    Array.from(pageWrapper.children).forEach((child) => {
      if (child instanceof HTMLElement && !child.contains(containerRef.current!) && child !== megaRef.current && getComputedStyle(child).position !== "fixed") {
        const rect = child.getBoundingClientRect();
        child.style.transformOrigin =
          `${window.innerWidth / 2 - rect.left}px ${window.innerHeight / 2 - rect.top}px`;
        gsap.to(child, {
          scale: blur ? 0.9 : 1,
          filter: blur ? "blur(13px)" : "blur(0px)",
          duration: blur ? 0.5 : 0.4,
          ease: "power3.out",
        });
      }
    });
  };

  // ── Mega menu ──

  const showMega = (label: string) => {
    const isNew = activeLabel.current !== label;
    activeLabel.current = label;

    if (!megaShown) {
      setMegaShown(true);
      requestAnimationFrame(() => {
        if (megaRef.current)
          gsap.fromTo(megaRef.current,
            { opacity: 0, y: -20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" },
          );
        if (megaTitleRef.current) {
          megaTitleRef.current.textContent = label;
          gsap.fromTo(megaTitleRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" },
          );
        }
      });
    } else if (isNew && megaTitleRef.current) {
      const el = megaTitleRef.current;
      gsap.to(el, {
        opacity: 0, y: -10, duration: 0.15, ease: "power2.in",
        onComplete: () => {
          el.textContent = label;
          gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" });
        },
      });
    }
  };

  const hideMega = () => {
    if (!megaRef.current) { setMegaShown(false); return; }
    gsap.to(megaRef.current, {
      opacity: 0, y: -12, scale: 0.97, duration: 0.25, ease: "power3.in",
      onComplete: () => { setMegaShown(false); activeLabel.current = ""; },
    });
  };

  // ── Waterdrop animation (shared) ──

  const waterdropTo = (targetX: number, targetW: number) => {
    if (!pillRef.current) return;

    const curX = gsap.getProperty(pillRef.current, "x") as number;
    const curW = gsap.getProperty(pillRef.current, "width") as number;
    const curH = gsap.getProperty(pillRef.current, "height") as number;
    const right = targetX > curX;
    const dist = Math.abs((targetX + targetW / 2) - (curX + curW / 2));

    if (dist < 5) {
      gsap.to(pillRef.current, {
        x: targetX, width: targetW, height: PILL_H,
        duration: 0.3, ease: "power2.out",
      });
      return;
    }

    const stretchDur = Math.max(0.1, 0.15 + Math.min(dist / 2500, 0.1)) + Math.random() * 0.03;
    const settleDur = Math.max(0.25, 0.4 + Math.min(dist / 1500, 0.15)) + Math.random() * 0.08;
    const frac = 0.25 + Math.random() * 0.1;
    const stretchH = Math.min(curH, 30 + Math.random() * 3);

    const tl = gsap.timeline();

    // Phase 1: stretch toward target, get slimmer
    if (right) {
      const sw = curW + (targetX + targetW - curX - curW) * frac;
      tl.to(pillRef.current, {
        width: sw, height: stretchH, borderRadius: blobRadius(stretchH),
        duration: stretchDur, ease: "power2.inOut",
      });
    } else {
      const sx = curX - (curX - targetX) * frac;
      const sw = (curX + curW) - sx;
      tl.to(pillRef.current, {
        x: sx, width: sw, height: stretchH, borderRadius: blobRadius(stretchH),
        duration: stretchDur, ease: "power2.inOut",
      });
    }

    // Phase 2: release with bounce
    tl.to(pillRef.current, {
      x: targetX, width: targetW, borderRadius: `${PILL_R}px`,
      duration: settleDur, ease: "back.out(1.6)",
    });

    // Height bounces back in parallel
    tl.to(pillRef.current, {
      height: PILL_H,
      duration: settleDur, ease: "back.out(4)",
    }, "<");
  };

  // ── Close menu ──

  const closeMenu = useCallback(() => {
    if (!menuOpen.current) return;
    menuOpen.current = false;
    blurPageContent(false);
    hideMega();
    pillVisible.current = false;
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      scaleX: 0, scaleY: 0, opacity: 0, borderRadius: `${PILL_R}px`,
      duration: 0.25, ease: "power3.in",
      onComplete: () => {
        if (pillRef.current) {
          gsap.set(pillRef.current, { scaleX: 1, scaleY: 1, width: 1 });
          setPillHover(true);
        }
      },
    });
  }, []);

  // Click outside buttons + mega to close
  useEffect(() => {
    const onOutsideClick = (e: MouseEvent) => {
      if (!menuOpen.current) return;
      const target = e.target as HTMLElement;
      if (target.closest("button") && containerRef.current?.contains(target)) return;
      if (megaRef.current?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [closeMenu]);

  // ── Snap back to active button ──

  const snapBackToActive = () => {
    if (!pillRef.current || !containerRef.current || !menuOpen.current) return;
    const activeBtn = Array.from(containerRef.current.querySelectorAll("button"))
      .find((b) => b.textContent === activeLabel.current);
    if (!activeBtn) return;

    gsap.killTweensOf(pillRef.current);
    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), activeBtn.getBoundingClientRect());
    waterdropTo(x, w);
  };

  // ── Pill hover movement ──

  const movePillTo = (el: HTMLElement, label: string) => {
    if (!pillRef.current || !containerRef.current) return;
    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), el.getBoundingClientRect());

    // First appearance: bloom from center
    if (!pillVisible.current) {
      pillVisible.current = true;
      const cx = x + w / 2;
      gsap.set(pillRef.current, {
        left: 0, x: cx - 5, width: 10, height: 10,
        borderRadius: `${PILL_R}px`, opacity: 1,
      });
      setPillHover(true);
      gsap.to(pillRef.current, {
        x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
        duration: 0.45, ease: "power3.out",
      });
      return;
    }

    gsap.killTweensOf(pillRef.current);

    // Active button hover while pill is sitting on it: subtle grow
    if (menuOpen.current && activeLabel.current === label) {
      const curX = gsap.getProperty(pillRef.current, "x") as number;
      const curW = gsap.getProperty(pillRef.current, "width") as number;
      const dist = Math.abs((x + w / 2) - (curX + curW / 2));
      if (dist < 5) {
        const grow = 8;
        gsap.to(pillRef.current, {
          x: x - grow / 2, width: w + grow, height: PILL_H + grow,
          duration: 0.3, ease: "power2.out",
        });
        return;
      }
    }

    waterdropTo(x, w);
  };

  // When mouse is in a gap between buttons, find which side of the spark midpoint we're on
  const handleContainerMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !pillVisible.current) return;
    if ((e.target as HTMLElement).closest("button")) return;

    const mouseX = e.clientX;
    const btns = btnRefs.current.filter(Boolean);
    if (btns.length === 0) return;

    // Check if mouse is before first button or after last button → snap back
    const firstRect = btns[0].getBoundingClientRect();
    const lastRect = btns[btns.length - 1].getBoundingClientRect();
    if (mouseX < firstRect.left || mouseX > lastRect.right) {
      if (menuOpen.current) {
        if (lastHoveredLabel.current !== activeLabel.current) {
          lastHoveredLabel.current = activeLabel.current;
          snapBackToActive();
        }
      }
      return;
    }

    // Find the button whose zone we're in (split at the midpoint between adjacent buttons)
    for (let i = 0; i < btns.length; i++) {
      const rect = btns[i].getBoundingClientRect();
      let zoneEnd = rect.right;

      if (i < btns.length - 1) {
        const nextRect = btns[i + 1].getBoundingClientRect();
        zoneEnd = (rect.right + nextRect.left) / 2;
      }

      if (mouseX <= zoneEnd || i === btns.length - 1) {
        const label = btns[i].textContent || "";
        if (label !== lastHoveredLabel.current) {
          lastHoveredLabel.current = label;
          movePillTo(btns[i], label);
        }
        return;
      }
    }
  };

  const hidePill = () => {
    if (!pillVisible.current) return;
    if (menuOpen.current) { snapBackToActive(); return; }

    pillVisible.current = false;
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      scaleX: 0, scaleY: 0, opacity: 0, borderRadius: `${PILL_R}px`,
      duration: 0.25, ease: "power3.in",
      onComplete: () => {
        if (pillRef.current) gsap.set(pillRef.current, { scaleX: 1, scaleY: 1, width: 1 });
      },
    });
  };

  // ── Click handler ──

  const handleClick = (label: string, btnEl: HTMLElement) => {
    if (!menuOpen.current) {
      menuOpen.current = true;
      gsap.killTweensOf(pillRef.current);
      setPillActive();
      if (containerRef.current) {
        const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btnEl.getBoundingClientRect());
        gsap.to(pillRef.current, {
          x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
          duration: 0.35, ease: "power3.out",
        });
      }
      blurPageContent(true);
      showMega(label);
    } else if (activeLabel.current !== label) {
      gsap.killTweensOf(pillRef.current);
      if (containerRef.current) {
        const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btnEl.getBoundingClientRect());
        gsap.to(pillRef.current, {
          x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
          duration: 0.35, ease: "power3.out",
        });
      }
      showMega(label);
    }
  };

  // ── Render ──

  return (
    <>
      <nav
        className={merriweather.variable}
        style={{
          position: "relative", zIndex: 60, width: "100%", height: "50px",
          display: "flex", alignItems: "center", marginTop: "25px", overflow: "visible",
        }}
      >
        <div
          ref={containerRef}
          onMouseMove={handleContainerMove}
          onMouseLeave={hidePill}
          style={{
            position: "relative", width: "100%", maxWidth: "960px",
            overflow: "visible", ...ITEMS_ROW,
          }}
        >
          {/* Pill */}
          <div
            ref={pillRef}
            style={{
              position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)",
              height: `${PILL_H}px`, width: "1px", opacity: 0, borderRadius: `${PILL_R}px`,
              pointerEvents: "none", zIndex: 2, overflow: "hidden",
              background: COLORS.white,
              border: `1px solid ${PILL_BORDER}`,
              boxShadow: PILL_SHADOW,
            }}
          >
            {/* Magnified lens text */}
            <div
              ref={lensRef}
              style={{
                position: "absolute", top: "50%", left: 0,
                transform: "translateY(-50%) scale(1.07)",
                ...ITEMS_ROW, pointerEvents: "none",
              }}
            >
              {NAV_ITEMS.map((item) => (
                <Fragment key={item.href}>
                  <Image src="/icons/nav-spark-green.svg" alt="" width={12} height={12} aria-hidden />
                  <span style={LENS_TEXT_STYLE}>{item.label}</span>
                </Fragment>
              ))}
            </div>
          </div>

          {/* Nav buttons */}
          {NAV_ITEMS.map((item) => (
            <Fragment key={item.href}>
              <Spark />
              <button
                ref={(el) => { if (el) btnRefs.current[NAV_ITEMS.indexOf(item)] = el; }}
                onMouseEnter={(e) => { lastHoveredLabel.current = item.label; movePillTo(e.currentTarget, item.label); }}
                onClick={(e) => handleClick(item.label, e.currentTarget)}
                style={NAV_BTN_STYLE}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      </nav>

      {/* Mega menu (placeholder) */}
      {megaShown && (
        <div
          ref={megaRef}
          style={{
            position: "fixed", top: "100px", left: "50%", transform: "translateX(-50%)",
            width: "min(90vw, 800px)", minHeight: "300px", background: COLORS.white,
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 70, padding: "40px", opacity: 0,
          }}
        >
          <button
            onClick={closeMenu}
            aria-label="Menü schließen"
            style={{
              position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px",
              borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.05)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", color: COLORS.text, fontWeight: 700,
            }}
          >
            ✕
          </button>
          <h2
            ref={megaTitleRef}
            className={merriweather.variable}
            style={{
              fontFamily: "var(--font-nav)", fontSize: "32px", fontWeight: 700,
              color: COLORS.text, marginBottom: "24px",
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: "48px", borderRadius: "10px", background: "rgba(69,161,23,0.08)" }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
