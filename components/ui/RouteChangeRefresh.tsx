"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsapConfig";
import { getActiveOverlay } from "@/lib/overlayController";
import { isTransitioning } from "@/lib/pageTransition";

/** ScrollTrigger.refresh(), aber NIE während ein Overlay offen ist ODER eine
 *  Seiten-Transition läuft — dann ist der Seiteninhalt skaliert/geblurrt
 *  (ContentScaler bzw. Transition-Controller) und getBoundingClientRect läge
 *  daneben. In dem Fall überspringen; der Transition-Controller refresht am ENTER-
 *  Ende selbst (scroll-anim-recreate), ContentScaler nach dem Schließen. */
function safeRefresh() {
  if (getActiveOverlay() !== null || isTransitioning()) return;
  ScrollTrigger.refresh();
}

/** On each route change: tears down stale ScrollTriggers in persistent
 *  components (LogoBar, BookmarkNav, LeoIcon …) and rebuilds them against
 *  the new page's DOM. Without this, triggers created on the landing page
 *  (e.g. attached to `.landing-nav[data-topnav]`) keep targeting now-removed
 *  nodes after navigation, leaving the burger reveal broken until reload. */
export default function RouteChangeRefresh() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  // Einmalig beim Mount: ScrollTrigger neu vermessen, sobald Web-Fonts und alle
  // Ressourcen (Bilder) geladen sind UND nach kurzem Settle. Sonst sitzen
  // Trigger wie Logo-Shrink (BookmarkNav "bottom top") und Leo-Batch-Dock
  // (SparkHeading "top 10%") auf Pre-Font/Pre-Image-Positionen → Logo/Leo
  // springen oder verschwinden beim Scrollen. GSAP refresht nur bei resize,
  // nicht bei Font-/Bild-Load.
  useEffect(() => {
    let cancelled = false;
    const refresh = () => { if (!cancelled) safeRefresh(); };

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(refresh).catch(() => {});
    }
    if (document.readyState === "complete") {
      refresh();
    } else {
      window.addEventListener("load", refresh, { once: true });
    }
    // Async-Hero/Lottie/Suspense-Inhalte setzen sich erst nach dem ersten Paint.
    const t1 = window.setTimeout(refresh, 300);
    const t2 = window.setTimeout(refresh, 1000);

    return () => {
      cancelled = true;
      window.removeEventListener("load", refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    // Skip on initial mount — components set up their own triggers on mount.
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    // Tell components to kill their landing-era triggers immediately.
    window.dispatchEvent(new CustomEvent("scroll-anim-kill"));
    // Next frame: DOM has been swapped → tell them to recreate against new DOM.
    const raf = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("scroll-anim-recreate"));
      safeRefresh();
    });
    const t = window.setTimeout(() => safeRefresh(), 400);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pathname]);
  return null;
}
