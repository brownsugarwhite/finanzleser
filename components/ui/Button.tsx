"use client";

import Image from "next/image";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}

export default function Button({
  label,
  onClick,
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
      <div
        style={{
          position: "relative",
          width: `${currentSize.iconSize}px`,
          height: `${currentSize.iconSize}px`,
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
            borderRadius: "15px",
          }}
        />

        {/* Weißer Pfeil - wird animiert mit scaleY */}
        <svg
          width="11"
          height="15"
          viewBox="0 0 11 15"
          fill="none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: "-5.5px",
            marginTop: "-7.5px",
          }}
        >
          <g
            style={{
              transformOrigin: "5.5px 7.5px",
            }}
          >
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
