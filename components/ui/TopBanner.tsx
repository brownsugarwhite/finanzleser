interface TopBannerProps {
  text: string;
}

function Dots({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        gap: "7px",
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 80 }, (_, i) => (
        <span
          key={i}
          style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: "rgba(104, 108, 106, 0.7)",
            flexShrink: 0,
          }}
        />
      ))}
    </span>
  );
}

export default function TopBanner({ text }: TopBannerProps) {
  const lineColor = "rgba(104, 108, 106, 0.7)";
  const textColor = "rgba(104, 108, 106, 0.8)";

  return (
    <div style={{ width: "100%", marginTop: "13px", position: "relative", zIndex: 60 }}>
    <div className="top-banner" style={{ maxWidth: "1150px", marginLeft: "auto", marginRight: "auto", overflow: "hidden" }}>
      {/* 3px line */}
      <div style={{ height: "3px", backgroundColor: lineColor }} />
      {/* 1px line */}
      <div style={{ height: "1px", backgroundColor: lineColor, marginTop: "2px" }} />

      {/* Dots + Text + Dots */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "0px 5px",
          overflow: "hidden",
        }}
      >
        <Dots align="right" />
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "16px",
            fontWeight: 550,
            lineHeight: "1.5em",
            color: textColor,
            whiteSpace: "nowrap",
            letterSpacing: "0.2px",
          }}
        >
          {text}
        </span>
        <Dots />
      </div>

      {/* 1px line */}
      <div style={{ height: "1px", backgroundColor: lineColor }} />
      {/* 3px line */}
      <div style={{ height: "3px", backgroundColor: lineColor, marginTop: "2px" }} />
    </div>
    </div>
  );
}
