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

const RING_SIZE = 38;
const BADGE_SIZE = 30;

const TOOL_COLORS: Record<string, string> = {
  rechner: "var(--color-tool-rechner)",
  checkliste: "var(--color-tool-checklisten)",
  vergleich: "var(--color-tool-vergleiche)",
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

  return (
    <nav style={{ maxWidth: collapsed ? "none" : "300px" }}>
      <style>{tocHoverStyles}</style>
      <ol style={{ display: "flex", flexDirection: "column", gap: collapsed ? "10px" : "20px", listStyle: "none", margin: 0, padding: 0 }}>
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
                  gap: "6px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    position: "relative",
                    width: `${RING_SIZE}px`,
                    height: `${RING_SIZE}px`,
                    minWidth: `${RING_SIZE}px`,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${RING_SIZE}px`,
                      height: `${RING_SIZE}px`,
                      borderRadius: "40%",
                      border: `2px solid ${isActive ? activeColor : "transparent"}`,
                      maskImage: isActive
                        ? `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`
                        : "none",
                      WebkitMaskImage: isActive
                        ? `conic-gradient(from 6deg, #000 ${scrollProgress * 100}%, transparent ${scrollProgress * 100}%)`
                        : "none",
                      transition: "border-color 0.2s ease",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    className="toc-badge"
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: "4px",
                      width: `${BADGE_SIZE}px`,
                      height: `${BADGE_SIZE}px`,
                      borderRadius: "12px",
                      border: `1px solid ${isActive ? activeColor : "var(--color-text-medium)"}`,
                      backgroundColor: isActive ? activeColor : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Merriweather, serif",
                      fontWeight: 300,
                      fontStyle: "italic",
                      fontSize: "17px",
                      lineHeight: 1,
                      color: isActive ? "#ffffff" : "var(--color-text-medium)",
                      transition: "none",
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
                        top: "3.5px",
                        left: "3.5px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: toolColor,
                        opacity: isActive ? 0 : 1,
                      }}
                    />
                  )}
                </span>
                {!collapsed && toolLabel ? (
                  <span style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
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
                      }}
                    >
                      {toolLabel}
                    </span>
                    <span
                      className="toc-text"
                      style={{
                        fontFamily: "Merriweather, serif",
                        fontWeight: isActive ? 700 : 300,
                        fontStyle: isActive ? "normal" : "italic",
                        fontSize: "15px",
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
                ) : !collapsed ? (
                  <span
                    className="toc-text"
                    style={{
                      fontFamily: "Merriweather, serif",
                      fontWeight: isActive ? 700 : 300,
                      fontStyle: isActive ? "normal" : "italic",
                      fontSize: "15px",
                      color: isActive ? "var(--color-brand)" : "var(--color-text-medium)",
                      lineHeight: "1.4",
                      transition: "none",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {item.text}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
