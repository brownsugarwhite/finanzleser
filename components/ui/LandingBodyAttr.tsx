"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sets `data-landing` on <body> while the user is on the landing route ("/").
 *  Mounted once in the root layout so the attribute is always in sync with the
 *  current pathname — independent of the landing page component's mount state.
 *  Without this, components persisting across routes (LogoBar, LeoIcon,
 *  BookmarkNav) can keep their landing-mode behavior after navigation. */
export default function LandingBodyAttr() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname === "/") {
      document.body.setAttribute("data-landing", "");
    } else {
      document.body.removeAttribute("data-landing");
    }
  }, [pathname]);
  return null;
}
