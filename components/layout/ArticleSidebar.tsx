"use client";

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

export default function ArticleSidebar({ items, activeId, scrollProgress, scrollToId, collapsed, setCollapsed }: ArticleSidebarProps) {

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
        gap: collapsed ? "10px" : "23px",
        flexShrink: 0,
        width: collapsed ? "120px" : "430px",
        paddingLeft: collapsed ? "23px" : "50px",
        paddingRight: collapsed ? "23px" : "23px",
      }}
    >
      <div className="sticky top-24" style={{ position: "sticky", top: "100px", zIndex: 51, alignSelf: "flex-start", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)", flexShrink: 0 }}>
        <h3
          style={{
            fontFamily: "Merriweather, serif",
            fontSize: collapsed ? "14px" : "18px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: "0 0 " + (collapsed ? "12px" : "23px") + " 0",
            textAlign: collapsed ? "center" : "left",
            flexShrink: 0,
          }}
        >
          {collapsed ? "Inhalt" : "Inhaltsverzeichnis"}
        </h3>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          <TableOfContents
            items={items}
            activeId={activeId}
            scrollProgress={scrollProgress}
            scrollToId={scrollToId}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed(!collapsed)}
          />
        </div>
      </div>
      {/* Toggle + Vertical DotLine */}
      <div style={{ width: 24, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 51 }}>
        {/* Toggle Button */}
        <div style={{ position: "sticky", top: "96px", zIndex: 3, marginTop: "-4px" }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "1px solid var(--color-text-medium)",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            aria-label={collapsed ? "Inhaltsverzeichnis aufklappen" : "Inhaltsverzeichnis zuklappen"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.45 15.77" width="10" height="10" style={{ transform: collapsed ? "rotate(180deg)" : "none" }}>
              <polyline points="9.18 15.27 .5 8.11 9.18 .5" fill="none" stroke="#334A27" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16.95 15.27 8.27 8.11 16.95 .5" fill="none" stroke="#334A27" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
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
