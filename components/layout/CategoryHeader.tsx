"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import VisualLottie from "@/components/ui/VisualLottie";
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
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
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
        {/* Visual Platzhalter — wrapper für seitliches Padding */}
        <div style={{ width: "100%", maxWidth: "1200px", marginBottom: 40, ...sidePadding, boxSizing: "border-box" }}>
          <div style={{
            position: "relative",
            width: "100%",
            height: 250,
            background: "transparent",
            overflow: "hidden",
          }}>
            <VisualLottie seed={title} />
          </div>
        </div>
      </div>

      {/* Sticky Heading — bringt .scalable-landing selbst mit, bleibt beim
          Menü-Open über dem ProgressiveBlur (eigener Stacking-Context durch
          sticky + z-index). */}
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
    </div>
  );
}
