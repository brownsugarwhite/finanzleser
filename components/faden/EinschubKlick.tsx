"use client";

/**
 * Klick-Hülle um die Anzeigenfläche: im Prototyp zeigt ein Klick nur den Toast
 * „Anzeige (Beispiel, fiktive Marke)“ (03-js-core.html:64), der Link mit href="#"
 * wird abgefangen. Einschub.tsx bleibt Server-Komponente; nur die Fläche ist Client.
 */
import type { ReactNode } from "react";
import { useFaden } from "@/components/faden/FadenProvider";

export default function EinschubKlick({ children }: { children: ReactNode }) {
  const { toast } = useFaden();
  return (
    <a className="einschub__flaeche" href="#" onClick={(e) => { e.preventDefault(); toast("Anzeige (Beispiel, fiktive Marke)"); }}>
      {children}
    </a>
  );
}
