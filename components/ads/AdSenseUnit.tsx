"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useConsent } from "@/lib/consent/ConsentContext";
import { AD_SIZES, ADSENSE_CLIENT, ADSENSE_SLOT, ADSENSE_TEST, type AdFormat } from "@/lib/ads";
import AdPlaceholder from "@/components/ads/AdPlaceholder";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Höhe des in-flow "Anzeige"-Labels (.pg-note: 10px font + 4px margin) — im
// bare-Modus wird die ins-Höhe darum reduziert, damit die fixe Box nicht überläuft.
const NOTE_H = 14;

/**
 * Echte AdSense-Einheit (responsiver Auto-Slot des Kunden) — consent-gated über
 * die Kategorie "marketing". Ohne Consent rendert sie den grauen Platzhalter
 * (bzw. nichts im bare-Modus, dort liefert der Eltern-Container die graue Box).
 *
 * bare-Modus: kein eigener Container — nur Label + <ins>, für Einsatz IN einem
 * fix dimensionierten Eltern-Element (Mid-Article-Aside, Rail-Boxen). Das
 * Eltern-Element bekommt per Effect `data-live`, was Badge + Grau via CSS abschaltet.
 *
 * Push-Lifecycle (fehleranfällig, deshalb explizit):
 * - pushedRef wird VOR push({}) gesetzt → exakt ein Push pro <ins>, auch unter
 *   StrictMode-Doppel-Effect (Refs überleben den simulierten Remount).
 * - offsetWidth === 0 → NIE pushen (versteckte Rails <1440px würden sonst
 *   "availableWidth=0" werfen); ResizeObserver pusht nach, sobald sichtbar.
 * - data-adsbygoogle-status-Check verhindert "already have ads in them".
 * - Effect-Dependency `allowed` → nachträglich erteilter Consent triggert den Push.
 */
export default function AdSenseUnit({
  format,
  className,
  fullWidth = false,
  bare = false,
}: {
  format: AdFormat;
  className?: string;
  fullWidth?: boolean;
  bare?: boolean;
}) {
  const { hasConsent } = useConsent();
  const allowed = hasConsent("marketing"); // false während SSR/first paint — SSR-safe
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  // bare-Modus: Eltern-Container (Aside/Rail-Box) als "live" markieren →
  // CSS blendet Platzhalter-Badge + graue Fläche aus.
  useEffect(() => {
    if (!bare || !allowed) return;
    insRef.current?.parentElement?.setAttribute("data-live", "1");
  }, [bare, allowed]);

  useEffect(() => {
    if (!allowed || pushedRef.current) return;
    const el = insRef.current;
    if (!el) return;
    const tryPush = () => {
      if (pushedRef.current) return true;
      if (el.offsetWidth === 0) return false;
      if (el.getAttribute("data-adsbygoogle-status")) {
        pushedRef.current = true;
        return true;
      }
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // AdSense-Fehler (z. B. Blocker) dürfen die Seite nie brechen.
      }
      return true;
    };
    if (tryPush()) return;
    const ro = new ResizeObserver(() => {
      if (tryPush()) ro.disconnect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [allowed]);

  if (!allowed) {
    return bare ? null : <AdPlaceholder format={format} className={className} fullWidth={fullWidth} />;
  }

  const ins = (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", width: "100%", height: bare ? `calc(100% - ${NOTE_H}px)` : undefined }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
      {...(ADSENSE_TEST ? { "data-adtest": "on" } : {})}
    />
  );

  if (bare) {
    return (
      <>
        <span className="pg-note">Anzeige</span>
        {ins}
      </>
    );
  }

  const { w, h } = AD_SIZES[format];
  return (
    <div
      className={cn("pg-slot", className)}
      data-slot-format={format}
      data-live="1"
      role="complementary"
      style={{
        width: fullWidth ? "100%" : w,
        maxWidth: "100%",
        minHeight: h,
        marginInline: "auto",
      }}
    >
      <span className="pg-note">Anzeige</span>
      {ins}
    </div>
  );
}
