"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/** Sets `data-landing` on <body> while the user is on the landing route ("/").
 *  Mounted once in the root layout so the attribute is always in sync with the
 *  current pathname — independent of the landing page component's mount state.
 *  Without this, components persisting across routes (LogoBar, LeoIcon,
 *  BookmarkNav) can keep their landing-mode behavior after navigation.
 *
 *  useLayoutEffect (nicht useEffect): das Attribut muss SYNCHRON vor dem Paint
 *  umgeschaltet werden. Sonst misst der Card→Artikel-Morph (MorphTransitionLayer,
 *  ebenfalls useLayoutEffect) die Ziel-Position noch im Landing-Header-Zustand
 *  (`.sticky-nav` + `.logo-claim` ausgeblendet) → Ziel ~70px zu hoch → Sprung. */
export default function LandingBodyAttr() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (pathname === "/") {
      document.body.setAttribute("data-landing", "");
    } else {
      document.body.removeAttribute("data-landing");
    }
  }, [pathname]);
  return null;
}
