"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  ConsentState,
  ConsentCategory,
  DEFAULT_CONSENT,
  ALL_GRANTED,
  CONSENT_VERSION,
  CONSENT_STORAGE_KEY,
  CONSENT_EVENT,
} from "./types";

interface ConsentContextValue {
  /** true, sobald clientseitig hydratisiert (vorher lädt nichts Drittes). */
  ready: boolean;
  /** true, wenn der Nutzer bereits eine Wahl gespeichert hat. */
  decided: boolean;
  consent: ConsentState;
  hasConsent: (c: ConsentCategory) => boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (c: Partial<ConsentState>) => void;
  /** Eine einzelne Kategorie freigeben (z. B. „Inhalt laden" am Platzhalter). */
  grant: (c: ConsentCategory) => void;
  bannerOpen: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const ConsentCtx = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [decided, setDecided] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Gespeicherte Wahl nach dem Mount einlesen (SSR-sicher).
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.version === CONSENT_VERSION && parsed.categories) {
          setConsent({ ...DEFAULT_CONSENT, ...parsed.categories, necessary: true });
          setDecided(true);
        }
      }
    } catch {
      /* localStorage nicht verfügbar → Banner zeigen */
    }
  }, []);

  const persist = useCallback((next: ConsentState) => {
    const value: ConsentState = { ...next, necessary: true };
    setConsent(value);
    setDecided(true);
    try {
      localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({ version: CONSENT_VERSION, timestamp: new Date().toISOString(), categories: value }),
      );
    } catch {
      /* ignore */
    }
    try {
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    } catch {
      /* ignore */
    }
  }, []);

  const acceptAll = useCallback(() => persist(ALL_GRANTED), [persist]);
  const rejectAll = useCallback(() => persist(DEFAULT_CONSENT), [persist]);
  const save = useCallback(
    (c: Partial<ConsentState>) => persist({ ...consent, ...c }),
    [persist, consent],
  );
  const grant = useCallback(
    (c: ConsentCategory) => persist({ ...consent, [c]: true }),
    [persist, consent],
  );

  const hasConsent = useCallback(
    (c: ConsentCategory) => (c === "necessary" ? true : mounted && consent[c]),
    [mounted, consent],
  );

  const value: ConsentContextValue = {
    ready: mounted,
    decided,
    consent,
    hasConsent,
    acceptAll,
    rejectAll,
    save,
    grant,
    bannerOpen: mounted && !decided,
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
  };

  return <ConsentCtx.Provider value={value}>{children}</ConsentCtx.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentCtx);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
