"use client";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  textColor?: string;
}

export default function Button({
  label,
  onClick,
  disabled = false,
  textColor,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
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
        display: "flex",
        alignItems: "center",
        gap: "13px",
        height: "48px",
        alignSelf: "flex-start",
      }}
    >
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
      <div
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-brand)",
            borderRadius: "17px",
          }}
        />
        <svg
          width="11"
          height="15"
          viewBox="0 0 11 15"
          fill="none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: "-4.5px",
            marginTop: "-7.5px",
          }}
        >
          <g style={{ transformOrigin: "5.5px 7.5px" }}>
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
      </div>
    </button>
  );
}
