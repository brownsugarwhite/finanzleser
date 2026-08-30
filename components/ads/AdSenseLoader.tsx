"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent/ConsentContext";
import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/ads";

// Lädt adsbygoogle.js genau einmal — consent-gated über die Kategorie "marketing"
// (analog GoogleAnalytics/"statistics"). Die einzelnen AdSenseUnits pushen in die
// window.adsbygoogle-Queue; Push VOR Script-Load ist safe (Array = Queue).
export default function AdSenseLoader() {
  const { hasConsent } = useConsent();
  if (!ADSENSE_ENABLED || !hasConsent("marketing")) return null;

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
