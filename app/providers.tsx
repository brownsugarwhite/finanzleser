"use client";

import "@/lib/gsapConfig"; // Side-effect: registers all GSAP plugins eagerly

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
