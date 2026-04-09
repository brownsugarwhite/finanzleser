"use client";

import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import TopNav from "@/components/layout/TopNav";
import PoweredByLine from "@/components/ui/PoweredByLine";

function SearchIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 21 22" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12.04 16.7812C16.4362 16.7812 20 13.2484 20 8.89059C20 4.53274 16.4362 1 12.04 1C7.64375 1 4.07991 4.53274 4.07991 8.89059C4.07991 13.2484 7.64375 16.7812 12.04 16.7812Z" stroke="var(--color-text-medium)" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M0.591998 17.6095C-0.192466 18.3872 -0.198015 19.6535 0.579603 20.4379C1.35722 21.2224 2.62354 21.228 3.408 20.4503L2 19.0299L0.591998 17.6095ZM6.27569 14.7916L4.86769 13.3712L0.591998 17.6095L2 19.0299L3.408 20.4503L7.68369 16.212L6.27569 14.7916Z" fill="var(--color-text-medium)"/>
    </svg>
  );
}

const PILL_BG = "var(--color-pill-bg)";
const CONTENT_GAP = 20;

export default function LandingIntro() {
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

  const heroRef = useRef<HTMLElement>(null);
  const searchPillRef = useRef<HTMLFormElement>(null);
  const searchContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const [searchBtnWidth, setSearchBtnWidth] = useState(0);
  const [searchContentWidth, setSearchContentWidth] = useState(0);

  useLayoutEffect(() => {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;

    // Pull hero to viewport top
    if (heroRef.current) {
      const offset = heroRef.current.offsetTop;
      heroRef.current.style.marginTop = -offset + "px";
      heroRef.current.style.paddingTop = offset + "px";
    }

    const searchPill = searchPillRef.current!;
    const containerW = containerRef.current!.offsetWidth;
    const searchBtnW = searchBtnRef.current!.offsetWidth;
    const searchContentW = containerW - 20 - 6 - searchBtnW - CONTENT_GAP;

    searchPill.style.width = "100%";
    gsap.set(searchContentRef.current!, { opacity: 1 });

    setSearchBtnWidth(searchBtnW);
    setSearchContentWidth(searchContentW);
  }, []);

  // Expand search pill when Maya undocks
  useEffect(() => {
    const collapseSlot = (animate: boolean) => {
      const outer = outerRef.current;
      const slot = document.getElementById("maya-dock-slot");
      if (!outer || !slot) return;

      if (animate) {
        gsap.to(slot, { width: 0, duration: 0.5, ease: "power2.inOut" });
        gsap.to(outer, { gap: 0, duration: 0.5, ease: "power2.inOut" });
      } else {
        gsap.set(slot, { width: 0 });
        gsap.set(outer, { gap: 0 });
      }
    };

    // Already scrolled on mount → collapse immediately
    if (window.scrollY > 5) {
      collapseSlot(false);
    }

    const handleUndock = () => collapseSlot(true);
    window.addEventListener("maya-undocked", handleUndock);
    return () => window.removeEventListener("maya-undocked", handleUndock);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchInput)}`);
      setSearchInput("");
    }
  };

  const pillBase: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: PILL_BG,
    backdropFilter: "brightness(1.15)",
    WebkitBackdropFilter: "brightness(1.15)",
    borderRadius: "19px",
    padding: "6px 6px 6px 20px",
    boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
    overflow: "hidden",
    minWidth: 0,
    boxSizing: "border-box",
  };

  const contentBase: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    gap: "15px",
    whiteSpace: "nowrap",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: "none",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: "17px",
    color: "var(--color-text-primary)",
    outline: "none",
    lineHeight: "40px",
    padding: 0,
    minWidth: 0,
  };

  const btnStyle: React.CSSProperties = {
    borderRadius: "15px",
    padding: "0 20px",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: "16px",
    color: "#ffffff",
    lineHeight: "40px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    position: "relative",
    zIndex: 2,
  };

  return (
    <section
      ref={heroRef}
      className="landing-hero"
      style={{
        backgroundColor: "var(--color-bg-page)",
        minHeight: "auto",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "-16px auto 0px auto", padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "11px" }}>
          <img
            src="/icons/fl_logo.svg"
            alt="finanzleser"
            style={{ width: "100%", maxWidth: "460px", height: "auto" }}
          />
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Merriweather', serif",
            fontSize: "18px",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--color-text-medium)",
            textAlign: "center",
            margin: "0 0 23px 0",
          }}
        >
          Das digitale Finanzmagazin
        </p>

        {/* Pill Bar + Maya */}
        <div
          ref={outerRef}
          style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}
        >
          <div
            ref={containerRef}
            style={{
              display: "flex",
              flex: 1,
              minWidth: 0,
              position: "relative",
            }}
          >
            <form
              ref={searchPillRef}
              onSubmit={handleSearch}
              style={{
                ...pillBase,
                cursor: "text",
                width: "100%",
              }}
            >
              <div
                ref={searchContentRef}
                style={{
                  ...contentBase,
                  left: "20px",
                  right: searchBtnWidth + 6 + CONTENT_GAP + "px",
                  width: searchContentWidth + "px",
                }}
              >
                <SearchIcon />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Suchbegiff eingeben"
                  tabIndex={0}
                  className="search-input"
                  style={inputStyle}
                />
              </div>
              <button
                ref={searchBtnRef}
                type="submit"
                style={{ ...btnStyle, backgroundColor: "var(--color-brand)" }}
              >
                Suchen
              </button>
            </form>
          </div>

          {/* Maya Dock Slot */}
          <div
            id="maya-dock-slot"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 70,
              height: 70,
              flexShrink: 0,
            }}
          />
        </div>

      </div>

      {/* Nav Links */}
      <TopNav className="landing-nav" style={{ marginTop: "23px", alignItems: "center", paddingLeft: "0" }} />

      {/* DotLine + Powered by */}
      <div className="landing-dotline" style={{ position: "relative", zIndex: 51, width: "100%", display: "flex", justifyContent: "center", marginTop: "3px" }}>
        <PoweredByLine style={{ maxWidth: "1060px", width: "100%", paddingLeft: 70 }} />
      </div>
    </section>
  );
}
