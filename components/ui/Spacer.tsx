type SpacerProps = {
  variant?: "green" | "grey";
};

const dashStyle: React.CSSProperties = {
  flex: 1,
  borderTop: "1px dashed rgba(129, 129, 129, 0.5)",
};

export default function Spacer({ variant = "green" }: SpacerProps) {
  const icon = variant === "green"
    ? "/icons/spacer-icon-green.svg"
    : "/icons/spacer-icon-grey.svg";

  return (
    <div
      style={{
        position: "relative",
        zIndex: 60,
        maxWidth: "960px",
        margin: "25px auto 0",
        padding: "0 clamp(20px, 4vw, 40px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <div style={dashStyle} />
        <img
          src={icon}
          alt=""
          aria-hidden
          width={23}
          height={15}
          style={{ display: "block", flexShrink: 0 }}
        />
        <div style={dashStyle} />
      </div>
    </div>
  );
}
