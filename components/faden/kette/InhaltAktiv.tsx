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
  const { aktiv } = useAbschnittAktiv(pathname);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>("#kapitel-live .inhalt__zeile").forEach((li) => {
      const id = li.querySelector("a[href^='#']")?.getAttribute("href")?.slice(1) || "";
      li.classList.toggle("aktiv", !!id && id === aktiv);
    });
  }, [aktiv, pathname]);

  useEffect(() => {
    const nav = document.getElementById("kapitel-live");
    if (!nav) return;
    const h = (ev: Event) => {
      const a = (ev.target as Element | null)?.closest?.("a[href^='#']");
      if (!a) return;
      ev.preventDefault();
      const id = (a.getAttribute("href") || "").slice(1);
      zuAbschnitt(id);
      try { history.replaceState(null, "", `#${id}`); } catch { /* egal */ }
    };
    nav.addEventListener("click", h);
    return () => nav.removeEventListener("click", h);
  }, [pathname]);

  return null;
}
