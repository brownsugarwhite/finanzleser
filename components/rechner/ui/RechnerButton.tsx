interface RechnerButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  needsUpdate?: boolean;
  textColor?: string;
}

export default function RechnerButton({
  onClick,
  label = "Berechnen",
  disabled = false,
  needsUpdate = false,
  textColor,
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
        alignSelf: "flex-start",
        marginTop: "23px",
      }}
    >
      <div
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: "17px",
          color: textColor ?? "var(--color-text-primary)",
          fontWeight: "500",
          lineHeight: "30px",
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          margin: "0",
        }}
      >
        <p style={{ margin: "0", padding: "0", color: textColor ?? "var(--color-text-primary)" }}>{text}</p>
      </div>
      <div
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          flexShrink: 0,
        }}
      >
        {/* Knopf-Hintergrund (brand-secondary, alle Zustände) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-brand-secondary)",
            borderRadius: "17px",
          }}
        />

        {/* Icon: Berechnen = Gleich-Zeichen, Aktualisieren = Retry */}
        {needsUpdate ? (
          <svg
            width="15"
            height="16.5"
            viewBox="0 0 20 22"
            fill="none"
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <path d="M7.73219 17.4289C12.0026 18.5139 16.3439 15.9316 17.4289 11.6612C18.5139 7.39085 15.9316 3.04948 11.6612 1.96451C7.39084 0.879543 3.04947 3.46182 1.9645 7.7322" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d="M1.32063 16.8318C0.864582 16.3246 1.03889 15.5198 1.6639 15.2468L7.53466 12.6822C8.28207 12.3557 9.08495 13.0131 8.91231 13.8102L7.3252 21.1385C7.15257 21.9357 6.14963 22.202 5.60428 21.5955L1.32063 16.8318Z" fill="white" />
          </svg>
        ) : (
          <svg
            width="13"
            height="11"
            viewBox="0 0 13 11"
            fill="none"
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <path d="M1.5 1.5L11.5 1.5" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d="M1.5 9.5L11.5 9.5" stroke="white" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
    </button>
  );
}
