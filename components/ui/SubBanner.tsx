const LINE_COLOR = "rgba(104, 108, 106, 0.7)";

interface SubBannerProps {
  text: string;
}

export default function SubBanner({ text }: SubBannerProps) {
  return (
    <div style={{ width: "100%", position: "relative", zIndex: 2 }}>
      <div className="banner02container" style={{ maxWidth: "960px", marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ height: "30px", width: "100%", backgroundColor: LINE_COLOR, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "16px", fontWeight: 500, color: "#ffffff", letterSpacing: "0.1px", whiteSpace: "nowrap" }}>
            {text}
          </span>
        </div>
        <div style={{ height: "4px", width: "100%", backgroundColor: LINE_COLOR, marginTop: "2px" }} />
        <div style={{ height: "2px", width: "100%", backgroundColor: LINE_COLOR, marginTop: "2px" }} />
      </div>
    </div>
  );
}
