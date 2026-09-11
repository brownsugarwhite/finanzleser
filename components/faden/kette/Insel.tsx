/**
 * Inseln: die anfassbaren Stellen eines Kapitels.
 *
 * 🚨 Warum es das gibt: Ein eingefrorenes Kapitel ist ein Foto (HTML-Zeichenkette im
 * Verlauf). Ein Foto hat keine Ereignisbehandlung — Rechner, Checkliste, Vergleich,
 * Statistik-Bedienung und Leos Chips waren darin tot, und nach einem Neuladen erst recht.
 *
 * Statt das ganze Kapitel aus Daten neu zu rendern (das hieße 24 Kapitelarten mit je
 * eigenem JSON-Vertrag), wird nur markiert, WO etwas Anfassbares sitzt und WAS es
 * braucht. Beim Aufklappen hängt `InselnBeleben` die echten Komponenten per Portal
 * genau dort wieder ein. Der Text drumherum bleibt Text — der ist ohnehin statisch.
 *
 * Der Vertrag ist absichtlich winzig: Typ plus Slug. Die vier Werkzeug-Komponenten sind
 * Client-Komponenten, die aus dem Slug allein arbeiten (RechnerEmbed wählt den Rechner,
 * ChecklisteEmbed/VergleichEmbed/DokumenteEmbed holen ihre Daten selbst nach). Nur wo das
 * nicht reicht — Statistik und Leo-Fragen — liegen die Werte als JSON daneben, im selben
 * Muster wie `script[data-glossar-daten]`.
 *
 * „statistik" trägt eine Bestandsstatistik aus dem Meta-Feld (FadenStatistik),
 * „statistik-block" eine aus einem Gutenberg-Block (lib/statistik/schema). Zwei Typen,
 * weil die Nutzlasten verschieden geschnitten sind.
 */
import type { ReactNode } from "react";

export type InselTyp =
  | "rechner" | "checkliste" | "vergleich" | "dokumente"
  | "statistik" | "statistik-block" | "weiterlesen" | "spiel"
  | "aktionen" | "abschnitt-teilen" | "kasten-fuss" | "wochenbrief"
  | "spalten" | "vorlesen" | "schlange" | "faq";

export default function Insel({
  typ, arg, werte, children,
}: {
  typ: InselTyp;
  /** Slug (bei „dokumente" mehrere, mit Komma). */
  arg?: string;
  /** Nur wo der Slug nicht reicht: die Werte der Komponente als JSON. */
  werte?: unknown;
  children: ReactNode;
}) {
  return (
    <div className="insel" data-insel={typ} data-insel-arg={arg || undefined}>
      {werte !== undefined && (
        <script
          type="application/json"
          data-insel-werte=""
          dangerouslySetInnerHTML={{ __html: JSON.stringify(werte).replace(/</g, "\\u003c") }}
        />
      )}
      {children}
    </div>
  );
}
