"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import TableOfContents from "@/components/sections/TableOfContents";
import type { TOCItem } from "@/lib/hooks/useArticleToc";

interface ArticleSidebarProps {
  items: TOCItem[];
  activeId: string;
  scrollProgress: number;
  scrollToId: (id: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)"; // ease-in-out
const DUR = "0.35s";

// Label-Schreibmaschine: "Inhalt" ist Präfix von "Inhaltsverzeichnis" → reines
// Slicen genügt (vorwärts ergänzen / rückwärts abbauen).
const SHORT = "Inhalt";
const FULL = "Inhaltsverzeichnis";

const toggleStyles = `
  .toc-toggle {
    background: transparent;
    border: 1px solid var(--color-text-medium);
    color: #334A27;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .toc-toggle:hover {
    background: var(--color-text-primary);
    border-color: var(--color-text-primary);
    color: var(--color-bg-page);
  }
  .toc-toggle:active {
    background: var(--color-brand-secondary);
    border-color: var(--color-brand-secondary);
    color: #ffffff;
  }
  .toc-toggle svg { transition: transform ${DUR} ${EASE}; }
`;

export default function ArticleSidebar({ items, activeId, scrollProgress, scrollToId, collapsed, setCollapsed }: ArticleSidebarProps) {
  // Schreibmaschinen-Label
  const [labelLen, setLabelLen] = useState(collapsed ? SHORT.length : FULL.length);
  const lenRef = useRef(labelLen);
  useEffect(() => {
    const target = collapsed ? SHORT.length : FULL.length;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      const cur = lenRef.current;
      if (cur === target) return;
      const next = cur + (target > cur ? 1 : -1);
      lenRef.current = next;
      setLabelLen(next);
      if (next !== target) timer = setTimeout(tick, 26);
    };
    timer = setTimeout(tick, 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [collapsed]);

  // Scroll-Zustand des TOC-Containers: Top-Linie (gescrollt) + Bottom-Gradient (abgeschnitten)
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledTop, setScrolledTop] = useState(false);
  const [cutOff, setCutOff] = useState(false);
  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrolledTop(el.scrollTop > 2);
    setCutOff(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }, []);
  useEffect(() => {
    recompute();
    const el = scrollRef.current;
    window.addEventListener("resize", recompute);
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      // Container- UND Content-Größe beobachten → cutOff/scrolledTop stimmen auch,
      // wenn der Inhalt (async Tool-Titel, Layout) erst später seine Höhe bekommt.
      ro = new ResizeObserver(() => recompute());
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }
    return () => {
      window.removeEventListener("resize", recompute);
      ro?.disconnect();
    };
  }, [recompute, items, collapsed]);

  return (
    <aside
      className="article-sidebar"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        height: "100%",
        zIndex: 52,
        display: "flex",
        gap: collapsed ? "8px" : "23px",
        flexShrink: 0,
        width: collapsed ? "100px" : "430px",
        paddingLeft: collapsed ? "18px" : "50px",
        paddingRight: collapsed ? "12px" : "23px",
        transition: `width ${DUR} ${EASE}, padding ${DUR} ${EASE}, gap ${DUR} ${EASE}`,
      }}
    >
      <style>{toggleStyles}</style>
      {/* Natürliche Breite (flexShrink:0, kein Grow) → kein Breiten-Snap beim Toggle, expanded
          bleibt eng an der dotted line. Kreise werden collapsed via <a> justifyContent zentriert. */}
      <div className="sticky top-24" style={{ position: "sticky", top: "100px", zIndex: 51, alignSelf: "flex-start", display: "flex", flexDirection: "column", flexShrink: 0, minWidth: 0, alignItems: "stretch" }}>
        <h3
          style={{
            fontFamily: "Merriweather, serif",
            fontSize: collapsed ? "14px" : "18px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: "0 0 " + (collapsed ? "12px" : "23px") + " 0",
            textAlign: "left",
            alignSelf: "flex-start",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: `font-size ${DUR} ${EASE}, margin ${DUR} ${EASE}`,
          }}
        >
          {FULL.slice(0, labelLen)}
        </h3>

        {/* Scroll-Container mit Top-Linie (beim Scrollen) + Bottom-Gradient (abgeschnitten).
            Eigene max-height (viewport-bezogen) → scrollt zuverlässig, statt von flex:1 abzuhängen. */}
        <div style={{ position: "relative", width: "100%", minHeight: 0 }}>
          <div
            aria-hidden
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "rgba(0,0,0,0.12)",
              opacity: scrolledTop ? 1 : 0,
              transition: "opacity 0.25s ease",
              pointerEvents: "none", zIndex: 2,
            }}
          />
          <div ref={scrollRef} onScroll={recompute} style={{ overflowY: "auto", maxHeight: "calc(100vh - 180px)", minHeight: 0, width: "100%", paddingBottom: 60 }}>
            <TableOfContents
              items={items}
              activeId={activeId}
              scrollProgress={scrollProgress}
              scrollToId={scrollToId}
              collapsed={collapsed}
              onToggleCollapsed={() => setCollapsed(!collapsed)}
            />
          </div>
          <div
            aria-hidden
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
              // page-bg (unten) → page-bg mit 0 Alpha (oben) für Einfade-Effekt
              background: "linear-gradient(to top, rgb(250,249,246) 0%, rgba(250,249,246,0) 100%)",
              opacity: cutOff ? 1 : 0,
              transition: "opacity 0.25s ease",
              pointerEvents: "none", zIndex: 2,
            }}
          />
        </div>
      </div>

      {/* Toggle + Vertical DotLine */}
      <div style={{ width: 24, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 51 }}>
        {/* Toggle Button */}
        <div style={{ position: "sticky", top: "96px", zIndex: 3, marginTop: "-4px" }}>
          <button
            className="toc-toggle"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            aria-label={collapsed ? "Inhaltsverzeichnis aufklappen" : "Inhaltsverzeichnis zuklappen"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.45 15.77" width="10" height="10" style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}>
              <polyline points="9.18 15.27 .5 8.11 9.18 .5" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16.95 15.27 8.27 8.11 16.95 .5" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {/* Top fade mask */}
        <div style={{
          position: "sticky",
          top: 6,
          width: "100%",
          height: "116px",
          marginTop: "-116px",
          background: "var(--color-bg-page)",
          pointerEvents: "none",
          zIndex: 2,
        }} />
        <div style={{
          flex: 1,
          width: "3px",
          marginTop: 3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='9'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23686c6a' opacity='0.7'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-y",
          backgroundPosition: "center top",
          backgroundSize: "3px 9px",
        }} />
        {/* Fade mask */}
        <div style={{
          position: "sticky",
          bottom: 0,
          width: "100%",
          height: "33px",
          marginTop: "-33px",
          marginBottom: "-33px",
          background: "var(--color-bg-page)",
          pointerEvents: "none",
          zIndex: 2,
        }} />
        {/* Sticky Arrow */}
        <div style={{ position: "sticky", bottom: 23, display: "flex", justifyContent: "center", zIndex: 3 }}>
          <img src="/icons/arrow down.svg" alt="" style={{ width: 12, height: "auto" }} />
        </div>
      </div>
    </aside>
  );
}
