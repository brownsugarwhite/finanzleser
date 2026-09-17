"use client";

/**
 * Pfadzeile „Sie lesen: …“ rechts im Register (Port aus dem Prototyp, 03-js-core.html
 * setzePfad()); sichtbar erst ab 1700 px. Liest den Pfad des lebenden Kapitels.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Pfad() {
  const pathname = usePathname();
  const [pfad, setPfad] = useState("");
  useEffect(() => {
    const lies = () => setPfad(document.getElementById("kapitel-live")?.dataset.pfad || "");
    lies();
    const t = setTimeout(lies, 300); // nach dem Routen-Commit
    return () => clearTimeout(t);
  }, [pathname]);
  if (!pfad) return null;
  return <span className="pfad">Sie lesen: <b>{pfad}</b></span>;
}
