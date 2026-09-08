"use client";

/**
 * Welcher Abschnitt des lebenden Kapitels gerade im Lesefenster steht — für das
 * Inhaltsverzeichnis in der Kette und in der linken Randspalte (eine Quelle, zwei Anzeigen).
 * Abschnitte tragen `data-toc-titel`; der Beobachter nimmt das mittlere Band des Fensters.
 */
import { useEffect, useState } from "react";

export interface TocZeile { id: string; titel: string }

export function useAbschnittAktiv(pathname: string): { titel: string; toc: TocZeile[]; aktiv: string; vorhanden: boolean } {
  const [stand, setStand] = useState<{ titel: string; toc: TocZeile[]; vorhanden: boolean }>({ titel: "", toc: [], vorhanden: false });
  const [aktiv, setAktiv] = useState("");

  useEffect(() => {
    const el = document.getElementById("kapitel-live");
    if (!el) { setStand({ titel: "", toc: [], vorhanden: false }); setAktiv(""); return; }
    const toc = Array.from(el.querySelectorAll<HTMLElement>(".abschnitt[data-toc-titel]")).map((a) => ({ id: a.id, titel: a.dataset.tocTitel || "" }));
    setStand({ titel: el.dataset.titel || document.title, toc, vorhanden: true });
    setAktiv(toc[0]?.id || "");
    if (!("IntersectionObserver" in window) || !toc.length) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((x) => { if (x.isIntersecting && x.target.id) setAktiv(x.target.id); });
    }, { rootMargin: "-30% 0px -55% 0px" });
    toc.forEach((t) => { const n = document.getElementById(t.id); if (n) io.observe(n); });
    return () => io.disconnect();
  }, [pathname]);

  return { ...stand, aktiv };
}
