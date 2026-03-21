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

const BTN_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-nav)", fontSize: "18px", fontWeight: 700,
  color: "#334a27", textDecoration: "none", whiteSpace: "nowrap",
  cursor: "pointer", background: "none", border: "none",
  padding: "12px 20px", margin: "0 -20px",
  position: "relative", zIndex: 1,
};

export default function TopNavigation() {
  // ── Page content blur ──

  const isBlurred = useRef(false);

  const blurPageContent = useCallback((blur: boolean) => {
    if (blur && isBlurred.current) return;
    if (!blur && !isBlurred.current) return;
    isBlurred.current = blur;
    const nav = pill.containerRef.current?.closest("nav");
    let pageWrapper = nav?.parentElement;
    while (pageWrapper?.parentElement && pageWrapper.parentElement.tagName !== "BODY") {
      pageWrapper = pageWrapper.parentElement;
    }
    if (!pageWrapper) return;

    Array.from(pageWrapper.children).forEach((child) => {
      if (child instanceof HTMLElement && !child.contains(pill.containerRef.current!) && getComputedStyle(child).position !== "fixed") {
        if (blur) {
          const rect = child.getBoundingClientRect();
          child.style.transformOrigin =
            `${window.innerWidth / 2 - rect.left}px ${window.innerHeight / 2 - rect.top}px`;
        }
        gsap.to(child, {
          scale: blur ? 0.9 : 1,
          filter: blur ? "blur(13px)" : "blur(0px)",
          duration: blur ? 0.5 : 0.4,
          ease: "power3.out",
        });
      }
    });
  }, []);

  // ── Nav pill hook ──

  const pill = useNavPill({
    items: NAV_ITEMS,
    hasLens: true,
    onActivate: (label) => {
      blurPageContent(true);
      window.dispatchEvent(new CustomEvent("mega-show", { detail: { label } }));
    },
    onDeactivate: () => {
      blurPageContent(false);
      window.dispatchEvent(new CustomEvent("mega-hide"));
    },
  });

  // ── Lens sync ──

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
  }, []);

  // ── Close on mega-closed event ──

  useEffect(() => {
    const onMegaClosed = () => {
      pill.closeMenu();
      blurPageContent(false);
    };
    window.addEventListener("mega-closed", onMegaClosed);
    return () => window.removeEventListener("mega-closed", onMegaClosed);
  }, [pill, blurPageContent]);

  // ── Burger events ──

  useEffect(() => {
    const onBurgerOpen = (e: Event) => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      const label = (e as CustomEvent).detail?.label || "Newsletter";
      window.dispatchEvent(new CustomEvent("mega-show", { detail: { label } }));
      blurPageContent(true);
    };
    const onBurgerClose = () => {
      if (window.matchMedia("(max-width: 1024px)").matches) return;
      blurPageContent(false);
      window.dispatchEvent(new CustomEvent("mega-hide"));
    };

    window.addEventListener("burger-opened", onBurgerOpen);
    window.addEventListener("burger-closed", onBurgerClose);
    return () => {
      window.removeEventListener("burger-opened", onBurgerOpen);
      window.removeEventListener("burger-closed", onBurgerClose);
    };
  }, [blurPageContent]);

  // ── Render ──

  return (
    <nav
      className={merriweather.variable}
      style={{
        position: "relative", zIndex: 60, width: "100%", height: "50px",
        display: "flex", alignItems: "center", marginTop: "23px", overflow: "visible",
      }}
    >
      <div
        {...pill.containerProps}
        style={{
          position: "relative", width: "100%", maxWidth: "840px", margin: "0 auto",
          overflow: "visible", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {pill.renderPill()}

        {NAV_ITEMS.map((item, i) => (
          <Fragment key={item.href}>
            <Spark />
            <button {...pill.getButtonProps(i)} style={BTN_STYLE}>
              {item.label}
            </button>
          </Fragment>
        ))}
        <Spark />
      </div>
    </nav>
  );
}
