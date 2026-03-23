const dashStyle: React.CSSProperties = {
  flex: 1,
  borderTop: "1px dashed rgba(129, 129, 129, 0.5)",
};

export default function Spacer() {

  return (
    <div
      className="spacer"
      style={{
        position: "relative",
        zIndex: 60,
        maxWidth: "1200px",
        margin: "20px auto 0",
        padding: "0 clamp(20px, 4vw, 40px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={dashStyle} />
        <img
          src="/icons/spacer-icon-green.svg"
          alt=""
          aria-hidden
          width={23}
          height={15}
          className="spacer-icon-green"
          style={{ display: "block", flexShrink: 0 }}
        />
        <img
          src="/icons/spacer-icon-grey.svg"
          alt=""
          aria-hidden
          width={23}
          height={15}
          className="spacer-icon-grey"
          style={{ display: "none", flexShrink: 0 }}
        />
        <div style={dashStyle} />
      </div>
    </div>
  );
}
