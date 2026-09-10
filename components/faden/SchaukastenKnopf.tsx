"use client";

/**
 * Versteckter Zugang zum Schaukasten (app/schaukasten): ein 12-px-Punkt in der unteren
 * linken Ecke, der erst beim Überfahren sichtbar wird — dazu `Strg/Cmd + Umschalt + S`.
 *
 * Er hängt an SCHAUKASTEN_AKTIV und existiert in einem Produktions-Build gar nicht,
 * solange NEXT_PUBLIC_SCHAUKASTEN fehlt (lib/faden/flag.ts).
 *
 * Der Klick geht bewusst über `navigieren()` und nicht über einen Link: so hängt sich
 * der Schaukasten als KAPITEL an den laufenden Faden an, statt die Seite zu wechseln —
 * man sieht ihn also im selben Zustand, in dem man gerade liest.
 */
import { useEffect } from "react";
import { useFaden } from "./FadenProvider";

export default function SchaukastenKnopf() {
  const { navigieren } = useFaden();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        navigieren("/schaukasten");
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [navigieren]);
  return (
    <button
      type="button"
      className="schaukasten-knopf"
      onClick={() => navigieren("/schaukasten")}
      title="Schaukasten: alle Elemente des Fadens (Strg/Cmd + Umschalt + S)"
      aria-label="Schaukasten öffnen"
    />
  );
}
