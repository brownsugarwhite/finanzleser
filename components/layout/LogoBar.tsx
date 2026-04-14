"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function createScrollAnimations(claim: HTMLElement, dotLine: HTMLElement | null) {
  const triggers: ScrollTrigger[] = [];

  const st1 = ScrollTrigger.create({
    start: 50,
    end: 100,
    scrub: true,
    animation: gsap.fromTo(claim, { opacity: 1 }, { opacity: 0, ease: "easeIn", immediateRender: false }),
  });
  triggers.push(st1);

  if (dotLine) {
    const st2 = ScrollTrigger.create({
      start: 50,
      end: 100,
      scrub: true,
      animation: gsap.fromTo(dotLine, { opacity: 1 }, { opacity: 0, ease: "easeIn", immediateRender: false }),
    });
    triggers.push(st2);
  }

  return triggers;
}

export default function LogoBar() {
  const claimRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  // Regular page: claim + dotline fade on scroll
  useEffect(() => {
    if (!claimRef.current) return;

    const raf = requestAnimationFrame(() => {
      const dotLine = document.querySelector(".dotline-animated") as HTMLElement | null;
      triggersRef.current = createScrollAnimations(claimRef.current!, dotLine);
    });

    const onKill = () => {
      triggersRef.current.forEach((st) => {
        const anim = st.animation;
        if (anim) anim.pause();
        st.kill();
      });
      triggersRef.current = [];
    };

    const onRecreate = () => {
      if (!claimRef.current) return;
      const dotLine = document.querySelector(".dotline-animated") as HTMLElement | null;
      triggersRef.current = createScrollAnimations(claimRef.current, dotLine);
    };

    window.addEventListener("scroll-anim-kill", onKill);
    window.addEventListener("scroll-anim-recreate", onRecreate);

    return () => {
      cancelAnimationFrame(raf);
      triggersRef.current.forEach((st) => st.kill());
      window.removeEventListener("scroll-anim-kill", onKill);
      window.removeEventListener("scroll-anim-recreate", onRecreate);
    };
  }, []);

  // Landing page: slide logo in/out synced with burger
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onNavOut = () => {
      if (!document.body.hasAttribute("data-landing")) return;
      gsap.to(el, { x: 0, duration: 0.4, ease: "power2.out" });
      el.style.pointerEvents = "auto";
    };
    const onNavIn = () => {
      if (!document.body.hasAttribute("data-landing")) return;
      gsap.to(el, { x: -280, duration: 0.4, ease: "power2.in" });
      el.style.pointerEvents = "none";
    };

    window.addEventListener("nav-scrolled-out", onNavOut);
    window.addEventListener("nav-scrolled-in", onNavIn);
    return () => {
      window.removeEventListener("nav-scrolled-out", onNavOut);
      window.removeEventListener("nav-scrolled-in", onNavIn);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "50px", position: "sticky", top: "13px", zIndex: 54, marginTop: "-50px", pointerEvents: "none" }}>
      <div ref={wrapperRef} className="logo-wrapper" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "50px", pointerEvents: "auto", width: "fit-content" }}>
        <a href="/"><img src="/icons/fl_logo.svg" alt="finanzleser" style={{ width: "225px", height: "auto", display: "block", marginTop: "19px" }} /></a>
        <span
          ref={claimRef}
          className="logo-claim"
          style={{ fontFamily: "'Merriweather', serif", fontStyle: "italic", fontSize: "18px", fontWeight: "300", color: "var(--color-text-medium)", whiteSpace: "nowrap", marginTop: "8px" }}
        >
          Das digitale Finanzmagazin
        </span>
      </div>
    </div>
  );
}
