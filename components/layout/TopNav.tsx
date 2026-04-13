"use client";

import { Fragment, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);
import { useNavItems } from "@/lib/NavContext";
import { useNavPill } from "@/hooks/useNavPill";
import Spark from "@/components/ui/Spark";

export default function TopNav({ className = "sticky-nav", style }: { className?: string; style?: React.CSSProperties }) {
  const navItems = useNavItems();
  const navRef = useRef<HTMLDivElement>(null);

  const pill = useNavPill({
    items: navItems,
    hasLens: true,
    onActivate: (label) => {
      scrollToNav();
      window.dispatchEvent(new CustomEvent("menu-opened", { detail: { label } }));
    },
  });

  // Listen for menu-closed to reset pill
  useEffect(() => {
    const onClose = () => {
      pill.closeMenu();
    };
    window.addEventListener("menu-closed", onClose);
    return () => window.removeEventListener("menu-closed", onClose);
  }, [pill]);

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

  const scrollToNav = useCallback(() => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - 33;
    gsap.to(window, { scrollTo: { y: targetY }, duration: 0.5, ease: "power2.inOut" });
  }, []);

  return (
    <>
      <div
        ref={navRef}
        data-topnav
        className={className}
        style={{
          width: "100%",
          position: "relative",
          zIndex: 55,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "-40px",
          paddingLeft: "0px",
          pointerEvents: "none",
          ...style,
        }}
      >
        {/* Nav-Wrapper */}
        <div
          {...pill.containerProps}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "650px",
            width: "100%",
            height: "50px",
            pointerEvents: "auto",
          }}
        >
          {pill.renderPill()}

          <Spark />
          {navItems.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 && <Spark />}
              <button
                {...pill.getButtonProps(i)}
                style={{
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-nav-text)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: "12px 20px",
                  margin: "0 -20px",
                  position: "relative",
                  zIndex: 3,
                }}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
          <Spark />
        </div>
      </div>
    </>
  );
}
