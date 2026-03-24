import Image from "next/image";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  iconSrc?: string;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}

export default function Button({
  label,
  onClick,
  iconSrc = "https://www.figma.com/api/mcp/asset/14cc73d8-b8c8-4dbf-b792-e69885b554bd",
  variant = "primary",
  size = "md",
}: ButtonProps) {
  const sizeStyles = {
    md: {
      height: "50px",
      fontSize: "17px",
      paddingLeft: "20px",
      paddingRight: "5px",
      iconSize: 40,
    },
    lg: {
      height: "56px",
      fontSize: "18px",
      paddingLeft: "24px",
      paddingRight: "6px",
      iconSize: 44,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: "rgba(198, 200, 204, 0.23)",
        borderRadius: "19px",
        paddingLeft: currentSize.paddingLeft,
        paddingRight: currentSize.paddingRight,
        paddingTop: "5px",
        paddingBottom: "5px",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        height: currentSize.height,
      }}
    >
      <div
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: currentSize.fontSize,
          color: "var(--color-text-primary)",
          fontWeight: "400",
          lineHeight: `${currentSize.iconSize - 10}px`,
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          margin: "0",
        }}
      >
        <p style={{ margin: "0", padding: "0" }}>{label}</p>
      </div>
      {iconSrc && (
        <div
          style={{
            position: "relative",
            width: `${currentSize.iconSize}px`,
            height: `${currentSize.iconSize}px`,
            flexShrink: 0,
          }}
        >
          <img
            alt="Arrow"
            src={iconSrc}
            style={{
              position: "absolute",
              display: "block",
              width: "100%",
              height: "100%",
              maxWidth: "none",
            }}
          />
        </div>
      )}
    </button>
  );
}
