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
      className="hidden lg:block"
      style={{
        display: "flex",
        gap: "12px",
        alignSelf: "stretch",
        flexShrink: collapsed ? 1 : 0,
        width: collapsed ? "100%" : "auto",
        minWidth: collapsed ? 0 : "auto",
      }}
    >
      <div className="sticky top-24" style={{ position: "sticky", zIndex: 51 }}>
        <TableOfContents
          content={content}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(!collapsed)}
        />
      </div>
      {/* Vertical DotLine */}
      <div style={{ width: 14, flexShrink: 0, alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
        <div style={{
          flex: 1,
          marginTop: 60,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='9'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23686c6a' opacity='0.7'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-y",
          backgroundPosition: "center top",
          backgroundSize: "3px 9px",
        }} />
        {/* Fade mask */}
        <div style={{
          position: "sticky",
          bottom: 0,
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
