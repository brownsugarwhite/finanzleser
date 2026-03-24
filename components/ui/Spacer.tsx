const dashStyle: React.CSSProperties = {
  flex: 1,
  borderTop: "2px dashed rgba(129, 129, 129, 0.3)",
};

export default function Spacer() {
  return (
    <div
      className="spacer"
      style={{
        position: "relative",
        zIndex: 60,
        maxWidth: "1100px",
        margin: "40px auto",
        padding: "0 clamp(20px, 4vw, 40px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={dashStyle} />
        <svg
          width="23"
          height="15"
          viewBox="0 0 23 15"
          fill="none"
          style={{
            flexShrink: 0,
            color: "var(--color-brand)",
          }}
        >
          <path
            d="M11.5 0L13.8 5.5H19.5L14.8 9L17.2 14.5L11.5 11L5.8 14.5L8.2 9L3.5 5.5H9.2L11.5 0Z"
            fill="currentColor"
          />
        </svg>
        <div style={dashStyle} />
      </div>
    </div>
  );
}
