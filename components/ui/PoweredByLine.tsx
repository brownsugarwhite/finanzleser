import DotSpacer from "@/components/ui/DotSpacer";

export default function PoweredByLine({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", ...style }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <DotSpacer noMargin maxWidth="100%" />
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", paddingBottom: 2 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-text-medium)" }}>powered by</span>
        <img src="/icons/finconext_logo.svg" alt="Finconext" style={{ width: "80px", height: "auto" }} />
      </div>
    </div>
  );
}
