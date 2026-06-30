"use client";

import Link from "next/link";
import { useConsent } from "@/lib/consent/ConsentContext";

/**
 * Cookie-Banner beim Erstbesuch (unten). Erscheint nur, wenn noch keine Wahl
 * gespeichert ist. Drei Aktionen: Alle akzeptieren / Nur notwendig / Einstellungen.
 */
export default function CookieBanner() {
  const { bannerOpen, acceptAll, rejectAll, openSettings } = useConsent();

  if (!bannerOpen) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie-Hinweis" aria-modal="false">
      <div className="cookie-banner__inner glass-card">
        <div className="cookie-banner__text">
          <strong className="cookie-banner__title">Wir respektieren deine Privatsphäre</strong>
          <p>
            Wir verwenden nur technisch notwendige Cookies. Externe Inhalte wie Vergleichsrechner
            unserer Partner und unser Bewertungs-Widget werden erst nach deiner Zustimmung geladen
            und können dabei Cookies setzen. Details in unserer{" "}
            <Link href="/datenschutz" className="cookie-link">Datenschutzerklärung</Link>{" "}
            ·{" "}
            <Link href="/impressum" className="cookie-link">Impressum</Link>.
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button type="button" className="cookie-btn cookie-btn--ghost" onClick={openSettings}>
            Einstellungen
          </button>
          <button type="button" className="cookie-btn cookie-btn--ghost" onClick={rejectAll}>
            Nur notwendig
          </button>
          <button type="button" className="cookie-btn cookie-btn--primary" onClick={acceptAll}>
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
