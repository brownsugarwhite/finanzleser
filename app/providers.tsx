"use client";

import "@/lib/gsapConfig"; // Side-effect: registers all GSAP plugins eagerly
import { ConsentProvider } from "@/lib/consent/ConsentContext";
import CookieBanner from "@/components/consent/CookieBanner";
import CookieSettings from "@/components/consent/CookieSettings";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      {children}
      <CookieBanner />
      <CookieSettings />
      <GoogleAnalytics />
    </ConsentProvider>
  );
}
