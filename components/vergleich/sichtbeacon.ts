"use client";

/**
 * Sichtkontakt melden — Affiliate-Vertrag ohne Drittanbieter-Cookies.
 *
 * Wenn die Liste zur Hälfte im Bild ist, geht EIN Beacon an unsere eigene Route
 * /api/vergleich-sicht; der Server meldet views/add (und bei geänderten Parametern
 * searchentry/create) an financeads. Kein Pixel von financeads im Browser, keine
 * Cookies — deshalb braucht es keinen Consent. Höchstens fünf Meldungen je Liste und
 * Sitzung, damit Sortieren nicht zum Dauerfeuer wird.
 */
import { useEffect, useRef, type RefObject } from "react";

const gemeldet = new Map<string, number>();
const MAX_JE_LISTE = 5;

export function useSichtbeacon(ref: RefObject<HTMLElement | null>, slug: string, kennung: string, ids: number[], standard: boolean) {
  const schluessel = `${slug}|${ids.slice(0, 40).join(",")}|${standard ? 1 : 0}`;
  const letzter = useRef<string>("");
  useEffect(() => {
    const el = ref.current;
    if (!el || !ids.length || !kennung || letzter.current === schluessel) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const n = gemeldet.get(slug) || 0;
      if (n >= MAX_JE_LISTE || letzter.current === schluessel) return;
      gemeldet.set(slug, n + 1);
      letzter.current = schluessel;
      const body = JSON.stringify({ kennung, ids: ids.slice(0, 40), standard });
      try {
        if (!navigator.sendBeacon?.("/api/vergleich-sicht", new Blob([body], { type: "application/json" }))) {
          fetch("/api/vergleich-sicht", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
        }
      } catch { /* Sichtmeldung ist nie ein Fehler für den Leser */ }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, slug, kennung, schluessel, ids, standard]);
}
