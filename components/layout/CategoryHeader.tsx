"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import StickySparkHeading from "@/components/ui/StickySparkHeading";

interface CategoryHeaderProps {
  title?: string;
  description?: string;
  breadcrumbItems?: { label: string; href: string }[];
  children?: React.ReactNode;
}

export default function CategoryHeader({ title, description, breadcrumbItems, children }: CategoryHeaderProps) {
  const sidePadding = { paddingLeft: "clamp(20px, 4vw, 40px)", paddingRight: "clamp(20px, 4vw, 40px)" };
  return (
    <>
      {/* Pre-Heading-Bereich (Breadcrumb + Visual) — skaliert mit beim Menü-Open */}
      <div className="scalable-landing" style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Breadcrumb über dem Visual */}
        <div style={{ width: "100%", maxWidth: "1200px", paddingBottom: 23, ...sidePadding, boxSizing: "border-box" }}>
          <Breadcrumb items={breadcrumbItems} />
        </div>
        {/* Visual Platzhalter (graue Box, einheitliche Farbe) */}
        <div style={{ width: "100%", maxWidth: "1200px", marginBottom: 40, ...sidePadding, boxSizing: "border-box" }}>
          <div style={{
            width: "100%",
            height: 250,
            background: "rgba(0, 0, 0, 0.05)",
          }} aria-hidden="true" />
        </div>
      </div>

      {/* Sticky Heading — Fragment-Top-Level, damit das Parent-<main> der
          Containing Block ist und die Heading über die volle Body-Höhe klebt. */}
      {title && <StickySparkHeading title={title} as="h1" />}

      {/* Post-Heading-Bereich (Description + Children) — skaliert mit */}
      {(description || children) && (
        <div className="scalable-landing" style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {description && (
            <div style={{ width: "100%", maxWidth: "1200px", ...sidePadding, boxSizing: "border-box" }}>
              <p style={{
                width: "100%",
                maxWidth: 600,
                margin: "23px auto 40px",
                fontFamily: "Merriweather, serif",
                fontSize: 18,
                fontStyle: "italic",
                lineHeight: 1.65,
                color: "var(--color-text-medium)",
                textAlign: "center",
              }}>
                {description}
              </p>
            </div>
          )}
          {children && (
            <div style={{ width: "100%" }}>{children}</div>
          )}
        </div>
      )}
    </>
  );
}
