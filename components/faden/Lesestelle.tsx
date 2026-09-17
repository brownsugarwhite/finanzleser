"use client";

/**
 * „Zurück zur Lesestelle“: Vor jedem Sprung ans Ende des Fadens merkt sich der Provider
 * die Stelle; dieser Knopf hängt unter dem Kopf und bringt den Leser dorthin zurück
 * (Port aus dem Prototyp, 03-js-core.html lesestelleMerken/lesestelleZurueck).
 */
import { useFaden } from "./FadenProvider";

export default function Lesestelle() {
  const { lesestelle, lesestelleZurueck } = useFaden();
  const t = lesestelle?.titel || "";
  const text = t ? `Zurück zu „${t.length > 34 ? t.slice(0, 32) + "…" : t}“` : "Zurück zur Lesestelle";
  return (
    <button type="button" className={"lesestelle" + (lesestelle ? " zeigt" : "")} onClick={lesestelleZurueck} tabIndex={lesestelle ? 0 : -1} aria-hidden={!lesestelle}>
      <i>↑</i><span>{text}</span>
    </button>
  );
}
