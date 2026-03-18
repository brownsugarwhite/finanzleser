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

const Spark = () => (
  <Image src="/icons/nav-spark.svg" alt="" width={12} height={12} aria-hidden />
);

const TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-nav)",
  fontSize: "18px",
  fontWeight: 700,
  color: "#334a27",
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
};

const LENS_TEXT_STYLE: React.CSSProperties = {
  ...TEXT_STYLE,
  color: "#45A117",
  cursor: "default",
};

const ITEMS_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "25px",
};

const PILL_H = 44;
const PILL_R = 17;
const PX = 20;

// Symmetric border-radius that scales with height
const blobRadius = (h: number) => {
  return `${Math.max(PILL_R, h / 2)}px`;
};

const pillPos = (cRect: DOMRect, iRect: DOMRect) => ({
  x: iRect.left - cRect.left,
  w: iRect.width,
});

export default function TopNavigation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const pillVisible = useRef(false);
  const menuOpen = useRef(false);
  const activeLabel = useRef("");
  const [megaShown, setMegaShown] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const megaTitleRef = useRef<HTMLHeadingElement>(null);

  // Sync lens position every frame
  useEffect(() => {
    const update = () => {
      if (!pillRef.current || !lensRef.current) return;
      const px = gsap.getProperty(pillRef.current, "x") as number;
      const pw = gsap.getProperty(pillRef.current, "width") as number;
      gsap.set(lensRef.current, { x: -px });
      lensRef.current.style.transformOrigin = `${px + pw / 2}px center`;
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  /* ── Styling helpers ──────────────────────────── */

  const setPillHover = (instant = false) => {
    if (!pillRef.current || !lensRef.current) return;
    const d = instant ? 0 : 0.2;
    gsap.to(pillRef.current, {
      background: "#ffffff",
      borderColor: "rgba(255, 255, 255, 0.6)",
      boxShadow:
        "0px 4px 4px rgba(0,0,0,0.1), inset 0px 4px 4px rgba(0,0,0,0.08)",
      duration: d, ease: "power2.out",
    });
    lensRef.current.querySelectorAll("span").forEach((s) => {
      gsap.to(s, { color: "#45A117", duration: d });
    });
    lensRef.current.querySelectorAll("img").forEach((img) => {
      gsap.to(img, { filter: "none", duration: d });
    });
  };

  const setPillActive = () => {
    if (!pillRef.current || !lensRef.current) return;
    gsap.to(pillRef.current, {
      background: "#D3005E", borderColor: "transparent", boxShadow: "none",
      duration: 0.15, ease: "power2.in",
    });
    lensRef.current.querySelectorAll("span").forEach((s) => {
      gsap.to(s, { color: "#ffffff", duration: 0.15 });
    });
    lensRef.current.querySelectorAll("img").forEach((img) => {
      gsap.to(img, { filter: "brightness(0) invert(1)", duration: 0.15 });
    });
  };

  /* ── Page content blur ────────────────────────── */

  const blurPageContent = (blur: boolean) => {
    const nav = containerRef.current?.closest("nav");
    const pw = nav?.parentElement;
    if (!pw) return;
    Array.from(pw.children).forEach((child) => {
      if (child instanceof HTMLElement && !child.contains(containerRef.current!) && child !== megaRef.current) {
        const r = child.getBoundingClientRect();
        child.style.transformOrigin = `${window.innerWidth / 2 - r.left}px ${window.innerHeight / 2 - r.top}px`;
        gsap.to(child, {
          scale: blur ? 0.9 : 1, filter: blur ? "blur(13px)" : "blur(0px)",
          duration: blur ? 0.5 : 0.4, ease: "power3.out",
        });
      }
    });
  };

  /* ── Mega menu ────────────────────────────────── */

  const showMega = (label: string) => {
    const isNew = activeLabel.current !== label;
    activeLabel.current = label;
    if (!megaShown) {
      setMegaShown(true);
      requestAnimationFrame(() => {
        if (megaRef.current) gsap.fromTo(megaRef.current, { opacity: 0, y: -20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" });
        if (megaTitleRef.current) {
          megaTitleRef.current.textContent = label;
          gsap.fromTo(megaTitleRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" });
        }
      });
    } else if (isNew && megaTitleRef.current) {
      const el = megaTitleRef.current;
      gsap.to(el, { opacity: 0, y: -10, duration: 0.15, ease: "power2.in", onComplete: () => {
        el.textContent = label;
        gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" });
      }});
    }
  };

  const hideMega = () => {
    if (!megaRef.current) { setMegaShown(false); return; }
    gsap.to(megaRef.current, { opacity: 0, y: -12, scale: 0.97, duration: 0.25, ease: "power3.in", onComplete: () => { setMegaShown(false); activeLabel.current = ""; }});
  };

  /* ── Close menu ───────────────────────────────── */

  const closeMenu = useCallback(() => {
    if (!menuOpen.current) return;
    menuOpen.current = false;
    blurPageContent(false);
    hideMega();
    // Hide the pill completely
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

  // Click outside nav + mega to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!menuOpen.current) return;
      const target = e.target as HTMLElement;
      // Only actual buttons keep the menu open
      if (target.closest("button") && containerRef.current?.contains(target)) return;
      if (megaRef.current?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [closeMenu]);

  /* ── Pill movement ────────────────────────────── */

  const movePillTo = (el: HTMLElement, label: string) => {
    if (!pillRef.current || !containerRef.current) return;
    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), el.getBoundingClientRect());
    const cx = x + w / 2;

    // First appearance
    if (!pillVisible.current) {
      pillVisible.current = true;
      const s = 10;
      gsap.set(pillRef.current, {
        left: 0, x: cx - s / 2, width: s, height: s,
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

    // Pill is sitting on the active button (pink, hasn't moved) — subtle grow only
    if (menuOpen.current && activeLabel.current === label) {
      const curX = gsap.getProperty(pillRef.current, "x") as number;
      const dist = Math.abs((x + w / 2) - (curX + (gsap.getProperty(pillRef.current, "width") as number) / 2));
      if (dist < 5) {
        const grow = 8;
        gsap.to(pillRef.current, {
          x: x - grow / 2, width: w + grow, height: PILL_H + grow,
          duration: 0.3, ease: "power2.out",
        });
        return;
      }
    }

    const curX = gsap.getProperty(pillRef.current, "x") as number;
    const curW = gsap.getProperty(pillRef.current, "width") as number;
    const curH = gsap.getProperty(pillRef.current, "height") as number;
    const right = x > curX;
    const dist = Math.abs((x + w / 2) - (curX + curW / 2));

    // Scale timing and stretch to current distance — feels natural from any mid-state
    const stretchDur = Math.max(0.1, 0.15 + Math.min(dist / 2500, 0.1)) + Math.random() * 0.03;
    const settleDur = Math.max(0.25, 0.4 + Math.min(dist / 1500, 0.15)) + Math.random() * 0.08;
    const frac = 0.25 + Math.random() * 0.1;
    const stretchH = Math.min(curH, 30 + Math.random() * 3);

    const tl = gsap.timeline();

    if (right) {
      const sw = curW + (x + w - curX - curW) * frac;
      tl.to(pillRef.current, {
        width: sw, height: stretchH, borderRadius: blobRadius(stretchH),
        duration: stretchDur, ease: "power2.inOut",
      });
    } else {
      const sx = curX - (curX - x) * frac;
      const sw = (curX + curW) - sx;
      tl.to(pillRef.current, {
        x: sx, width: sw, height: stretchH, borderRadius: blobRadius(stretchH),
        duration: stretchDur, ease: "power2.inOut",
      });
    }

    tl.to(pillRef.current, {
      x, width: w, borderRadius: `${PILL_R}px`,
      duration: settleDur, ease: "back.out(1.6)",
    });

    tl.to(pillRef.current, {
      height: PILL_H,
      duration: settleDur, ease: "back.out(4)",
    }, "<");
  };

  const snapBackToActive = () => {
    if (!pillRef.current || !containerRef.current || !menuOpen.current) return;
    const activeBtn = Array.from(containerRef.current.querySelectorAll("button"))
      .find((b) => b.textContent === activeLabel.current);
    if (!activeBtn) return;

    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), activeBtn.getBoundingClientRect());
    const curX = gsap.getProperty(pillRef.current, "x") as number;
    const curW = gsap.getProperty(pillRef.current, "width") as number;
    const right = x > curX;
    const dist = Math.abs((x + w / 2) - (curX + curW / 2));

    gsap.killTweensOf(pillRef.current);

    if (dist < 5) {
      gsap.to(pillRef.current, { x, width: w, height: PILL_H, duration: 0.3, ease: "power2.out" });
      return;
    }

    const stretchDur = 0.22 + Math.min(dist / 2500, 0.08) + Math.random() * 0.03;
    const settleDur = 0.5 + Math.random() * 0.1;
    const frac = 0.25 + Math.random() * 0.1;
    const stretchH = 30 + Math.random() * 3;

    const tl = gsap.timeline();

    if (right) {
      const sw = curW + (x + w - curX - curW) * frac;
      tl.to(pillRef.current, { width: sw, height: stretchH, borderRadius: blobRadius(stretchH), duration: stretchDur, ease: "power2.inOut" });
    } else {
      const sx = curX - (curX - x) * frac;
      const sw = (curX + curW) - sx;
      tl.to(pillRef.current, { x: sx, width: sw, height: stretchH, borderRadius: blobRadius(stretchH), duration: stretchDur, ease: "power2.inOut" });
    }

    tl.to(pillRef.current, { x, width: w, borderRadius: `${PILL_R}px`, duration: settleDur, ease: "back.out(1.6)" });
    tl.to(pillRef.current, { height: PILL_H, duration: settleDur, ease: "back.out(4)" }, "<");
  };

  const handleButtonLeave = (e: React.MouseEvent) => {
    if (!menuOpen.current) return;
    // Check if we're moving to another button — if so, don't snap back
    const related = e.relatedTarget as HTMLElement | null;
    if (related?.closest("button") && containerRef.current?.contains(related)) return;
    snapBackToActive();
  };

  const hidePill = () => {
    if (!pillVisible.current) return;
    if (menuOpen.current) {
      snapBackToActive();
      return;
    }
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

  /* ── Click handler ────────────────────────────── */

  const handleClick = (label: string, btnEl: HTMLElement) => {
    if (!menuOpen.current) {
      // Open menu — kill any running waterdrop animation first
      menuOpen.current = true;
      gsap.killTweensOf(pillRef.current);
      setPillActive();
      // Settle to exact button position from wherever the pill currently is
      if (containerRef.current) {
        const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btnEl.getBoundingClientRect());
        gsap.to(pillRef.current, { x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`, duration: 0.35, ease: "power3.out" });
      }
      blurPageContent(true);
      showMega(label);
    } else if (activeLabel.current !== label) {
      // Different button while open
      gsap.killTweensOf(pillRef.current);
      if (containerRef.current) {
        const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btnEl.getBoundingClientRect());
        gsap.to(pillRef.current, { x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`, duration: 0.35, ease: "power3.out" });
      }
      showMega(label);
    }
    // Same button: do nothing
  };

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
          onMouseLeave={hidePill}
          style={{
            position: "relative", width: "100%", maxWidth: "960px",
            margin: "0 auto", padding: "0 clamp(20px, 4vw, 40px)", overflow: "visible", ...ITEMS_ROW,
          }}
        >
          {/* Pill */}
          <div
            ref={pillRef}
            style={{
              position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)",
              height: `${PILL_H}px`, width: "1px", opacity: 0, borderRadius: `${PILL_R}px`,
              pointerEvents: "none", zIndex: 2, overflow: "hidden",
              background: "#ffffff",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow:
                "0px 4px 4px rgba(0,0,0,0.1), " +
                "inset 0px 4px 4px rgba(0,0,0,0.08)",
            }}
          >
            <div
              ref={lensRef}
              style={{
                position: "absolute", top: "50%", left: 0,
                transform: "translateY(-50%) scale(1.07)",
                padding: "0 clamp(20px, 4vw, 40px)",
                ...ITEMS_ROW,
                pointerEvents: "none",
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
                onMouseEnter={(e) => movePillTo(e.currentTarget, item.label)}
                onMouseLeave={handleButtonLeave}
                onClick={(e) => handleClick(item.label, e.currentTarget)}
                style={{ ...TEXT_STYLE, position: "relative", zIndex: 1, padding: `12px ${PX}px`, margin: `0 -${PX}px` }}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      </nav>

      {megaShown && (
        <div
          ref={megaRef}
          style={{
            position: "fixed", top: "100px", left: "50%", transform: "translateX(-50%)",
            width: "min(90vw, 800px)", minHeight: "300px", background: "#ffffff",
            borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 70, padding: "40px", opacity: 0,
          }}
        >
          <button
            onClick={closeMenu}
            style={{
              position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px",
              borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.05)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", color: "#334a27", fontWeight: 700,
            }}
          >
            ✕
          </button>
          <h2
            ref={megaTitleRef}
            className={merriweather.variable}
            style={{ fontFamily: "var(--font-nav)", fontSize: "32px", fontWeight: 700, color: "#334a27", marginBottom: "24px" }}
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
