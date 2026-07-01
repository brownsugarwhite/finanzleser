"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useConsent } from "@/lib/consent/ConsentContext";

// Google Analytics 4 (gtag.js) — direkt geladen, consent-gated über die Kategorie
// "statistics". Bewusst OHNE GTM-Container: der Alt-Container GTM-PBSSR79 schleppte
// Legacy-Tags (Cookiebot) mit, die Fehler warfen. GA4 lädt erst nach Einwilligung.
const GA_ID = "G-CK0VWE7TKJ";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const { hasConsent } = useConsent();
  const allowed = hasConsent("statistics");
  const pathname = usePathname();
  const firstRef = useRef(true);

  // SPA-Navigation: bei Client-Routenwechsel einen page_view senden. Der initiale
  // page_view kommt bereits aus gtag('config'), daher den ersten Lauf überspringen.
  useEffect(() => {
    if (!allowed) return;
    if (firstRef.current) { firstRef.current = false; return; }
    window.gtag?.("event", "page_view", { page_path: pathname });
  }, [allowed, pathname]);

  if (!allowed) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
