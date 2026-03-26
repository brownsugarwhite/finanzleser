"use client";

import Image from "next/image";

export default function BookmarkNav() {
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        height: 50,
      }}
    >
      {/* Spike */}
      <div style={{ width: 40, height: 50, marginRight: -1, flexShrink: 0 }}>
        <Image
          src="/icons/lesezeichen-spikes.svg"
          alt=""
          width={40}
          height={50}
          style={{ display: "block", width: "100%", height: "100%" }}
          aria-hidden
        />
      </div>

      {/* Green rectangle with buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          height: 50,
          gap: 4,
          paddingLeft: 1,
          paddingRight: 25,
          marginRight: -1,
          background: "linear-gradient(to left, rgba(22,142,3,0.8), #45a117)",
        }}
      >
        {/* Finanztools Button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 36,
            padding: "0 10px",
            borderRadius: 15,
            border: "none",
            background: "transparent",
            color: "white",
            fontFamily: '"Open Sans", sans-serif',
            fontSize: 17,
            fontWeight: 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Finanztools
        </button>

        {/* Lupe Button */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 15,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <Image
            src="/icons/lupe.svg"
            alt="Suche"
            width={18}
            height={18}
          />
        </button>

        {/* Burger Button */}
        <button
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 15,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            gap: 5,
            paddingRight: 8,
          }}
        >
          <div style={{ width: 20, height: 2, background: "white", borderRadius: 1 }} />
          <div style={{ width: 20, height: 2, background: "white", borderRadius: 1 }} />
          <div style={{ width: 20, height: 2, background: "white", borderRadius: 1 }} />
        </button>
      </div>
    </div>
  );
}
