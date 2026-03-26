"use client";

import Link from "next/link";
import Image from "next/image";

export default function LogoBadge() {
  return (
    <div
      style={{
        position: "fixed",
        top: 23,
        left: 50,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        height: 50,
      }}
    >
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
  );
}
