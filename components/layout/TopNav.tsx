"use client";

import { Fragment, useRef, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);
import { useNavItems } from "@/lib/NavContext";
import Spark from "@/components/ui/Spark";

export default function TopNav({ className = "sticky-nav", style }: { className?: string; style?: React.CSSProperties }) {
  const navItems = useNavItems();
  const navRef = useRef<HTMLDivElement>(null);

  const scrollToNav = useCallback(() => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - 33;
    const distance = Math.abs(targetY - window.scrollY);
    const duration = 0.5;
    gsap.to(window, { scrollTo: { y: targetY }, duration, ease: "power2.inOut" });
  }, []);

  return (
    <>
      <div
        ref={navRef}
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "730px",
            width: "100%",
            height: "50px",
            pointerEvents: "auto",
          }}
        >
          <Spark />
          {navItems.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 && <Spark />}
              <Link
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToNav();
                  window.dispatchEvent(new CustomEvent("menu-opened", { detail: { label: item.label } }));
                }}
                style={{
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-nav-text)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  padding: "12px 20px",
                }}
              >
                {item.label}
              </Link>
            </Fragment>
          ))}
          <Spark />
        </div>
      </div>

    </>
  );
}
