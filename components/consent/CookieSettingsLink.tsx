"use client";

import { useConsent } from "@/lib/consent/ConsentContext";

/**
 * Footer-Link „Cookie-Einstellungen" — öffnet das Einstellungen-Modal erneut.
 * Eigene Client-Komponente, damit der Footer ansonsten Server-Component bleibt.
 */
export default function CookieSettingsLink({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" className={className} onClick={openSettings}>
      Cookie-Einstellungen
    </button>
  );
}
