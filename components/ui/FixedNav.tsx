"use client";
import { Merriweather } from "next/font/google";
import Image from "next/image";
import { Fragment, useEffect, useRef, useCallback } from "react";
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

const PILL_H = 44;
const PILL_R = 17;
const PX = 20;

const COLORS = {
  text: "#334a27",
  pink: "#D3005E",
  white: "#ffffff",
};

const BTN_STYLE: React.CSSProperties = {
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
  zIndex: 3,
};

export default function FixedNav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const isOpen = useRef(false);
  const activeLabel = useRef("");

  const blobRadius = (h: number) => `${Math.max(PILL_R, h / 2)}px`;

  const updateTextColors = (newLabel: string) => {
    btnRefs.current.forEach((btn, i) => {
      if (!btn) return;
      gsap.to(btn, {
        color: NAV_ITEMS[i].label === newLabel ? COLORS.white : COLORS.text,
        duration: 0.15,
      });
    });
  };

  const waterdropTo = (targetX: number, targetW: number) => {
    if (!pillRef.current) return;

    gsap.killTweensOf(pillRef.current);

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

    tl.to(pillRef.current, {
      x: targetX, width: targetW, borderRadius: `${PILL_R}px`,
      duration: settleDur, ease: "back.out(1.6)",
    });

    tl.to(pillRef.current, {
      height: PILL_H,
      duration: settleDur, ease: "back.out(4)",
    }, "<");
  };

  const handleClick = (label: string, btn: HTMLButtonElement) => {
    if (activeLabel.current === label) return;
    activeLabel.current = label;

    const containerRect = containerRef.current!.getBoundingClientRect();
    const itemRect = btn.getBoundingClientRect();
    const x = itemRect.left - containerRect.left - PX;
    const w = itemRect.width + PX * 2;

    waterdropTo(x, w);
    updateTextColors(label);
    window.dispatchEvent(new CustomEvent("fixed-nav-click", { detail: { label } }));
  };

  const open = useCallback(() => {
    if (isOpen.current || !wrapperRef.current || !containerRef.current) return;
    isOpen.current = true;

    const wrapper = wrapperRef.current;
    wrapper.style.display = "flex";

    // Set "Finanzen" as active
    activeLabel.current = "Finanzen";
    const firstBtn = btnRefs.current[0];
    if (firstBtn && pillRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = firstBtn.getBoundingClientRect();
      const x = itemRect.left - containerRect.left - PX;
      const w = itemRect.width + PX * 2;
      gsap.set(pillRef.current, { x, width: w, opacity: 1 });
    }

    // Slide buttons + sparks in from top with stagger
    const items = containerRef.current.querySelectorAll("button, img[aria-hidden]");
    gsap.fromTo(items, { y: -30, opacity: 0 }, {
      y: 0, opacity: 1,
      duration: 0.4,
      stagger: 0.04,
      ease: "power3.out",
    });

    // Pill fades in
    gsap.fromTo(pillRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.1 });

    // Set first button text white
    updateTextColors("Finanzen");
  }, []);

  const close = useCallback(() => {
    if (!isOpen.current || !containerRef.current || !wrapperRef.current) return;
    isOpen.current = false;
    activeLabel.current = "";

    const items = containerRef.current.querySelectorAll("button, img[aria-hidden]");
    gsap.to(items, {
      y: -30, opacity: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: "power2.in",
    });
    gsap.to(pillRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" });

    const wrapper = wrapperRef.current;
    gsap.delayedCall(0.5, () => {
      wrapper.style.display = "none";
    });
  }, []);

  useEffect(() => {
    const onBurgerOpen = () => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      open();
    };
    const onBurgerClose = () => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      close();
    };

    window.addEventListener("burger-opened", onBurgerOpen);
    window.addEventListener("burger-closed", onBurgerClose);
    return () => {
      window.removeEventListener("burger-opened", onBurgerOpen);
      window.removeEventListener("burger-closed", onBurgerClose);
    };
  }, [open, close]);

  return (
    <div
      ref={wrapperRef}
      className={merriweather.variable}
      style={{
        display: "none",
        position: "fixed",
        top: 23,
        left: 0,
        right: 0,
        zIndex: 60,
        alignItems: "center",
        justifyContent: "space-between",
        height: 50,
        pointerEvents: "none",
      }}
    >
      {/* Left spacer — matches logo column */}
      <div className="logo-column" style={{ flex: 1, minWidth: 214, paddingLeft: 24, transform: "translateX(13px)" }} />

      {/* 960px nav column */}
      <div style={{ width: 960, flexShrink: 0, padding: "0 clamp(20px, 4vw, 40px)" }}>
        <div
          ref={containerRef}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 25,
            height: 50,
            pointerEvents: "auto",
          }}
        >
          {/* Pink pill */}
          <div
            ref={pillRef}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
              height: PILL_H,
              width: 1,
              opacity: 0,
              borderRadius: PILL_R,
              pointerEvents: "none",
              zIndex: 2,
              background: COLORS.pink,
            }}
          />

          {/* Buttons */}
          {NAV_ITEMS.map((item, i) => (
            <Fragment key={item.href}>
              <Image src="/icons/nav-spark.svg" alt="" width={12} height={12} aria-hidden />
              <button
                ref={(el) => { if (el) btnRefs.current[i] = el; }}
                onClick={(e) => handleClick(item.label, e.currentTarget)}
                style={BTN_STYLE}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Right spacer */}
      <div style={{ flex: 1, minWidth: 1 }} />
    </div>
  );
}
