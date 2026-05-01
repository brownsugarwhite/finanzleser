"use client";

import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "@/lib/gsapConfig";
import TopNav from "@/components/layout/TopNav";
import PoweredByLine from "@/components/ui/PoweredByLine";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size + 2} viewBox="0 0 21 22" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12.04 16.7812C16.4362 16.7812 20 13.2484 20 8.89059C20 4.53274 16.4362 1 12.04 1C7.64375 1 4.07991 4.53274 4.07991 8.89059C4.07991 13.2484 7.64375 16.7812 12.04 16.7812Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M0.591998 17.6095C-0.192466 18.3872 -0.198015 19.6535 0.579603 20.4379C1.35722 21.2224 2.62354 21.228 3.408 20.4503L2 19.0299L0.591998 17.6095ZM6.27569 14.7916L4.86769 13.3712L0.591998 17.6095L2 19.0299L3.408 20.4503L7.68369 16.212L6.27569 14.7916Z" fill="currentColor"/>
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

  const {
    matches,
    setIsOpen,
    highlight,
    setHighlight,
    showDropdown,
    listWrapRef,
  } = useSearchSuggestions(searchInput, containerRef);
  const isFirstRender = useRef(true);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const leoWrapRef = useRef<HTMLDivElement>(null);

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
      const wrap = leoWrapRef.current;
      const slot = document.getElementById("maya-dock-slot");
      if (!outer || !slot) return;

      if (animate) {
        gsap.to(slot, { width: 0, duration: 0.5, ease: "power2.inOut" });
        gsap.to(outer, { gap: 0, duration: 0.5, ease: "power2.inOut" });
        if (wrap) gsap.to(wrap, { width: 0, overflow: "hidden", duration: 0.5, ease: "power2.inOut" });
      } else {
        gsap.set(slot, { width: 0 });
        gsap.set(outer, { gap: 0 });
        if (wrap) gsap.set(wrap, { width: 0, overflow: "hidden" });
      }
    };

    // Already scrolled on mount → collapse immediately + hide bubble
    if (window.scrollY > 5) {
      collapseSlot(false);
      if (bubbleRef.current) gsap.set(bubbleRef.current, { opacity: 0 });
    }

    const handleUndock = () => {
      collapseSlot(true);
      if (bubbleRef.current) gsap.to(bubbleRef.current, { opacity: 0, y: -6, duration: 0.35, ease: "power2.in" });
    };
    window.addEventListener("maya-undocked", handleUndock);
    return () => window.removeEventListener("maya-undocked", handleUndock);
  }, []);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setIsOpen(false);
    router.push(`/suche?q=${encodeURIComponent(trimmed)}`);
    setSearchInput("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlight >= 0 && matches[highlight]) {
      submitSearch(matches[highlight].title);
      return;
    }
    submitSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const pillBase: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: PILL_BG,
    backdropFilter: "blur(16px) brightness(1.15)",
    WebkitBackdropFilter: "blur(16px) brightness(1.15)",
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
      <div data-scale-extended style={{ maxWidth: "1200px", margin: "-16px auto 0px auto", padding: "0 24px" }}>
        {/* Logo */}
        <div className="landing-logo" style={{ display: "flex", justifyContent: "center", marginBottom: "11px" }}>
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
          className="landing-pillbar"
          style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 60 }}
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
                borderRadius: showDropdown ? "19px 19px 0 0" : "19px",
                transition: "border-radius 0.18s ease",
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
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Suchbegiff eingeben"
                  tabIndex={0}
                  className="search-input"
                  autoComplete="off"
                  spellCheck={false}
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

            {/* Suggestions dropdown — sits flush against the pill bottom */}
            <div
              ref={listWrapRef}
              aria-hidden={!showDropdown}
              className={`landing-suggest ${showDropdown ? "is-open" : ""}`}
            >
              <ul className="landing-suggest__list" role="listbox">
                {matches.map((s, i) => {
                  const [head, tail] = s.parts;
                  return (
                    <li
                      key={`${s.url}-${i}`}
                      role="option"
                      aria-selected={highlight === i}
                      className={`landing-suggest__option ${highlight === i ? "is-active" : ""}`}
                      onMouseEnter={() => setHighlight(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        submitSearch(s.title);
                      }}
                    >
                      <span className="landing-suggest__icon" aria-hidden>
                        <SearchIcon size={14} />
                      </span>
                      <span className="landing-suggest__text">
                        <span>{head}</span>
                        <strong>{tail}</strong>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Leo Dock Slot + Speech Bubble (Desktop only — auf Mobile lebt Leo
              im sticky #maya-dock-slot-mobile oben in der Section). */}
          <div ref={leoWrapRef} className="landing-leo-wrap" style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
            {/* Speech bubble — fades out when Leo undocks */}
            <div
              ref={bubbleRef}
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 25,
                pointerEvents: "none",
              }}
            >
              <div style={{ position: "relative", width: 141, height: 81 }}>
                <svg width="141" height="81" viewBox="0 0 141 81" fill="none" style={{ display: "block" }}>
                  <path
                    d="M39 0.5H102C109.491 0.5 115.075 0.50021 119.475 0.916016C123.867 1.33112 127.029 2.1569 129.69 3.77539C132.769 5.64729 135.353 8.23137 137.225 11.3096C140.486 16.6722 140.5 20.9959 140.5 34C140.5 41.4986 140.499 45.8181 140.086 48.9561C139.678 52.0507 138.872 53.982 137.225 56.6904C135.353 59.7686 132.769 62.3527 129.69 64.2246C127.029 65.8431 123.867 66.6689 119.475 67.084C115.075 67.4998 109.491 67.5 102 67.5H36.7988L36.6533 67.6396L24.2842 79.5498L26.4912 67.958L26.5996 67.3867L26.0186 67.3643C19.159 67.1051 14.8065 66.3511 11.3096 64.2246C8.23137 62.3527 5.64729 59.7686 3.77539 56.6904C2.12841 53.982 1.32151 52.0507 0.914062 48.9561C0.500937 45.8181 0.5 41.4986 0.5 34C0.5 20.9959 0.514407 16.6722 3.77539 11.3096C5.64729 8.23137 8.23137 5.64729 11.3096 3.77539C13.9712 2.1569 17.1329 1.33112 21.5254 0.916016C25.9254 0.50021 31.5089 0.5 39 0.5Z"
                    fill="none"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth="1"
                  />
                </svg>
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: 68,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  fontFamily: "Merriweather, serif",
                  fontStyle: "italic",
                  fontSize: 13,
                  color: "rgba(0,0,0,0.55)",
                  lineHeight: 1.4,
                  pointerEvents: "none",
                }}>
                  <span>Fragen Sie unseren</span>
                  <span>KI-Agenten LEO</span>
                </div>
              </div>
            </div>
            <div
              id="maya-dock-slot"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 70,
                height: 70,
              }}
            />
          </div>
        </div>

      </div>

      {/* Nav Links */}
      <TopNav className="landing-nav" style={{ marginTop: "23px", alignItems: "center", paddingLeft: "0" }} />

      {/* DotLine + Powered by */}
      <div className="landing-dotline" style={{ position: "relative", zIndex: 51, width: "100%", display: "flex", justifyContent: "center", marginTop: "3px" }}>
        <PoweredByLine style={{ maxWidth: "1060px", width: "100%", paddingLeft: 70 }} />
      </div>

      <style>{`
        .landing-suggest {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 5;
          background-color: var(--color-pill-bg);
          backdrop-filter: blur(16px) brightness(1.15);
          -webkit-backdrop-filter: blur(16px) brightness(1.15);
          border-radius: 0 0 19px 19px;
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.02);
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
        }
        .landing-suggest.is-open { opacity: 1; }
        .landing-suggest__list {
          list-style: none;
          margin: 0;
          padding: 8px 0 13px;
        }
        .landing-suggest.is-open .landing-suggest__list {
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .landing-suggest__option {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 8px 20px;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 16px;
          color: var(--color-text-primary);
          line-height: 1.4;
        }
        .landing-suggest__option.is-active,
        .landing-suggest__option:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
        .landing-suggest__icon {
          color: var(--color-text-medium);
          display: flex;
          align-items: center;
        }
        .landing-suggest__text {
          display: inline-flex;
          gap: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .landing-suggest__text > span { font-weight: 400; }
        .landing-suggest__text > strong { font-weight: 700; }

        /* ── Mobile: Dotline raus, Pillbar (Search + Leo-Wrap) komplett aus,
              Logo rutscht 36px nach unten. Leo lebt im globalen Slot (app/layout.tsx). ── */
        @media (max-width: 767px) {
          .landing-dotline { display: none !important; }
          .landing-pillbar { display: none !important; }
          .landing-logo { margin-top: 36px !important; }
        }
      `}</style>
    </section>
  );
}
