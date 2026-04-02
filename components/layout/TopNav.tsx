"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useNavItems } from "@/lib/NavContext";
import Spark from "@/components/ui/Spark";

export default function TopNav({ className = "sticky-nav", style }: { className?: string; style?: React.CSSProperties }) {
  const navItems = useNavItems();

  return (
    <>
      <div
        className={className}
        style={{
          width: "100%",
          position: "relative",
          zIndex: 55,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: "-40px",
          paddingLeft: "307px",
          ...style,
        }}
      >
        {/* Nav-Wrapper */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "600px",
            width: "100%",
            height: "50px",
          }}
        >
          <Spark />
          {navItems.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 && <Spark />}
              <Link
                href={item.href}
                style={{
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-nav-text)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  padding: "12px 20px",
                }}
              >
                {item.label}
              </Link>
            </Fragment>
          ))}
          <Spark />
        </div>
      </div>

    </>
  );
}
