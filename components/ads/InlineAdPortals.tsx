"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ADSENSE_ENABLED } from "@/lib/ads";
import AdSenseUnit from "@/components/ads/AdSenseUnit";

/**
 * Mid-Article-Ads: Die Asides (.article-side-inline) werden von ArticleContent
 * als String ins Prosa-HTML injiziert (dangerouslySetInnerHTML) — dort kann keine
 * React-Komponente direkt rendern. Deshalb werden AdSenseUnits hineingeportalt.
 *
 * WICHTIG: Nicht einmalig beim Mount einsammeln — das Prosa-HTML wird nach der
 * Hydration mindestens einmal neu gesetzt, die anfangs gefundenen Asides hängen
 * dann verwaist im Speicher (Portale in disconnected Nodes = unsichtbar).
 * Stattdessen per MutationObserver synchron halten; der Identitäts-Vergleich im
 * Setter verhindert Endlos-Loops durch die eigenen Portal-Insertions.
 * Ohne Targets (showMidAd aus) rendert die Komponente nichts.
 */
export default function InlineAdPortals() {
  const [targets, setTargets] = useState<HTMLElement[]>([]);

  useEffect(() => {
    if (!ADSENSE_ENABLED) return;
    let raf = 0;
    const sync = () => {
      setTargets((prev) => {
        const found = Array.from(
          document.querySelectorAll<HTMLElement>("aside.article-side-inline")
        );
        const same =
          prev.length === found.length && prev.every((el, i) => el === found[i]);
        return same ? prev : found;
      });
    };
    sync();
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {targets.map((el, i) =>
        createPortal(<AdSenseUnit format="rectangle" fullWidth bare key={i} />, el, `mid-ad-${i}`)
      )}
    </>
  );
}
