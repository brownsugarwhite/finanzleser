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
  const [flipped, setFlipped] = useState(false);
  const meta = META[gamType] ?? { label: "Wissen", cls: "mythos" };

  // Begriff erklärt – echte Karteikarte zum Umdrehen (3D-Flip)
  if (gamType === "karte") {
    const front = fields.begriff ?? "";
    const back = fields.erklaerung ?? "";
    return (
      <aside className="fl-gam fl-gam-karte">
        <span className="fl-gam-tag">{meta.label}</span>
        <button
          type="button"
          className={`fl-card${flipped ? " is-flipped" : ""}`}
          onClick={() => setFlipped((v) => !v)}
          aria-pressed={flipped}
          aria-label={`Karteikarte ${front} umdrehen`}
        >
          <span className="fl-card-inner">
            <span className="fl-card-face fl-card-front">
              <span className="fl-card-term">{front}</span>
              <span className="fl-card-hint">Karte umdrehen →</span>
            </span>
            <span className="fl-card-face fl-card-back">
              <span className="fl-card-def">{back}</span>
              <span className="fl-card-hint">← zurück</span>
            </span>
          </span>
        </button>
      </aside>
    );
  }

  // Schon gewusst – statische Hinweis-Box (kein Aufklappen)
  if (gamType === "gewusst") {
    return (
      <aside className="fl-gam fl-gam-gewusst">
        <span className="fl-gam-tag">{meta.label}</span>
        <p className="fl-gam-text">{fields.text ?? ""}</p>
      </aside>
    );
  }

  // Mythos / Selbsttest – Aussage sichtbar, Auflösung aufklappbar
  const primary = gamType === "test" ? (fields.frage ?? "") : (fields.behauptung ?? "");
  const reveal = gamType === "test" ? (fields.antwort ?? "") : (fields.aufloesung ?? "");
  const revealLabel = gamType === "test" ? "Antwort anzeigen" : "Auflösung anzeigen";

  return (
    <aside className={`fl-gam fl-gam-${meta.cls}`}>
      <span className="fl-gam-tag">{meta.label}</span>
      <p className="fl-gam-claim">{primary}</p>
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
