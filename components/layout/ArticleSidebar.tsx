"use client";

import { useState } from "react";
import TableOfContents from "@/components/sections/TableOfContents";

interface ArticleSidebarProps {
  content: string;
}

export default function ArticleSidebar({ content }: ArticleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="block"
      style={{
        display: "flex",
        gap: collapsed ? "10px" : "23px",
        alignSelf: "stretch",
        flexShrink: 1,
        width: "100%",
        minWidth: "400px",
        paddingLeft: "27px",
      }}
    >
      <div className="sticky top-24" style={{ position: "sticky", zIndex: 51, alignSelf: "flex-start", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)", flexShrink: 0 }}>
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
            content={content}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed(!collapsed)}
          />
        </div>
      </div>
      {/* Toggle + Vertical DotLine */}
      <div style={{ width: 24, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 51 }}>
        {/* Toggle Button */}
        <div style={{ position: "sticky", top: "92px", zIndex: 3, marginTop: "-6px" }}>
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
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path
                d={collapsed ? "M2 4.5L6 8.5L10 4.5" : "M2 7.5L6 3.5L10 7.5"}
                stroke="var(--color-text-medium)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {/* Top fade mask */}
        <div style={{
          position: "sticky",
          top: 0,
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
