"use client";
import React, { useRef, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

/* ── Constants ──────────────────────────────────── */

const PILL_H = 40;
const PILL_R = 17;
const PX = 20;

const COLORS = {
  text: "#334a27",
  green: "#45A117",
  pink: "#D3005E",
  white: "#ffffff",
};

const isDark = () => document.documentElement.classList.contains("dark");

const PILL_BG_HOVER = "white";
const PILL_SHADOW_HOVER = "0 3px 23px rgba(0, 0, 0, 0.02)";

const pillPos = (container: DOMRect, btn: DOMRect) => ({
  x: btn.left - container.left,
  w: btn.width,
});

/* ── Types ──────────────────────────────────────── */

export type NavPillItem = {
  label: string;
  href: string;
};

export type NavPillOptions = {
  items: NavPillItem[];
  hasLens?: boolean;
  onActivate?: (label: string) => void;
  onDeactivate?: () => void;
};

/* ── Hook ───────────────────────────────────────── */

export function useNavPill({ items, hasLens = true, onActivate, onDeactivate }: NavPillOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const lastHoveredLabel = useRef("");

  const pillVisible = useRef(false);
  const menuOpen = useRef(false);
  const activeLabel = useRef("");

  /* ── Pill style transitions ── */

  const setPillHover = useCallback((instant = false) => {
    if (!pillRef.current) return;
    const d = instant ? 0 : 0.2;
    gsap.to(pillRef.current, {
      background: PILL_BG_HOVER, borderColor: "transparent", boxShadow: PILL_SHADOW_HOVER,
      duration: d, ease: "power2.out",
    });
    if (lensRef.current) {
      const lensColor = COLORS.green;
      lensRef.current.querySelectorAll("span").forEach((s) =>
        gsap.to(s, { color: lensColor, duration: d })
      );
      lensRef.current.querySelectorAll("img").forEach((img) =>
        gsap.to(img, { filter: isDark() ? "brightness(0.7)" : "none", duration: d })
      );
    }
  }, []);

  const setPillActive = useCallback((instant = false) => {
    if (!pillRef.current) return;
    const d = instant ? 0 : 0.2;
    gsap.to(pillRef.current, {
      background: COLORS.pink, borderColor: "transparent", boxShadow: "none",
      duration: d, ease: "power2.in",
    });
    if (lensRef.current) {
      lensRef.current.querySelectorAll("span").forEach((s) =>
        gsap.to(s, { color: COLORS.white, duration: d })
      );
      lensRef.current.querySelectorAll("img").forEach((img) =>
        gsap.to(img, { filter: "brightness(0) invert(1)", duration: d })
      );
    }
  }, []);

  /* ── Simple slide animation ── */

  const slideTo = useCallback((targetX: number, targetW: number) => {
    if (!pillRef.current) return;
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      x: targetX, width: targetW, height: PILL_H,
      duration: 0.4, ease: "back.out(1.4)",
    });
  }, []);

  /* ── Snap back to active ── */

  const snapBackToActive = useCallback(() => {
    if (!pillRef.current || !containerRef.current || !menuOpen.current) return;
    const activeBtn = btnRefs.current.find(
      (b) => b?.textContent === activeLabel.current
    );
    if (!activeBtn) return;

    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), activeBtn.getBoundingClientRect());
    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      x, width: w, height: PILL_H,
      duration: 0.3, ease: "back.out(1.4)",
    });
    setPillActive();
  }, [slideTo, setPillActive]);

  /* ── Pill hover movement ── */

  const movePillTo = useCallback((el: HTMLElement, label: string) => {
    if (!pillRef.current || !containerRef.current) return;
    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), el.getBoundingClientRect());

    // First appearance: bloom from center
    if (!pillVisible.current) {
      pillVisible.current = true;
      gsap.killTweensOf(pillRef.current);
      const cx = x + w / 2;
      gsap.set(pillRef.current, {
        left: 0, x: cx - 5, width: 10, height: 10,
        scaleX: 1, scaleY: 1,
        borderRadius: `${PILL_R}px`, opacity: 1,
      });
      setPillHover(true);
      gsap.to(pillRef.current, {
        x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
        duration: 0.25, ease: "back.out(1.4)",
      });
      return;
    }

    // Hover on active pill: shrink slightly
    if (menuOpen.current && activeLabel.current === label) {
      const shrink = 6;
      gsap.killTweensOf(pillRef.current);
      gsap.to(pillRef.current, {
        x: x + shrink / 2, width: w - shrink, height: PILL_H - 4,
        duration: 0.2, ease: "power2.out",
      });
      return;
    }

    slideTo(x, w);
  }, [setPillHover, slideTo]);

  /* ── Container mouse move (zone splitting) ── */

  const handleContainerMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !pillVisible.current) return;
    if ((e.target as HTMLElement).closest("button")) return;

    const mouseX = e.clientX;
    const btns = btnRefs.current.filter(Boolean);
    if (btns.length === 0) return;

    const firstRect = btns[0].getBoundingClientRect();
    const lastRect = btns[btns.length - 1].getBoundingClientRect();
    if (mouseX < firstRect.left || mouseX > lastRect.right) {
      if (menuOpen.current) {
        if (lastHoveredLabel.current !== activeLabel.current) {
          lastHoveredLabel.current = activeLabel.current;
          snapBackToActive();
        }
      } else {
        hidePill();
      }
      return;
    }

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
  }, [movePillTo, snapBackToActive]);

  /* ── Hide pill ── */

  const hidePill = useCallback(() => {
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
  }, [snapBackToActive]);

  /* ── Click handler ── */

  const handleClick = useCallback((label: string, btnEl: HTMLElement) => {
    if (!menuOpen.current) {
      menuOpen.current = true;
      activeLabel.current = label;
      gsap.killTweensOf(pillRef.current);
      setPillActive(true);
      if (containerRef.current) {
        const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btnEl.getBoundingClientRect());
        gsap.to(pillRef.current, {
          x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
          duration: 0.35, ease: "power3.out",
        });
      }
      onActivate?.(label);
    } else if (activeLabel.current !== label) {
      activeLabel.current = label;
      gsap.killTweensOf(pillRef.current);
      setPillActive(true);
      if (containerRef.current) {
        const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btnEl.getBoundingClientRect());
        gsap.to(pillRef.current, {
          x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
          duration: 0.35, ease: "power3.out",
        });
      }
      onActivate?.(label);
    }
  }, [setPillActive, onActivate]);

  /* ── Close menu ── */

  const closeMenu = useCallback(() => {
    if (!menuOpen.current) return;
    menuOpen.current = false;
    activeLabel.current = "";
    pillVisible.current = false;
    lastHoveredLabel.current = "";

    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      scaleX: 0, scaleY: 0, opacity: 0,
      duration: 0.25, ease: "power3.in",
      onComplete: () => {
        if (pillRef.current) gsap.set(pillRef.current, { scaleX: 1, scaleY: 1, width: 1 });
        setPillHover(true);
      },
    });

    onDeactivate?.();
  }, [setPillHover, onDeactivate]);

  /* ── Activate programmatically ── */

  const activateItem = useCallback((label: string) => {
    if (!containerRef.current || !pillRef.current) return;
    const btn = btnRefs.current.find((b) => b?.textContent === label);
    if (!btn) return;

    menuOpen.current = true;
    activeLabel.current = label;
    pillVisible.current = true;

    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), btn.getBoundingClientRect());
    gsap.set(pillRef.current, { x, width: w, opacity: 1, height: PILL_H, borderRadius: PILL_R });
    setPillActive(true);
    onActivate?.(label);
  }, [setPillActive, onActivate]);

  /* ── Button props factory ── */

  const getButtonProps = useCallback((index: number) => ({
    ref: (el: HTMLButtonElement | null) => { if (el) btnRefs.current[index] = el; },
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      lastHoveredLabel.current = items[index].label;
      movePillTo(e.currentTarget, items[index].label);
    },
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      handleClick(items[index].label, e.currentTarget);
    },
  }), [items, movePillTo, handleClick]);

  /* ── Pill JSX ── */

  const renderPill = useCallback(() => (
    <div
      ref={(el) => {
        (pillRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (el) gsap.set(el, { yPercent: -50 });
      }}
      style={{
        position: "absolute", top: "50%", left: 0,
        height: `${PILL_H}px`, width: "1px", opacity: 0, borderRadius: `${PILL_R}px`,
        pointerEvents: "none", zIndex: 4, overflow: "hidden",
        background: PILL_BG_HOVER,
        border: "none",
        boxShadow: PILL_SHADOW_HOVER,
      }}
    >
      {hasLens && (
        <div
          ref={(el) => {
            (lensRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (el) gsap.set(el, { y: "-50%", scale: 1.07 });
          }}
          style={{
            position: "absolute", top: "50%", left: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "650px",
            pointerEvents: "none",
          }}
        >
          {items.map((item) => (
            <React.Fragment key={item.href}>
              <Image src="/icons/nav-spark-green.svg" alt="" width={12} height={12} aria-hidden />
              <span style={{
                fontFamily: "var(--font-heading, 'Merriweather', serif)", fontSize: "16px", fontWeight: 600,
                color: COLORS.green, whiteSpace: "nowrap",
              }}>{item.label}</span>
            </React.Fragment>
          ))}
          <Image src="/icons/nav-spark-green.svg" alt="" width={12} height={12} aria-hidden />
        </div>
      )}
    </div>
  ), [items, hasLens]);

  return {
    containerRef,
    pillRef,
    lensRef,
    btnRefs,
    menuOpen,
    activeLabel,
    containerProps: {
      ref: containerRef,
      onMouseMove: handleContainerMove,
      onMouseLeave: hidePill,
    },
    getButtonProps,
    renderPill,
    activateItem,
    closeMenu,
    setPillHover,
    setPillActive,
    hidePill,
    COLORS,
    PILL_H,
    PILL_R,
    PX,
  };
}
