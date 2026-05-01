"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsapConfig";

/** On each route change: tears down stale ScrollTriggers in persistent
 *  components (LogoBar, BookmarkNav, LeoIcon …) and rebuilds them against
 *  the new page's DOM. Without this, triggers created on the landing page
 *  (e.g. attached to `.landing-nav[data-topnav]`) keep targeting now-removed
 *  nodes after navigation, leaving the burger reveal broken until reload. */
export default function RouteChangeRefresh() {
  const pathname = usePathname();
  const isFirst = useRef(true);

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
      ScrollTrigger.refresh();
    });
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [pathname]);
  return null;
}
