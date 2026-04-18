"use client";
import React, { useRef, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";

/* ── Constants ──────────────────────────────────── */

const PILL_H = 32;
const PILL_R = 0;
const PX = 20;

const COLORS = {
  text: "#334a27",
  green: "#45A117",
  pink: "#D3005E",
  white: "#ffffff",
};

const isDark = () => document.documentElement.classList.contains("dark");

const PILL_BG_HOVER = "var(--color-text-primary, #334a27)";
const PILL_SHADOW_HOVER = "none";

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
  const line1Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const pillBodyRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const lastHoveredLabel = useRef("");

  const pillVisible = useRef(false);
  const menuOpen = useRef(false);
  const activeLabel = useRef("");
  const lastPillX = useRef(0);


  /* ── Pill style transitions ── */

  const setPillHover = useCallback((instant = false) => {
    if (!pillRef.current) return;
    const d = instant ? 0 : 0.2;
    if (pillBodyRef.current) {
      gsap.to(pillBodyRef.current, { background: PILL_BG_HOVER, duration: d, ease: "power2.out" });
    }
    if (line1Ref.current) gsap.to(line1Ref.current, { background: PILL_BG_HOVER, duration: d });
    if (line3Ref.current) gsap.to(line3Ref.current, { background: PILL_BG_HOVER, duration: d });
    if (lensRef.current) {
      lensRef.current.querySelectorAll("span").forEach((s) =>
        gsap.to(s, { color: COLORS.white, duration: d })
      );
      lensRef.current.querySelectorAll("img").forEach((img) =>
        gsap.to(img, { filter: "brightness(0) invert(1)", duration: d })
      );
    }
  }, []);

  const setPillActive = useCallback((instant = false) => {
    if (!pillRef.current) return;
    const d = instant ? 0 : 0.2;
    if (pillBodyRef.current) {
      gsap.to(pillBodyRef.current, { background: PILL_BG_HOVER, duration: d, ease: "power2.in" });
    }
    if (line1Ref.current) gsap.to(line1Ref.current, { background: PILL_BG_HOVER, duration: d });
    if (line3Ref.current) gsap.to(line3Ref.current, { background: PILL_BG_HOVER, duration: d });
    if (lensRef.current) {
      lensRef.current.querySelectorAll("span").forEach((s) =>
        gsap.to(s, { color: COLORS.white, duration: d })
      );
      lensRef.current.querySelectorAll("img").forEach((img) =>
        gsap.to(img, { filter: "brightness(0) invert(1)", duration: d })
      );
    }
    // Aktiver Button-Text unter der Pill → brand secondary
    const activeBtn = btnRefs.current.find((b) => b?.textContent === activeLabel.current);
    if (activeBtn) gsap.to(activeBtn, { color: COLORS.pink, duration: d });
  }, []);

  /* ── Distance-based slide duration ── */

  const getDuration = useCallback((targetX: number, base: number) => {
    const dist = Math.abs(targetX - lastPillX.current);
    // 0px → base, 300px+ → base + 0.15s
    const extra = Math.min(dist / 300, 1) * 0.15;
    return base + extra;
  }, []);

  /* ── Simple slide animation ── */

  const slideTo = useCallback((targetX: number, targetW: number) => {
    if (!pillRef.current) return;
    const d = getDuration(targetX, 0.4);
    lastPillX.current = targetX;

    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      x: targetX, width: targetW, height: PILL_H,
      duration: d, ease: "back.out(1.5)",
    });

    // Linien folgen träger zum gleichen Ziel
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.set(line3Ref.current, { opacity: 1, y: 0 });
      gsap.to(line3Ref.current, {
        x: targetX, width: targetW,
        duration: d + 0.04, ease: "back.out(1.5)", overwrite: "auto",
      });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.set(line1Ref.current, { opacity: 1, y: 0 });
      gsap.to(line1Ref.current, {
        x: targetX, width: targetW,
        duration: d + 0.08, ease: "back.out(1.5)", overwrite: "auto",
      });
    }
  }, [getDuration]);

  /* ── Snap back to active ── */

  const snapBackToActive = useCallback(() => {
    if (!pillRef.current || !containerRef.current || !menuOpen.current) return;
    const activeBtn = btnRefs.current.find(
      (b) => b?.textContent === activeLabel.current
    );
    if (!activeBtn) return;

    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), activeBtn.getBoundingClientRect());
    const d = getDuration(x, 0.4) + 0.2; // snapback 0.2s langsamer
    lastPillX.current = x;

    gsap.killTweensOf(pillRef.current);
    gsap.to(pillRef.current, {
      x, width: w, height: PILL_H,
      duration: d, ease: "back.out(1.5)",
    });
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current, "x,width");
      gsap.to(line3Ref.current, { x, width: w, duration: d + 0.04, ease: "back.out(1.5)", overwrite: "auto" });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current, "x,width");
      gsap.to(line1Ref.current, { x, width: w, duration: d + 0.08, ease: "back.out(1.5)", overwrite: "auto" });
    }
    setPillActive();
  }, [getDuration, setPillActive]);

  /* ── Pill hover movement ── */

  const movePillTo = useCallback((el: HTMLElement, _label: string) => {
    if (!pillRef.current || !containerRef.current) return;
    const { x, w } = pillPos(containerRef.current.getBoundingClientRect(), el.getBoundingClientRect());

    // First appearance: bloom from center
    if (!pillVisible.current) {
      pillVisible.current = true;
      gsap.killTweensOf(pillRef.current);
      if (line3Ref.current) gsap.killTweensOf(line3Ref.current);
      if (line1Ref.current) gsap.killTweensOf(line1Ref.current);
      const cx = x + w / 2;
      gsap.set(pillRef.current, {
        left: 0, x: cx - 5, width: 10, height: 10,
        scaleX: 1, scaleY: 1,
        borderRadius: `${PILL_R}px`, opacity: 1,
      });
      // Linien: starten am Pill-Zentrum (y-versetzt) und sliden nach oben
      // line3 Zielposition: PILL_H/2 + 6 über Pill-Mitte → y-offset = +(PILL_H/2 + 6)
      // line1 Zielposition: PILL_H/2 + 10 über Pill-Mitte → y-offset = +(PILL_H/2 + 10)
      if (line3Ref.current) gsap.set(line3Ref.current, { x: cx - 5, width: 10, y: PILL_H / 2 + 6, opacity: 1 });
      if (line1Ref.current) gsap.set(line1Ref.current, { x: cx - 5, width: 10, y: PILL_H / 2 + 10, opacity: 1 });
      lastPillX.current = x;
      setPillHover(true);
      // Pill bloomen
      gsap.to(pillRef.current, {
        x, width: w, height: PILL_H, borderRadius: `${PILL_R}px`,
        duration: 0.15, ease: "power2.out",
      });
      // Linien: gleichzeitig auf Zielposition + Zielbreite + y zurück auf 0
      if (line3Ref.current) gsap.to(line3Ref.current, { x, width: w, y: 0, duration: 0.15, ease: "power2.out" });
      if (line1Ref.current) gsap.to(line1Ref.current, { x, width: w, y: 0, duration: 0.15, ease: "power2.out" });
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

    // Pill-Mittelpunkt für Linien-Ziel
    const pillX = gsap.getProperty(pillRef.current, "x") as number;
    const pillW = gsap.getProperty(pillRef.current, "width") as number;
    const cx = pillX + pillW / 2;

    // Linien schrumpfen zurück zur Pill-Mitte
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, { x: cx - 5, width: 10, y: PILL_H / 2 + 6, opacity: 0, duration: 0.15, ease: "power3.in" });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, { x: cx - 5, width: 10, y: PILL_H / 2 + 10, opacity: 0, duration: 0.15, ease: "power3.in" });
    }

    gsap.to(pillRef.current, {
      x: cx - 5, width: 10, height: 10, opacity: 0, borderRadius: `${PILL_R}px`,
      duration: 0.15, ease: "power3.in",
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
      // Reset previous active button text
      const prevBtn = btnRefs.current.find((b) => b?.textContent === activeLabel.current);
      if (prevBtn) gsap.to(prevBtn, { color: "var(--color-nav-text)", duration: 0.2 });
      activeLabel.current = label;
      // Einfach sliden, keine Bloom-Animation
      slideTo(btnEl.getBoundingClientRect().left - containerRef.current!.getBoundingClientRect().left, btnEl.getBoundingClientRect().width);
      setPillActive();
      onActivate?.(label);
    }
  }, [setPillActive, onActivate]);

  /* ── Close menu ── */

  const closeMenu = useCallback(() => {
    if (!menuOpen.current) return;
    // Reset active button text color
    const activeBtn = btnRefs.current.find((b) => b?.textContent === activeLabel.current);
    if (activeBtn) gsap.to(activeBtn, { color: "var(--color-nav-text)", duration: 0.15 });
    menuOpen.current = false;
    activeLabel.current = "";
    pillVisible.current = false;
    lastHoveredLabel.current = "";

    gsap.killTweensOf(pillRef.current);

    const pillX = gsap.getProperty(pillRef.current, "x") as number;
    const pillW = gsap.getProperty(pillRef.current, "width") as number;
    const cx = pillX + pillW / 2;

    // Linien schrumpfen zurück zur Pill-Mitte
    if (line3Ref.current) {
      gsap.killTweensOf(line3Ref.current);
      gsap.to(line3Ref.current, { x: cx - 5, width: 10, y: PILL_H / 2 + 6, opacity: 0, duration: 0.15, ease: "power3.in" });
    }
    if (line1Ref.current) {
      gsap.killTweensOf(line1Ref.current);
      gsap.to(line1Ref.current, { x: cx - 5, width: 10, y: PILL_H / 2 + 10, opacity: 0, duration: 0.15, ease: "power3.in" });
    }

    gsap.to(pillRef.current, {
      x: cx - 5, width: 10, height: 10, opacity: 0,
      duration: 0.15, ease: "power3.in",
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
    if (line3Ref.current) gsap.set(line3Ref.current, { x, width: w, opacity: 1, y: 0 });
    if (line1Ref.current) gsap.set(line1Ref.current, { x, width: w, opacity: 1, y: 0 });
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

  const renderPill = useCallback(() => {
    const line3Top = `calc(50% - ${PILL_H / 2 + 6}px)`;
    const line1Top = `calc(50% - ${PILL_H / 2 + 10}px)`;

    return (<>
      {/* ── 2px Linie (oben) – eigenständig, scale/opacity via ticker gespiegelt ── */}
      <div ref={(el) => { (line1Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }} style={{
        position: "absolute", top: line1Top, left: 0,
        height: "2px", width: "1px", opacity: 0,
        background: PILL_BG_HOVER, pointerEvents: "none", zIndex: 4,
      }} />
      {/* ── 4px Linie (mitte) – eigenständig, scale/opacity via ticker gespiegelt ── */}
      <div ref={(el) => { (line3Ref as React.MutableRefObject<HTMLDivElement | null>).current = el; }} style={{
        position: "absolute", top: line3Top, left: 0,
        height: "4px", width: "1px", opacity: 0,
        background: PILL_BG_HOVER, pointerEvents: "none", zIndex: 4,
      }} />
      {/* ── Pill ── */}
      <div
        ref={(el) => {
          (pillRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          if (el) gsap.set(el, { yPercent: -50 });
        }}
        style={{
          position: "absolute", top: "50%", left: 0,
          height: `${PILL_H}px`, width: "1px", opacity: 0, borderRadius: `${PILL_R}px`,
          pointerEvents: "none", zIndex: 4,
        }}
      >
        <div ref={(el) => { (pillBodyRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }} style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: `${PILL_R}px`, overflow: "hidden",
          background: PILL_BG_HOVER,
        }}>
          {hasLens && (
            <div
              ref={(el) => {
                (lensRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                if (el) gsap.set(el, { y: "-50%", scale: 1.1 });
              }}
              style={{
                position: "absolute", top: "50%", left: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "650px",
                pointerEvents: "none",
              }}
            >
              {items.map((item) => (
                <React.Fragment key={item.href}>
                  <Image src="/icons/nav-spark-green.svg" alt="" width={12} height={12} aria-hidden style={{ filter: "brightness(0) invert(1)" }} />
                  <span style={{
                    fontFamily: "var(--font-heading, 'Merriweather', serif)", fontSize: "16px", fontWeight: 600,
                    color: COLORS.white, whiteSpace: "nowrap",
                  }}>{item.label}</span>
                </React.Fragment>
              ))}
              <Image src="/icons/nav-spark-green.svg" alt="" width={12} height={12} aria-hidden style={{ filter: "brightness(0) invert(1)" }} />
            </div>
          )}
        </div>
      </div>
    </>);
  }, [items, hasLens]);

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
