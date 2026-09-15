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

/** Je Liste die Produkt-IDs, die in dieser Sitzung schon gemeldet wurden. */
const gemeldet = new Map<string, Set<number>>();
const MAX_JE_LISTE = 5;
const zaehler = new Map<string, number>();

export function useSichtbeacon(ref: RefObject<HTMLElement | null>, slug: string, kennung: string, ids: number[], standard: boolean) {
  const schluessel = `${slug}|${ids.slice(0, 40).join(",")}|${standard ? 1 : 0}`;
  const letzter = useRef<string>("");
  useEffect(() => {
    const el = ref.current;
    if (!el || !ids.length || !kennung || letzter.current === schluessel) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (letzter.current === schluessel) return;
      letzter.current = schluessel;
      // Nur, was noch nie gemeldet wurde: Sortieren oder Filtern zeigt dieselben Produkte
      // erneut — das ist kein neuer Sichtkontakt. Ein Preset mit neuen Angeboten schon.
      const schon = gemeldet.get(slug) || new Set<number>();
      const neu = ids.slice(0, 40).filter((id) => !schon.has(id));
      const n = zaehler.get(slug) || 0;
      if (!neu.length || n >= MAX_JE_LISTE) return;
      zaehler.set(slug, n + 1);
      neu.forEach((id) => schon.add(id)); gemeldet.set(slug, schon);
      const body = JSON.stringify({ kennung, ids: neu, standard });
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
