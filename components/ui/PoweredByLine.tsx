import DotSpacer from "@/components/ui/DotSpacer";

export default function PoweredByLine({ style, showArrow = false }: { style?: React.CSSProperties; showArrow?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", ...style }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "5px" }}>
        {/* Kleine Pfeilspitze am Anfang der Dotline (nur Landingpage), Richtung Linie. */}
        {showArrow && (
          <svg width="6" height="9" viewBox="0 0 8 12" fill="none" aria-hidden style={{ flexShrink: 0 }}>
            <polyline points="1.5 1.5 6.5 6 1.5 10.5" stroke="#686c6a" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <DotSpacer noMargin maxWidth="100%" />
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", paddingBottom: 2 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-medium)" }}>powered by</span>
        <img src="/icons/finconext_logo.svg" alt="Finconext" style={{ width: "80px", height: "auto" }} />
      </div>
    </div>
  );
}
