// Cookie-/Consent-Kategorien (analog zu den Borlabs-Gruppen der Legacy-Seite, damit
// die Logik später 1:1 auf einen CMP übertragbar ist). „necessary" ist immer aktiv.
export type ConsentCategory = "necessary" | "statistics" | "marketing" | "externalMedia";

export interface ConsentState {
  necessary: true;
  statistics: boolean; // vorbereitet/leer — späteres Google Analytics
  marketing: boolean; // Trustpilot-Bewertungen; später Werbung/AdSense
  externalMedia: boolean; // externe Vergleichstools (financeads, check24, …)
}

// Bei Policy-/Dienste-Änderungen hochzählen → Nutzer werden erneut gefragt.
export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "fl_consent_v1";
// Custom-Event, das nach jeder Consent-Änderung gefeuert wird (für Listener außerhalb React).
export const CONSENT_EVENT = "fl-consent-change";

export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  statistics: false,
  marketing: false,
  externalMedia: false,
};

export const ALL_GRANTED: ConsentState = {
  necessary: true,
  statistics: true,
  marketing: true,
  externalMedia: true,
};

export interface StoredConsent {
  version: number;
  timestamp: string;
  categories: ConsentState;
}

// Metadaten für die Kategorie-Schalter im Einstellungen-Modal.
export interface ConsentCategoryMeta {
  key: ConsentCategory;
  title: string;
  description: string;
  services: string;
  locked?: boolean;
}

export const CONSENT_CATEGORIES: ConsentCategoryMeta[] = [
  {
    key: "necessary",
    title: "Notwendig",
    description:
      "Für den Betrieb der Seite technisch erforderlich (z. B. Speicherung deiner Cookie-Auswahl). Diese können nicht deaktiviert werden.",
    services: "Cookie-Einwilligung, Session-Speicher (UI)",
    locked: true,
  },
  {
    key: "externalMedia",
    title: "Externe Vergleichstools",
    description:
      "Interaktive Vergleichsrechner unserer Partner. Diese werden von Drittanbietern geladen und können dort Cookies setzen.",
    services: "financeads, CHECK24, mr-money, Covomo, Partner-Versicherung, Bußgeldrechner, finanzen.de",
  },
  {
    key: "marketing",
    title: "Marketing",
    description:
      "Inhalte, die uns helfen, unser Angebot bekannter zu machen – z. B. unser Bewertungs-Widget.",
    services: "Trustpilot",
  },
  {
    key: "statistics",
    title: "Statistik",
    description:
      "Anonyme Reichweitenmessung, um unsere Inhalte zu verbessern. Aktuell nicht im Einsatz – vorbereitet für die Zukunft.",
    services: "– (derzeit keine)",
  },
];
