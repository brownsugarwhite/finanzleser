"use client";

/** Öffnet das Registerblatt beim Einhängen — für Kategorie- und Übersichtsrouten. */
import { useEffect } from "react";
import { useFaden, type BlattZustand } from "@/components/faden/FadenProvider";

export default function BlattStart({ schluessel, a, b }: { schluessel: BlattZustand["key"]; a?: string; b?: string }) {
  const { blattOeffnen } = useFaden();
  useEffect(() => {
    const t = setTimeout(() => blattOeffnen(schluessel, a, b), 50);
    return () => clearTimeout(t);
  }, [schluessel, a, b, blattOeffnen]);
  return null;
}
