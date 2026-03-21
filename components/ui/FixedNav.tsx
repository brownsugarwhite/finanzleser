"use client";
import { Merriweather } from "next/font/google";
import Image from "next/image";
import { Fragment, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { useNavPill } from "@/hooks/useNavPill";
import { NAV_ITEMS } from "@/lib/navItems";

const merriweather = Merriweather({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-nav",
});

const Spark = () => (
  <Image src="/icons/nav-spark.svg" alt="" width={12} height={12} aria-hidden style={{ pointerEvents: "none" }} />
);

export default function FixedNav() {
  const pill = useNavPill({
    items: NAV_ITEMS,
    hasLens: true,
    onActivate: (label) => {
      window.dispatchEvent(new CustomEvent("mega-show", { detail: { label } }));
    },
  });

  const closeTimer = useRef<gsap.core.Tween | null>(null);

  const resetFixedNav = () => {
    if (!pill.containerRef.current) return;
    const wrapper = pill.containerRef.current.closest(".fixed-nav-wrapper") as HTMLElement;
    if (wrapper) wrapper.style.display = "none";
    const items = pill.containerRef.current.querySelectorAll("button, img[aria-hidden]");
    // Kill all tweens and reset
    items.forEach((el) => gsap.killTweensOf(el));
    gsap.set(items, { clearProps: "y,opacity" });
    if (pill.pillRef.current) {
      gsap.killTweensOf(pill.pillRef.current);
      gsap.set(pill.pillRef.current, { clearProps: "y,opacity,x,width,height,scaleX,scaleY,background,borderColor,boxShadow,borderRadius" });
      gsap.set(pill.pillRef.current, { yPercent: -50, opacity: 0, width: 1 });
    }
    if (pill.lensRef.current) {
      gsap.killTweensOf(pill.lensRef.current);
      gsap.set(pill.lensRef.current, { y: "-50%", scale: 1.07 });
    }
    // Reset pill internal state
    pill.menuOpen.current = false;
    pill.activeLabel.current = "";
  };

  const open = useCallback(() => {
    if (!pill.containerRef.current) return;

    // Kill pending close
    if (closeTimer.current) { closeTimer.current.kill(); closeTimer.current = null; }

    // Kill all ongoing animations and reset
    resetFixedNav();
    const wrapper = pill.containerRef.current.closest(".fixed-nav-wrapper") as HTMLElement;
    if (wrapper) wrapper.style.display = "flex";

    // Pre-select Finanztools first (sets pill position + pink style)
    pill.activateItem("Finanztools");

    // Hide above viewport, then slide in (no opacity change)
    const items = pill.containerRef.current.querySelectorAll("button, img[aria-hidden]");
    gsap.set(items, { y: -30 });
    if (pill.pillRef.current) gsap.set(pill.pillRef.current, { y: -30 });

    gsap.to([...Array.from(items), pill.pillRef.current].filter(Boolean), {
      y: 0,
      duration: 0.7,
      ease: "power3.out",
    });
  }, [pill]);

  const close = useCallback(() => {
    if (!pill.containerRef.current) return;

    // Kill pending close
    if (closeTimer.current) { closeTimer.current.kill(); closeTimer.current = null; }

    const items = pill.containerRef.current.querySelectorAll("button, img[aria-hidden]");
    gsap.to([...Array.from(items), pill.pillRef.current].filter(Boolean), {
      y: -100, opacity: 1,
      duration: 0.5,
      ease: "power2.out",
    });

    closeTimer.current = gsap.delayedCall(0.7, () => {
      pill.closeMenu();
      resetFixedNav();
      closeTimer.current = null;
    });
  }, [pill]);

  useEffect(() => {
    const onBurgerOpen = () => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      open();
    };
    const onBurgerClose = () => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      close();
    };

    const onMegaClosed = () => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      close();
    };

    window.addEventListener("burger-opened", onBurgerOpen);
    window.addEventListener("burger-closed", onBurgerClose);
    window.addEventListener("mega-closed", onMegaClosed);
    return () => {
      window.removeEventListener("burger-opened", onBurgerOpen);
      window.removeEventListener("burger-closed", onBurgerClose);
      window.removeEventListener("mega-closed", onMegaClosed);
    };
  }, [open, close]);

  // Lens sync
  useEffect(() => {
    const sync = () => {
      if (!pill.pillRef.current || !pill.lensRef.current) return;
      const px = gsap.getProperty(pill.pillRef.current, "x") as number;
      const pw = gsap.getProperty(pill.pillRef.current, "width") as number;
      gsap.set(pill.lensRef.current, { x: -px });
      pill.lensRef.current.style.transformOrigin = `${px + pw / 2}px center`;
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, [pill.pillRef, pill.lensRef]);

  return (
    <div
      className={`${merriweather.variable} fixed-nav-wrapper`}
      style={{
        display: "none",
        position: "fixed",
        top: 23,
        left: 0,
        right: 0,
        zIndex: 60,
        height: 50,
      }}
    >
      <div
        {...pill.containerProps}
        style={{
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          maxWidth: 840, width: "100%", margin: "0 auto",
          height: 50,
        }}
      >
          {pill.renderPill()}

          {NAV_ITEMS.map((item, i) => (
            <Fragment key={item.href}>
              <Spark />
              <button
                {...pill.getButtonProps(i)}
                style={{
                  fontFamily: "var(--font-nav)", fontSize: "18px", fontWeight: 700,
                  color: "#334a27", textDecoration: "none", whiteSpace: "nowrap",
                  cursor: "pointer", background: "none", border: "none",
                  padding: "12px 20px", margin: "0 -20px",
                  position: "relative", zIndex: 3,
                }}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
          <Spark />
      </div>
    </div>
  );
}
