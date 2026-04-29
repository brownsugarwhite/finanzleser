// Mapping von rechner_typ → Anzeigename
export const TYP_LABELS: Record<string, string> = {
  steuer: "Steuern & Lohn",
  rente: "Rente & Altersvorsorge",
  soziales: "Soziales & Arbeit",
  kredit: "Kredit & Finanzen",
};

// Sortierreihenfolge der Kategorien
export const TYP_ORDER = ["steuer", "rente", "soziales", "kredit"];
