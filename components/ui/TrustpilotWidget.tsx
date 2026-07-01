"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useConsent } from "@/lib/consent/ConsentContext";

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement, forceReload?: boolean) => void };
  }
}

/**
 * Trustpilot-TrustBox. Eigene Client-Komponente, weil das Bootstrap-Script die
 * Widgets nur beim ersten Laden automatisch initialisiert — bei Client-Navigation
 * (SPA) muss loadFromElement erneut aufgerufen werden, sonst steht nur "Trustpilot".
 *
 * Lädt das Drittanbieter-Script erst nach Marketing-Consent (Trustpilot setzt Cookies);
 * vorher steht ein dezenter Platzhalter mit „Bewertungen laden".
 */
export default function TrustpilotWidget({
  templateId = "53aa8807dec7e10d38f59f32", // Mini-Kachel
  height = "130px",
}: {
  templateId?: string;
  height?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { hasConsent, grant, openSettings } = useConsent();
  const allowed = hasConsent("marketing");

  useEffect(() => {
    if (!allowed) return;
    const load = () => {
      if (ref.current && window.Trustpilot) {
        window.Trustpilot.loadFromElement(ref.current, true);
        return true;
      }
      return false;
    };
    if (load()) return;
    // Script evtl. noch nicht geladen → kurz nachfassen.
    const t = setInterval(() => { if (load()) clearInterval(t); }, 400);
    const stop = setTimeout(() => clearInterval(t), 5000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="embed-consent" style={{ minHeight: height, width: "100%" }}>
        <p className="embed-consent__title">Trustpilot-Bewertungen</p>
        <p className="embed-consent__text">
          Das Bewertungs-Widget wird von Trustpilot geladen und kann dabei Cookies setzen.
        </p>
        <div className="embed-consent__actions">
          <button type="button" className="cookie-btn cookie-btn--primary" onClick={() => grant("marketing")}>
            Bewertungen laden
          </button>
          <button type="button" className="cookie-btn cookie-btn--ghost" onClick={openSettings}>
            Einstellungen
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (ref.current && window.Trustpilot) window.Trustpilot.loadFromElement(ref.current, true);
        }}
      />
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale="de-DE"
        data-template-id={templateId}
        data-businessunit-id="65095be226c6ff8e9dedad97"
        data-style-height={height}
        data-style-width="100%"
        data-token="25522917-e563-49b9-abd1-73b98233e63d"
        style={{ width: "100%" }}
      >
        <a href="https://de.trustpilot.com/review/finconext.de" target="_blank" rel="noopener">
          Trustpilot
        </a>
      </div>
    </>
  );
}
