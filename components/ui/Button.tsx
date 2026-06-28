"use client";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  textColor?: string;
  /** Wenn gesetzt, rendert der Button als <a> (z. B. für Datei-Downloads). */
  href?: string;
  download?: boolean | string;
  target?: string;
  rel?: string;
  /** Icon im grünen Kreis: Pfeil rechts (default), nach unten, oder Download. */
  icon?: "arrow" | "arrow-down" | "download";
}

export default function Button({
  label,
  onClick,
  disabled = false,
  textColor,
  href,
  download,
  target,
  rel,
  icon = "arrow",
}: ButtonProps) {
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: "transparent",
    borderRadius: "21px",
    paddingLeft: "20px",
    paddingRight: "3px",
    paddingTop: "3px",
    paddingBottom: "3px",
    border: "2px solid var(--color-text-primary)",
    outline: "1px solid var(--color-text-primary)",
    outlineOffset: "2px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    display: "flex",
    alignItems: "center",
    gap: "13px",
    height: "48px",
    alignSelf: "flex-start",
    textDecoration: "none",
  };

  const content = (
    <>
      <div
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: "17px",
          color: textColor ?? "#1a1a1a",
          fontWeight: "500",
          lineHeight: "30px",
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          margin: "0",
        }}
      >
        <p style={{ margin: "0", padding: "0", color: textColor ?? "#1a1a1a" }}>{label}</p>
      </div>
      <div style={{ position: "relative", width: "38px", height: "38px", flexShrink: 0 }}>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-brand)",
            borderRadius: "17px",
          }}
        />
        {icon === "download" ? (
          <svg
            width="11"
            height="12.5"
            viewBox="0 0 15 17"
            fill="none"
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <path d="M13.5001 1.50009L7.50009 9.50009L1.50009 1.50009" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d="M1.50009 15.5001L13.5001 15.5001" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : (
          <svg
            width="11"
            height="15"
            viewBox="0 0 11 15"
            fill="none"
            style={{ position: "absolute", top: "50%", left: "50%", marginLeft: icon === "arrow-down" ? "-5.5px" : "-4.5px", marginTop: "-7.5px", overflow: "visible" }}
          >
            <g style={{ transformOrigin: "5.5px 7.5px", transform: icon === "arrow-down" ? "rotate(90deg)" : undefined }}>
              <path
                d="M1.5 1.50009L9.5 7.50009L1.5 13.5001"
                stroke="white"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>
        )}
      </div>
    </>
  );

  if (href && !disabled) {
    return (
      <a href={href} download={download} target={target} rel={rel} style={wrapperStyle}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} style={wrapperStyle}>
      {content}
    </button>
  );
}
