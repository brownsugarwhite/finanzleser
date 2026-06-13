"use client";

import type { TOCItem } from "@/lib/hooks/useArticleToc";

const tocHoverStyles = `
  .toc-item:not(.toc-active):hover .toc-badge {
    border-color: var(--color-text-primary) !important;
    background-color: transparent !important;
  }
  .toc-item:not(.toc-active):hover .toc-badge .toc-number {
    color: var(--color-text-primary) !important;
  }
  .toc-item:not(.toc-active):hover .toc-text {
    color: var(--color-text-primary) !important;
  }
`;

interface TableOfContentsProps {
  items: TOCItem[];
  activeId: string;
  scrollProgress: number;
  scrollToId: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onItemClick?: (id: string) => void;
}

// Expanded-Größen (collapsed wird unten kleiner gerechnet — nur dort verkleinern).
const RING_SIZE = 38;
const BADGE_SIZE = 30;

const TOOL_COLORS: Record<string, string> = {
  rechner: "var(--color-tool-rechner)",
  checkliste: "var(--color-tool-checklisten)",
  vergleich: "var(--color-tool-vergleiche)",
  // Dokumente: dunkler Punkt + dunkler Aktiv-/Lade-Ring (analog Finanztools-Badge in Dark)
  dokumente: "var(--color-text-primary)",
};

export default function TableOfContents({
  items,
  activeId,
  scrollProgress,
  scrollToId,
  collapsed = false,
  onItemClick,
}: TableOfContentsProps) {
  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    scrollToId(id);
    onItemClick?.(id);
  };

  // Collapsed: Zahlenkreise + Zahlen etwas kleiner (aber nicht zu klein), Items enger,
  // zentriert. Expanded: wie bisher.
  const ring = collapsed ? 33 : RING_SIZE;
  const badge = collapsed ? 26 : BADGE_SIZE;
  const badgeOff = (ring - badge) / 2;
  const numFont = collapsed ? 15 : 17;
  const badgeRadius = collapsed ? 11 : 12;
  const dotSize = collapsed ? 7 : 8;
  const dotOff = collapsed ? 3 : 3.5;

  return (
    <nav style={{ width: "100%", maxWidth: "300px" }}>
      <style>{tocHoverStyles}</style>
      <ol style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: collapsed ? "7px" : "20px", listStyle: "none", margin: 0, padding: 0, width: "100%", transition: "gap 0.35s cubic-bezier(0.65,0,0.35,1)" }}>
        {items.map((item, idx) => {
          const number = idx + 1;
          const isActive = activeId === item.id;
          const toolColor = item.toolType ? TOOL_COLORS[item.toolType] : undefined;
          const activeColor = toolColor || "var(--color-brand)";
          const toolLabel = item.toolType
            ? item.toolType.charAt(0).toUpperCase() + item.toolType.slice(1)
            : undefined;

          return (
            <li key={item.id}>
              <a
                onClick={(e) => { e.preventDefault(); handleClick(item.id); }}
                className={`toc-item${isActive ? " toc-active" : ""}`}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  // Collapsed: Kreise im Lane zentrieren; Expanded: links (Labels fließen rechts).
                  justifyContent: collapsed ? "center" : "flex-start",
                  width: "100%",
                  gap: "6px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    position: "relative",
                    width: `${ring}px`,
                    height: `${ring}px`,
                    minWidth: `${ring}px`,
                    transition: "width 0.35s cubic-bezier(0.65,0,0.35,1), height 0.35s cubic-bezier(0.65,0,0.35,1), min-width 0.35s cubic-bezier(0.65,0,0.35,1)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${ring}px`,
                      height: `${ring}px`,
                      borderRadius: "40%",
                      border: `2px solid ${isActive ? activeColor : "transparent"}`,
                      maskImage: isActive
                        ? `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`
                        : "none",
                      WebkitMaskImage: isActive
                        ? `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`
                        : "none",
                      transition: "width 0.35s cubic-bezier(0.65,0,0.35,1), height 0.35s cubic-bezier(0.65,0,0.35,1), border-color 0.2s ease",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    className="toc-badge"
                    style={{
                      position: "absolute",
                      top: `${badgeOff}px`,
                      left: `${badgeOff}px`,
                      width: `${badge}px`,
                      height: `${badge}px`,
                      borderRadius: `${badgeRadius}px`,
                      border: `1px solid ${isActive ? activeColor : "var(--color-text-medium)"}`,
                      backgroundColor: isActive ? activeColor : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Merriweather, serif",
                      fontWeight: 300,
                      fontStyle: "italic",
                      fontSize: `${numFont}px`,
                      lineHeight: 1,
                      color: isActive ? "#ffffff" : "var(--color-text-medium)",
                      transition: "width 0.35s cubic-bezier(0.65,0,0.35,1), height 0.35s cubic-bezier(0.65,0,0.35,1), top 0.35s cubic-bezier(0.65,0,0.35,1), left 0.35s cubic-bezier(0.65,0,0.35,1), font-size 0.35s cubic-bezier(0.65,0,0.35,1)",
                    }}
                  >
                    <span className="toc-number" style={{ transform: "skewX(-10deg)", display: "inline-block", color: isActive ? "#ffffff" : "var(--color-text-medium)" }}>
                      {number}
                    </span>
                  </span>
                  {toolColor && (
                    <span
                      style={{
                        position: "absolute",
                        top: `${dotOff}px`,
                        left: `${dotOff}px`,
                        width: `${dotSize}px`,
                        height: `${dotSize}px`,
                        borderRadius: "50%",
                        backgroundColor: toolColor,
                        opacity: isActive ? 0 : 1,
                        transition: "width 0.35s cubic-bezier(0.65,0,0.35,1), height 0.35s cubic-bezier(0.65,0,0.35,1), top 0.35s cubic-bezier(0.65,0,0.35,1), left 0.35s cubic-bezier(0.65,0,0.35,1)",
                      }}
                    />
                  )}
                </span>
                {/* Label-Block IMMER gerendert (kein conditional → kein Reflow-
                    Snap). Collapsed: NULL Höhe (grid-rows 0fr) + NULL Breite
                    (max-width 0) → trägt keine Höhe, Dots bleiben gleichmäßig.
                    Expand: erst Höhe/Breite auf, dann Labels einblenden (opacity
                    verzögert). Feste Innenbreite verhindert Umbruch beim Öffnen. */}
                <span
                  aria-hidden={collapsed}
                  style={{
                    display: "grid",
                    gridTemplateRows: collapsed ? "0fr" : "1fr",
                    flexShrink: 0,
                    overflow: "hidden",
                    maxWidth: collapsed ? 0 : "200px",
                    opacity: collapsed ? 0 : 1,
                    transition: collapsed
                      ? "grid-template-rows 0.35s cubic-bezier(0.65,0,0.35,1), max-width 0.35s cubic-bezier(0.65,0,0.35,1), opacity 0.2s cubic-bezier(0.65,0,0.35,1)"
                      : "grid-template-rows 0.35s cubic-bezier(0.65,0,0.35,1), max-width 0.35s cubic-bezier(0.65,0,0.35,1), opacity 0.25s cubic-bezier(0.65,0,0.35,1) 0.12s",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      width: "200px",
                      minHeight: 0,
                      overflow: "hidden",
                    }}
                  >
                    {toolLabel && (
                      <span
                        style={{
                          display: "inline-block",
                          alignSelf: "flex-start",
                          backgroundColor: toolColor,
                          color: "#ffffff",
                          fontFamily: "var(--font-body), sans-serif",
                          fontSize: "12px",
                          fontWeight: 600,
                          lineHeight: 1,
                          padding: "5px 8px",
                          letterSpacing: "0.02em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {toolLabel}
                      </span>
                    )}
                    <span
                      className="toc-text"
                      style={{
                        fontFamily: "Merriweather, serif",
                        fontWeight: isActive ? 700 : 300,
                        fontStyle: isActive ? "normal" : "italic",
                        fontSize: "14px",
                        color: isActive ? activeColor : "var(--color-text-medium)",
                        lineHeight: "1.4",
                        transition: "none",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.text}
                    </span>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
