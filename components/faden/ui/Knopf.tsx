/**
 * Der Knopf des Fadens — EINE Form für alle Aufforderungen.
 *
 * Gestalt aus dem Entwurf des Users (13.09.2026) und aus Design A v2 (Übergabe Zeile
 * 270): doppelte Kontur — 2 px Rahmen plus eine Haarlinie als `outline` mit 2 px
 * Abstand —, links der Satz, rechts eine grüne Scheibe mit der Pfeilspitze des Hauses
 * (dieselbe Maske wie `.pfeil-link`, Token `--pfeilspitze`).
 *
 * 🚨 Es gibt genau diesen einen Knopf. Wer eine neue Aufforderung baut, nimmt ihn —
 * sonst hat der Faden nach zehn Blöcken zehn Knöpfe. Drei Fassungen sind vorgesehen:
 * `gross` für die Hauptaufforderung eines Blocks, die Standardgröße für alles Weitere,
 * `still` für die Nebenhandlung (nur Text, keine Scheibe).
 *
 * Als `<a>` (mit `href`) läuft er über den Klick-Abfänger des FadenProvider wie jeder
 * interne Link; als `<button>` (mit `onClick`) macht er, was ihm gesagt wird.
 */
import type { ReactNode } from "react";

interface Gemeinsam {
  children: ReactNode;
  gross?: boolean;
  still?: boolean;
  className?: string;
}

export default function Knopf(
  p: Gemeinsam & ({ href: string; onClick?: never } | { href?: never; onClick: () => void }),
) {
  const klasse = ["knopf", p.gross && "knopf--gross", p.still && "knopf--still", p.className].filter(Boolean).join(" ");
  const inhalt = (
    <>
      <span>{p.children}</span>
      {!p.still && <i className="knopf__scheibe" aria-hidden="true" />}
    </>
  );
  if (p.href) return <a className={klasse} href={p.href}>{inhalt}</a>;
  return <button type="button" className={klasse} onClick={p.onClick}>{inhalt}</button>;
}
