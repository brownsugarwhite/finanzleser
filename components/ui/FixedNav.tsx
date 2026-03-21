"use client";
import { Merriweather } from "next/font/google";
import Image from "next/image";
import { Fragment, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useNavPill } from "@/hooks/useNavPill";

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
  { label: "Finanztools", href: "/finanztools" },
];

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

  const open = useCallback(() => {
    if (!pill.containerRef.current) return;
    const wrapper = pill.containerRef.current.closest(".fixed-nav-wrapper") as HTMLElement;
    if (wrapper) wrapper.style.display = "flex";

    // Set items invisible, then stagger in
    const items = pill.containerRef.current.querySelectorAll("button, img[aria-hidden]");
    gsap.set(items, { y: -30, opacity: 0 });

    gsap.to(items, {
      y: 0, opacity: 1,
      duration: 0.4,
      stagger: 0.04,
      ease: "power3.out",
    });

    // Activate "Finanzen" after items are positioned
    requestAnimationFrame(() => {
      pill.activateItem("Finanzen");
    });
  }, [pill]);

  const close = useCallback(() => {
    if (!pill.containerRef.current) return;

    const items = pill.containerRef.current.querySelectorAll("button, img[aria-hidden]");
    gsap.to(items, {
      y: -30, opacity: 0,
      duration: 0.3,
      stagger: 0.03,
      ease: "power2.in",
    });

    pill.closeMenu();

    const wrapper = pill.containerRef.current.closest(".fixed-nav-wrapper") as HTMLElement;
    gsap.delayedCall(0.5, () => {
      if (wrapper) wrapper.style.display = "none";
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
