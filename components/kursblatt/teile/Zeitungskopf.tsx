import type { ReactNode } from "react";

/**
 * Der Zeitungskopf des Kursblatts.
 *
 * Vorlage: „Finanzleser Vergleich & Rechner - Kursblatt.dc.html“:44-49 —
 * Kickerzeile (links Pfad, rechts Datum · Kursblatt), darunter die Doppellinie, die
 * sich von der Mitte zeichnet; die feine Linie folgt .12 s später.
 *
 * Bewusst zwei getrennte Linien statt `box-shadow`: beide animieren, und zwar versetzt.
 * Serverkomponente — hier ist nichts bedienbar.
 */
export default function Zeitungskopf({
  links,
  rechts,
  children,
}: {
  links: string;
  rechts: string;
  /** Seitenreiter unter der Doppellinie. */
  children?: ReactNode;
}) {
  return (
    <header>
      <div className="kb__kopfzeile">
        <span>{links}</span>
        <span>{rechts}</span>
      </div>
      <div className="kb__kopflinie" aria-hidden="true" />
      <div className="kb__kopflinie kb__kopflinie--fein" aria-hidden="true" />
      {children}
    </header>
  );
}
