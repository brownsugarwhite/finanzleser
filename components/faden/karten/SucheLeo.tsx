"use client";

/** Auf der Suchseite im Faden: die Suche als Frage an Leo weiterreichen. */
import { useFaden } from "@/components/faden/FadenProvider";

export default function SucheLeo({ q }: { q: string }) {
  const { fragen } = useFaden();
  return (
    <div className="chips">
      <button type="button" className="chip chip--leo" onClick={() => fragen(q)}>Leo fragen: „{q}“</button>
    </div>
  );
}
