"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function ContentScaler() {
  const isOpenRef = useRef(false);
  const savedOpacities = useRef<Map<HTMLElement, number>>(new Map());

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

    const scaleDown = () => {
      if (isOpenRef.current) return;
      isOpenRef.current = true;
      const { els, fadeTargets } = getTargets();
      if (els.length === 0) return;

      // Save + freeze current opacity before killing scroll animations
      fadeTargets.forEach((t) => {
        const current = parseFloat(getComputedStyle(t).opacity);
        savedOpacities.current.set(t, current);
      });
      window.dispatchEvent(new CustomEvent("scroll-anim-kill"));
      fadeTargets.forEach((t) => gsap.set(t, { opacity: savedOpacities.current.get(t) ?? 0 }));

      // Scale + blur content — alle .scalable-landing-Wrapper parallel
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        el.style.transformOrigin = `${vw / 2 - rect.left}px ${vh / 2 - rect.top}px`;
        gsap.to(el, { scale: 0.95, filter: "blur(23px)", opacity: 0.5, duration: 0.5, ease: "power2.inOut" });
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
      const { els, fadeTargets } = getTargets();
      if (els.length === 0) return;

      els.forEach((el) => {
        gsap.to(el, {
          scale: 1,
          filter: "blur(0px)",
          opacity: 1,
          duration: 0.5,
          ease: "power2.inOut",
          onComplete: () => {
            // Inline transform/filter auch bei Endwert "none-äquivalent" erzeugen
            // einen Stacking-Context → Inline-Styles am Ende entfernen.
            el.style.transform = "";
            el.style.filter = "";
            el.style.transformOrigin = "";
          },
        });
      });

      fadeTargets.forEach((t) => {
        const restoreOpacity = savedOpacities.current.get(t) ?? 1;
        gsap.to(t, { opacity: restoreOpacity, duration: 0.5, ease: "power2.inOut" });
      });

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
