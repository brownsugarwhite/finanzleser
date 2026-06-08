"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  startTransition,
  subscribe,
  getPhase,
  notifyRouteCommitted,
  type TransitionPhase,
} from "@/lib/pageTransition";
import { getActiveOverlay, type OverlayId } from "@/lib/overlayController";
import PageTransitionLoader from "@/components/ui/PageTransitionLoader";

interface NavigateOpts {
  fromOverlay?: boolean;
  overlayId?: OverlayId;
}

interface TransitionCtx {
  navigate: (href: string, opts?: NavigateOpts) => void;
}

const Ctx = createContext<TransitionCtx | null>(null);

/** Programmatische Transition-Navigation (Suche, Overlays …). */
export function useTransitionRouter(): TransitionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransitionRouter muss innerhalb von PageTransitionProvider liegen");
  return ctx;
}

/** Aktuelle Transition-Phase abonnieren (z. B. für den Loader). */
export function useTransitionPhase(): TransitionPhase {
  const [phase, setPhase] = useState<TransitionPhase>(getPhase());
  useEffect(() => subscribe(setPhase), []);
  return phase;
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  // Zuverlässiger ENTER-Trigger: usePathname() im persistenten Provider aktualisiert
  // bei JEDER Navigation (wie RouteChangeRefresh) — robuster als ein template.tsx-
  // Remount-Hook, der für manche Routen nicht zuverlässig feuerte (→ Loader hing).
  // useLayoutEffect: läuft nach dem Commit, vor dem Paint → kein Aufblitzen.
  const pathname = usePathname();
  useLayoutEffect(() => {
    notifyRouteCommitted();
  }, [pathname]);

  const navigate = useCallback((href: string, opts?: NavigateOpts) => {
    startTransition({
      href,
      fromOverlay: opts?.fromOverlay,
      overlayId: opts?.overlayId,
      doPush: (h) => routerRef.current.push(h),
    });
  }, []);

  // Globaler Capture-Phase Klick-Interceptor: jeder interne Link bekommt den
  // Übergang. Modifier-Klicks / externe / Hash / Neuer-Tab bleiben unberührt.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as Element | null;
      const a = target?.closest?.("a");
      if (!a) return;

      // Opt-out + neue Tabs / Downloads / externe Links
      if (a.hasAttribute("data-no-transition")) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const rel = a.getAttribute("rel") || "";
      if (rel.includes("external")) return;

      const hrefAttr = a.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("mailto:") || hrefAttr.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // extern

      const sameDoc = url.pathname === window.location.pathname && url.search === window.location.search;
      if (sameDoc) return; // reiner Hash / identische Route → Browser/Default

      e.preventDefault();
      const overlay = getActiveOverlay();
      navigate(
        url.pathname + url.search + url.hash,
        overlay ? { fromOverlay: true, overlayId: overlay } : undefined
      );
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}
      <PageTransitionLoader />
    </Ctx.Provider>
  );
}
