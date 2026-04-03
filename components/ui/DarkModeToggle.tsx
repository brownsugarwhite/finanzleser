"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 52, height: 28 }} />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Light Mode" : "Dark Mode"}
      aria-label="Toggle dark mode"
      style={{
        position: "relative",
        width: 52,
        height: 28,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        padding: 0,
        background: isDark
          ? "rgba(255, 255, 255, 0.2)"
          : "rgba(0, 0, 0, 0.1)",
        transition: "background 0.3s ease",
      }}
    >
      {/* Track icons */}
      <span style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 7px",
        fontSize: 13,
        lineHeight: 1,
      }}>
        <img src="/icons/sun.svg?v=2" alt="" style={{ width: 14, height: 14, opacity: isDark ? 1 : 0, filter: isDark ? "brightness(0) invert(1)" : "none", transition: "opacity 0.3s ease, filter 0.3s ease" }} />
        <img src="/icons/moon.svg?v=2" alt="" style={{ width: 12, height: 12, opacity: isDark ? 0 : 1, transition: "opacity 0.3s ease" }} />
      </span>

      {/* Thumb */}
      <span
        style={{
          position: "absolute",
          top: 3,
          left: isDark ? 27 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isDark ? "var(--color-bg-page)" : "white",
          boxShadow: "none",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </button>
  );
}
