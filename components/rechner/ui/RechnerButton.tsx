interface RechnerButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  needsUpdate?: boolean;
}

export default function RechnerButton({
  onClick,
  label = "Berechnen",
  disabled = false,
  needsUpdate = false,
}: RechnerButtonProps) {
  const text = needsUpdate ? "Ergebnis aktualisieren" : label;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Geben Sie neue Werte ein" : undefined}
      className={`rechner-button ${disabled ? "rechner-button--disabled" : ""}`}
      style={{
        backgroundColor: "transparent",
        borderRadius: "21px",
        paddingLeft: "19px",
        paddingRight: "3px",
        paddingTop: "3px",
        paddingBottom: "3px",
        border: "2px solid var(--color-text-primary)",
        outline: "1px solid var(--color-text-primary)",
        outlineOffset: "2px",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        height: "48px",
        marginTop: "24px",
        alignSelf: "flex-start",
      }}
    >
      <div
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: "17px",
          color: "var(--color-text-primary)",
          fontWeight: "500",
          lineHeight: "30px",
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          margin: "0",
        }}
      >
        <p style={{ margin: "0", padding: "0" }}>{text}</p>
      </div>
      <div
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          flexShrink: 0,
        }}
      >
        {/* Grüner Hintergrund */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-brand)",
            borderRadius: "17px",
          }}
        />

        {/* Weißer Pfeil */}
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
