"use client";

/**
 * Macht das serverseitig gerenderte Inhaltsverzeichnis der Kette lebendig: markiert den
 * Abschnitt im Lesefenster und scrollt Anker-Klicks im Kapitel (Inhalt, Leos Einwürfe) sanft unter den Kopf (gleiche Quelle wie
 * das Inhaltsverzeichnis in der linken Randspalte).
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAbschnittAktiv } from "@/lib/faden/useAbschnittAktiv";
import { zuAbschnitt } from "@/components/faden/RandLinks";

export default function InhaltAktiv() {
  const pathname = usePathname();
  const { aktiv } = useAbschnittAktiv();

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("#kapitel-live .inhalt__zeile").forEach((li) => {
      const id = li.querySelector("a[href^='#']")?.getAttribute("href")?.slice(1) || "";
      li.classList.toggle("aktiv", !!id && id === aktiv);
    });
  }, [aktiv, pathname]);

  // 🚨 Am Dokument, nicht am Kapitel: `usePathname()` wechselt, bevor das neue Kapitel im
  // DOM steht — ein Listener auf `#kapitel-live` hing danach an einem Knoten, der gleich
  // verschwand, und das neue Kapitel bekam gar keinen.
  useEffect(() => {
    const h = (ev: Event) => {
      const a = (ev.target as Element | null)?.closest?.("#kapitel-live a[href^='#']");
      if (!a) return;
      ev.preventDefault();
      const id = (a.getAttribute("href") || "").slice(1);
      zuAbschnitt(id);
      try { history.replaceState(null, "", `#${id}`); } catch { /* egal */ }
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  return null;
}
