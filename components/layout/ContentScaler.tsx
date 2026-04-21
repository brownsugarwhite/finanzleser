"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function ContentScaler() {
  const isOpenRef = useRef(false);
  const savedOpacities = useRef<Map<HTMLElement, number>>(new Map());
  const savedPointerEvents = useRef<Map<HTMLElement, string>>(new Map());
  const previewScaleEls = useRef<HTMLElement[]>([]);

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
      const fadeTargets = [dotLine, !isLanding && claim].filter(Boolean) as HTMLElement[];
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
        document.querySelectorAll<HTMLElement>("[data-scale-extended]").forEach((el) => {
          if (el.offsetParent !== null) extras.push(el);
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
    };

    const scaleUp = () => {
      if (!isOpenRef.current) return;
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

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("scroll-anim-recreate"));
      }, 350);
    };

    window.addEventListener("menu-opened", scaleDown);
    window.addEventListener("menu-closed", scaleUp);

    return () => {
      window.removeEventListener("menu-opened", scaleDown);
      window.removeEventListener("menu-closed", scaleUp);
    };
  }, []);

  return null;
}
