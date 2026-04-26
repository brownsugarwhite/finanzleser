"use client";

import { ThemeProvider } from "next-themes";
import "@/lib/gsapConfig"; // Side-effect: registers all GSAP plugins eagerly

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
