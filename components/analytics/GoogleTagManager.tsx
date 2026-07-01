"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useConsent } from "@/lib/consent/ConsentContext";

// Google Tag Manager (Container GTM-PBSSR79) — consent-gated über die Kategorie
// "statistics". GTM wird erst geladen, wenn der Nutzer Statistik-Cookies erlaubt
// (Hard-Gating wie bei Trustpilot). GA4 + weitere Tags verwaltet der Kunde in der
// GTM-Oberfläche. Marketing-Tags (AdSense o.Ä.) später über Kategorie "marketing".
const GTM_ID = "GTM-PBSSR79";

export default function GoogleTagManager() {
  const { hasConsent } = useConsent();
  const allowed = hasConsent("statistics");
  const pathname = usePathname();

  // SPA-Navigation: bei Client-seitigem Routenwechsel einen pageview ins dataLayer
  // pushen. (GA4 Enhanced Measurement erfasst History-Events zusätzlich selbst.)
  useEffect(() => {
    if (!allowed || typeof window === "undefined") return;
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: "pageview", page: pathname });
  }, [allowed, pathname]);

  if (!allowed) return null;

  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}
