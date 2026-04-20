"use client";

import Link from "next/link";
import Image from "next/image";

export default function LogoBadge() {
  return (
    <div className="topbar-grid" style={{ position: "fixed", zIndex: 60, pointerEvents: "none" }}>
      <div className="logo-space" style={{ pointerEvents: "auto" }}>
        <Link href="/">
          <Image
            src="/icons/fl_logo.svg"
            alt="finanzleser"
            width={190}
            height={22}
            priority
            style={{ display: "block" }}
          />
        </Link>
      </div>
      <div className="nav-space" />
      <div className="free-space" />
    </div>
  );
}
