/**
 * Sprechblasen für den Wortwechsel mit Leo — Form, Kontur und Schwanz exakt wie im
 * Leo-Chat der Live-Seite (components/ui/LeoChatMessages.tsx, CSS in app/components.css).
 *
 * Zwei Sorten:
 *   FrageBlase  — die Frage des Lesers: gefüllt in der dunklen Überschriftenfarbe
 *                 (--ink), Text weiß, Schwanz rechts unten in derselben Farbe.
 *   LeoBlase    — Leos Antwort: Seitenhintergrund mit 1px-Kontur, Schwanz links unten,
 *                 Leos Kopf sitzt daneben auf Höhe des Schwanzes.
 *
 * 🚨 Der Schwanz besteht aus ZWEI deckungsgleichen SVGs: der hintere (mit Strich)
 * setzt die Kontur der Blase fort, der vordere (Füllung = Blasenfarbe) deckt die
 * Konturlinie dort ab, wo der Schwanz an der Blase ansetzt. Ein einzelner Schwanz
 * ergibt entweder eine durchgestrichene Blase oder einen Schwanz ohne Kontur.
 * Dieselbe Konstruktion trägt die Live-Seite.
 */
import type { ReactNode } from "react";
import BubbleSpike from "@/components/ui/BubbleSpike";

export function FrageBlase({ children }: { children: ReactNode }) {
  return (
    <div className="blase-huelle">
      <div className="blase blase--frage">
        {children}
        <BubbleSpike className="blase__spike" />
      </div>
    </div>
  );
}

export function LeoBlase({ children, fehler = false }: { children: ReactNode; fehler?: boolean }) {
  return (
    <div className="blase-huelle">
      <BubbleSpike
        kontur
        className={"blase__spike blase__spike--unten" + (fehler ? " blase__spike--stoerung" : "")}
      />
      <img src="/assets/leo.svg" alt="Leo" className="wort__avatar" />
      <div className={"blase blase--leo" + (fehler ? " blase--fehler" : "")}>
        {children}
        <BubbleSpike className="blase__spike" />
      </div>
    </div>
  );
}
