"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { Fragment, useRef, useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "@/lib/gsapConfig";
import { useNavItems } from "@/lib/NavContext";
import { useNavPill } from "@/lib/hooks/useNavPill";
import Spark from "@/components/ui/Spark";

export default function TopNav({ className = "sticky-nav", style, defaultActive }: { className?: string; style?: React.CSSProperties; defaultActive?: string }) {
  const navItems = useNavItems();
  const navRef = useRef<HTMLDivElement>(null);
  const didActivate = useRef(false);
  // Landing-Nav: bei offenem Menü auf die Top-Stauchung schrumpfen (siehe CSS
  // .landing-nav.nav-compressed). Für sticky/burger-Nav ohne Effekt (immer gestaucht).
  const [compressed, setCompressed] = useState(false);

  const isInitialActivation = useRef(false);

  const pill = useNavPill({
    items: navItems,
    hasLens: true,
    onActivate: (label) => {
      // Skip event dispatch on initial programmatic activation
      if (isInitialActivation.current) {
        isInitialActivation.current = false;
        return;
      }
      if (!defaultActive) {
        scrollToNav();
        openedViaPill.current = true;
        setCompressed(true);
      }
      window.dispatchEvent(new CustomEvent("menu-opened", { detail: { label, fromBurgerNav: !!defaultActive } }));
    },
  });

  // Activate pill programmatically on mount when defaultActive is set
  useEffect(() => {
    if (defaultActive && !didActivate.current) {
      didActivate.current = true;
      requestAnimationFrame(() => {
        isInitialActivation.current = true;
        pill.activateItem(defaultActive);
      });
    }
  }, [defaultActive, pill]);

  // Track if menu was opened via this TopNav's pill (not burger)
  const openedViaPill = useRef(false);

  const scrollBackFromNav = useCallback(() => {
    if (!navRef.current || defaultActive || !openedViaPill.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - 33;
    gsap.to(window, { scrollTo: { y: targetY }, duration: 0.5, ease: "power2.inOut" });
  }, [defaultActive]);

  // Listen for menu-closed to reset pill and scroll back
  useEffect(() => {
    const onClose = () => {
      pill.closeMenu();
      scrollBackFromNav();
      openedViaPill.current = false;
      setCompressed(false);
    };
    window.addEventListener("menu-closed", onClose);
    return () => window.removeEventListener("menu-closed", onClose);
  }, [pill, scrollBackFromNav]);

  // Route-Wechsel-Reset: Navigation auf einen Megamenü-Link schließt das Menü über
  // consumeActiveOverlayForTransition() → KEIN „menu-closed", der aktive Pill blieb
  // sonst markiert. Bei jedem pathname-Wechsel den Pill zurücksetzen. Die Burger-
  // Variante (defaultActive) verwaltet ihren aktiven Pill selbst und unmountet eh.
  const closeMenuRef = useRef(pill.closeMenu);
  closeMenuRef.current = pill.closeMenu;
  const pathname = usePathname();
  const firstPathRef = useRef(true);
  useEffect(() => {
    if (firstPathRef.current) { firstPathRef.current = false; return; }
    if (defaultActive) return;
    closeMenuRef.current();
    openedViaPill.current = false;
    setCompressed(false);
  }, [pathname, defaultActive]);

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
    const targetY = window.scrollY + rect.top - 23;
    gsap.to(window, { scrollTo: { y: targetY }, duration: 0.5, ease: "power2.inOut" });
  }, []);

  return (
    <>
      <div
        ref={navRef}
        data-topnav
        className={`${className}${compressed ? " nav-compressed" : ""}`}
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
