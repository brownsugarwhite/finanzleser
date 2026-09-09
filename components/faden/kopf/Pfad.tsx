"use client";

/**
 * „Sie lesen: …" links vom Lesezeichen — der Titel des Kapitels, in dem der Leser
 * gerade steht. Sichtbar ab 1440 px (Design A v2, Screen 1).
 *
 * 🚨 Der Titel, nicht der Pfad. Vorher stand hier `dataset.pfad` („Versicherungen ›
 * Haftpflicht"), also die Rubrik — die steht aber schon im Kapitelkopf und im
 * Registerblatt. Auf dem Lesezeichen gehört hin, was man liest.
 *
 * 🚨 Gelesen wird aus dem DOM, nicht aus `useAbschnittAktiv()`. Der Speicher dort meldet
 * bei JEDEM Abschnittswechsel — der Kopf samt Register würde beim Scrollen ständig neu
 * rendern, und die Nav-Pille arbeitet imperativ mit Maßen aus dem Layout. Der Titel
 * wechselt nur mit dem Kapitel, also reicht ein Blick nach dem Routen-Commit.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Pfad() {
  const pathname = usePathname();
  const [titel, setTitel] = useState("");
  useEffect(() => {
    const lies = () => {
      const live = document.getElementById("kapitel-live");
      setTitel(live?.dataset.titel || live?.dataset.pfad || "");
    };
    lies();
    const t = setTimeout(lies, 300); // nach dem Routen-Commit
    return () => clearTimeout(t);
  }, [pathname]);
  if (!titel) return null;
  return <span className="sie-lesen">Sie lesen: <b>{titel}</b></span>;
}
