"use client";

import { useState } from "react";

interface GamificationEmbedProps {
  gamType: string;
  fields: Record<string, string>;
}

const META: Record<string, { label: string; cls: string }> = {
  mythos: { label: "Mythos oder Fakt", cls: "mythos" },
  karte: { label: "Begriff erklärt", cls: "karte" },
  test: { label: "Kurz nachgedacht", cls: "test" },
  gewusst: { label: "Schon gewusst", cls: "gewusst" },
};

/**
 * Interaktive Gamification-Box im Artikel – redaktionell/dezent gehalten,
 * passend zum Zeitungslayout (dünne Linien, Akzent oben, viel Weißraum).
 * Quelle: <div data-finanzleser-gamification="TYP"> mit data-gam-field-Feldern,
 * vom Content Studio erzeugt und in ArticleContent.parseContent() ausgelesen.
 */
export default function GamificationEmbed({ gamType, fields }: GamificationEmbedProps) {
  const [open, setOpen] = useState(false);
  const meta = META[gamType] ?? { label: "Wissen", cls: "mythos" };

  // Schon gewusst – statische Hinweis-Box (kein Aufklappen)
  if (gamType === "gewusst") {
    return (
      <aside className="fl-gam fl-gam-gewusst">
        <span className="fl-gam-tag">{meta.label}</span>
        <p className="fl-gam-text">{fields.text ?? ""}</p>
      </aside>
    );
  }

  // Mythos / Begriff / Selbsttest – Aussage sichtbar, Auflösung aufklappbar
  let primary = "";
  let reveal = "";
  let revealLabel = "";
  if (gamType === "karte") {
    primary = fields.begriff ?? "";
    reveal = fields.erklaerung ?? "";
    revealLabel = "Erklärung anzeigen";
  } else if (gamType === "test") {
    primary = fields.frage ?? "";
    reveal = fields.antwort ?? "";
    revealLabel = "Antwort anzeigen";
  } else {
    primary = fields.behauptung ?? "";
    reveal = fields.aufloesung ?? "";
    revealLabel = "Auflösung anzeigen";
  }

  return (
    <aside className={`fl-gam fl-gam-${meta.cls}`}>
      <span className="fl-gam-tag">{meta.label}</span>
      <p className={gamType === "karte" ? "fl-gam-term" : "fl-gam-claim"}>{primary}</p>
      <button
        type="button"
        className="fl-gam-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Verbergen" : revealLabel}
        <span className="fl-gam-toggle-icon" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="fl-gam-reveal">{reveal}</p>}
    </aside>
  );
}
