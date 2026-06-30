"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConsent } from "@/lib/consent/ConsentContext";
import { CONSENT_CATEGORIES, ConsentState } from "@/lib/consent/types";
import { openOverlay, closeOverlay, registerOverlayCloser } from "@/lib/overlayController";

/**
 * Einstellungen-Modal mit Schaltern pro Kategorie. Wird über den Banner oder den
 * „Cookie-Einstellungen"-Link im Footer geöffnet.
 */
export default function CookieSettings() {
  const { settingsOpen, closeSettings, consent, save, acceptAll } = useConsent();
  const [draft, setDraft] = useState<ConsentState>(consent);

  // Beim Öffnen den aktuellen Stand übernehmen.
  useEffect(() => {
    if (settingsOpen) setDraft({ ...consent });
  }, [settingsOpen, consent]);

  // Wird ein anderes Overlay geöffnet (Menü/Finanztools/Leo), schließt das Modal mit.
  useEffect(() => registerOverlayCloser("cookie", () => closeSettings()), [closeSettings]);

  // ESC schließt + Body-Scroll sperren + denselben Blur/Scale-Effekt der Hintergrund-
  // inhalte wie beim Menü/Finanztools (über den Overlay-Controller).
  useEffect(() => {
    if (!settingsOpen) return;
    openOverlay("cookie", { extended: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSettings(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      closeOverlay("cookie");
    };
  }, [settingsOpen, closeSettings]);

  if (!settingsOpen) return null;

  const toggle = (key: keyof ConsentState) =>
    setDraft((d) => ({ ...d, [key]: !d[key], necessary: true }));

  return (
    <div className="cookie-modal" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
      <div className="cookie-modal__backdrop" onClick={closeSettings} aria-hidden="true" />
      <div className="cookie-modal__panel">
        <div className="cookie-modal__header">
          <h2 className="cookie-modal__title">Cookie-Einstellungen</h2>
          <button type="button" className="cookie-modal__close" onClick={closeSettings} aria-label="Schließen">
            ×
          </button>
        </div>

        <p className="cookie-modal__intro">
          Entscheide selbst, welche Inhalte geladen werden dürfen. Du kannst deine Auswahl jederzeit
          über „Cookie-Einstellungen" im Footer ändern. Mehr in der{" "}
          <Link href="/datenschutz" className="cookie-link" onClick={closeSettings}>Datenschutzerklärung</Link>.
        </p>

        <ul className="cookie-cats">
          {CONSENT_CATEGORIES.map((cat) => (
            <li key={cat.key} className="cookie-cat">
              <div className="cookie-cat__head">
                <span className="cookie-cat__title">{cat.title}</span>
                <label className={`cookie-switch${cat.locked ? " is-locked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={cat.locked ? true : draft[cat.key]}
                    disabled={cat.locked}
                    onChange={() => !cat.locked && toggle(cat.key)}
                  />
                  <span className="cookie-switch__track" aria-hidden="true" />
                </label>
              </div>
              <p className="cookie-cat__desc">{cat.description}</p>
              <p className="cookie-cat__services">Dienste: {cat.services}</p>
            </li>
          ))}
        </ul>

        <div className="cookie-modal__actions">
          <button type="button" className="cookie-btn cookie-btn--ghost" onClick={() => { save(draft); closeSettings(); }}>
            Auswahl speichern
          </button>
          <button type="button" className="cookie-btn cookie-btn--primary" onClick={() => { acceptAll(); closeSettings(); }}>
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
