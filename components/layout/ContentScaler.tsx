"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import { setOpenScalableTargets, clearOpenScalableTargets } from "@/lib/scalableTargets";
import { isTransitioning } from "@/lib/pageTransition";

export default function ContentScaler() {
  const isOpenRef = useRef(false);
  const savedOpacities = useRef<Map<HTMLElement, number>>(new Map());
  const savedPointerEvents = useRef<Map<HTMLElement, string>>(new Map());
  const previewScaleEls = useRef<HTMLElement[]>([]);
  // recreate-Timeout tracken, damit rapid-Cycles (open-close-open in <350ms)
  // keine queue'd Timer akkumulieren, die alle gleichzeitig feuern.
  const recreateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const getTargets = () => {
      const landings = Array.from(document.querySelectorAll<HTMLElement>(".scalable-landing"));
      const fallback = document.querySelector<HTMLElement>(".scalable-content");
      const els: HTMLElement[] = landings.length > 0 ? landings : fallback ? [fallback] : [];
      const landingDotLine = document.querySelector(".landing-dotline") as HTMLElement | null;
      const layoutDotLine = document.querySelector(".dotline-animated") as HTMLElement | null;
      const dotLine = landingDotLine || layoutDotLine;
      const isLanding = !!landingDotLine;
      const claim = document.querySelector(".logo-wrapper span") as HTMLElement | null;
      // Quicklinks-Reihe (unter der Dotline, Landing-Desktop) faded bei JEDEM Overlay
      // mit (auch dem Megamenü, das extended:false ist) — wie die Dotline darüber.
      const quicklinks = document.querySelector(".quicklinks-row") as HTMLElement | null;
      const fadeTargets = [dotLine, quicklinks, !isLanding && claim].filter(Boolean) as HTMLElement[];
      return { els, fadeTargets, isLanding };
    };

    const scaleDown = (e?: Event) => {
      if (isOpenRef.current) return;
      isOpenRef.current = true;
      const extended = (e as CustomEvent)?.detail?.extended === true;
      const { els, fadeTargets } = getTargets();
      if (els.length === 0) return;

      // Extended: also scale+blur TopNav(s), dotline(s) and opt-in elements (Logo/Subtitle/Pill on Landing)
      if (extended) {
        const extras: HTMLElement[] = [];
        document.querySelectorAll<HTMLElement>("[data-topnav]").forEach((el) => {
          if (el.offsetParent !== null) extras.push(el);
        });
        document.querySelectorAll<HTMLElement>(".dotline-animated, .landing-dotline").forEach((el) => {
          if (el.offsetParent !== null) extras.push(el);
        });
        // Sichtbarkeitsprüfung via display (NICHT offsetParent) — fixed-positionierte
        // Targets (z.B. .landing-bubble-mobile) haben offsetParent===null obwohl sichtbar
        // und würden sonst fälschlich übersprungen.
        document.querySelectorAll<HTMLElement>("[data-scale-extended]").forEach((el) => {
          if (getComputedStyle(el).display !== "none") extras.push(el);
        });
        extras.forEach((el) => {
          if (!els.includes(el)) {
            els.push(el);
            previewScaleEls.current.push(el);
          }
        });
      }

      // Save + freeze current opacity before killing scroll animations
      fadeTargets.forEach((t) => {
        const current = parseFloat(getComputedStyle(t).opacity);
        savedOpacities.current.set(t, current);
      });
      window.dispatchEvent(new CustomEvent("scroll-anim-kill"));
      fadeTargets.forEach((t) => gsap.set(t, { opacity: savedOpacities.current.get(t) ?? 0 }));

      // Scale + blur all elements (content + optional TopNav/dotline)
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        el.style.transformOrigin = `${vw / 2 - rect.left}px ${vh / 2 - rect.top}px`;
        // Only save original pointerEvents if we haven't already (prevents overwrite
        // during interrupted open→close→open cycles where "none" would leak through).
        if (!savedPointerEvents.current.has(el)) {
          savedPointerEvents.current.set(el, el.style.pointerEvents);
        }
        el.style.pointerEvents = "none";
        gsap.killTweensOf(el, "scale,x,y,rotation,filter,opacity,transform");
        gsap.to(el, {
          scale: 0.95,
          filter: "blur(23px)",
          opacity: 0.5,
          duration: 0.5,
          ease: "power2.inOut",
          force3D: true,
          overwrite: "auto",
        });
      });

      // Fade out dotline + claim
      fadeTargets.forEach((t) => {
        const current = savedOpacities.current.get(t) ?? 0;
        if (current > 0) {
          gsap.to(t, { opacity: 0, duration: 0.5, ease: "power2.inOut" });
        }
      });

      // Offenes Set veröffentlichen, damit der Page-Transition-Controller (Fall A:
      // aus offenem Overlay navigieren) dieselben Elemente übernehmen kann.
      setOpenScalableTargets(els);
    };

    const scaleUp = () => {
      if (!isOpenRef.current) return;
      // Läuft gerade eine Seiten-Transition (Fall A), übernimmt deren Controller den
      // Wrapper (ausfaden → einfaden). NICHT gegen-animieren; nur State sauber halten.
      if (isTransitioning()) {
        isOpenRef.current = false;
        savedPointerEvents.current.forEach((pe, el) => { el.style.pointerEvents = pe; });
        savedPointerEvents.current.clear();
        savedOpacities.current.clear();
        previewScaleEls.current = [];
        clearOpenScalableTargets();
        return;
      }
      isOpenRef.current = false;
      const { els } = getTargets();

      // Include any preview-only elements that were added during scaleDown
      const allEls = [...els, ...previewScaleEls.current.filter((el) => !els.includes(el))];
      previewScaleEls.current = [];

      if (allEls.length === 0) return;

      allEls.forEach((el) => {
        // Restore pointerEvents at scaleUp START (not in onComplete) — survives
        // interruption: if a new scaleDown kills this tween, onComplete never fires,
        // but PE is already restored here.
        const savedPE = savedPointerEvents.current.get(el);
        if (savedPE !== undefined) {
          el.style.pointerEvents = savedPE;
          savedPointerEvents.current.delete(el);
        }
        gsap.killTweensOf(el, "scale,x,y,rotation,filter,opacity,transform");
        gsap.to(el, {
          scale: 1,
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
          force3D: true,
          overwrite: "auto",
          onComplete: () => {
            el.style.transform = "";
            el.style.filter = "";
            el.style.transformOrigin = "";
          },
        });
      });

      savedOpacities.current.forEach((opacity, el) => {
        gsap.to(el, { opacity, duration: 0.5, ease: "power2.inOut" });
      });
      savedOpacities.current.clear();

      // Vorherigen Recreate-Timer canceln (rapid-Cycles), dann neuen setzen.
      if (recreateTimeoutRef.current) clearTimeout(recreateTimeoutRef.current);
      recreateTimeoutRef.current = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("scroll-anim-recreate"));
        recreateTimeoutRef.current = null;
      }, 350);
    };

    // Page-Transition übernimmt das geblurte Set (Fall A). ContentScaler-State
    // zurücksetzen OHNE zu animieren — der Controller treibt Wrapper + Chrome.
    const onTransitionTakeover = () => {
      if (!isOpenRef.current) return;
      isOpenRef.current = false;
      // fadeTargets (dotline/claim) sofort auf gespeicherte Opacity — sie werden
      // vom Controller nicht gemanagt und sollen nicht unsichtbar hängenbleiben.
      savedOpacities.current.forEach((op, el) => { gsap.set(el, { opacity: op }); });
      savedOpacities.current.clear();
      // pointerEvents NICHT restaurieren — der Controller setzt sie nach ENTER zurück.
      savedPointerEvents.current.clear();
      previewScaleEls.current = [];
    };

    window.addEventListener("menu-opened", scaleDown);
    window.addEventListener("menu-closed", scaleUp);
    window.addEventListener("page-transition-takeover", onTransitionTakeover);

    return () => {
      window.removeEventListener("menu-opened", scaleDown);
      window.removeEventListener("menu-closed", scaleUp);
      window.removeEventListener("page-transition-takeover", onTransitionTakeover);
      if (recreateTimeoutRef.current) {
        clearTimeout(recreateTimeoutRef.current);
        recreateTimeoutRef.current = null;
      }
    };
  }, []);

  return null;
}
