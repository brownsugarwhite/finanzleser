"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LogoBar() {
  const claimRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!claimRef.current) return;

    // Delay to ensure dotline is in the DOM
    const raf = requestAnimationFrame(() => {
      const dotLine = document.querySelector(".dotline-animated");
      const targets = [claimRef.current, dotLine].filter(Boolean);

      // Claim fades out
      gsap.fromTo(claimRef.current!, { opacity: 1 }, {
        opacity: 0,
        ease: "easeIn",
        scrollTrigger: { start: 0, end: 100, scrub: true },
      });

      // DotLine fades out + shrinks
      if (dotLine) {
        const startWidth = (dotLine as HTMLElement).offsetWidth;
        const tl = gsap.timeline({
          scrollTrigger: { start: 0, end: 100, scrub: true },
        });
        tl.fromTo(dotLine, { opacity: 1 }, {
          opacity: 0,
          ease: "easeIn",
        }, 0);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "50px", position: "sticky", top: "23px", zIndex: 156, marginTop: "-50px", pointerEvents: "none" }}>
      <div className="logo-wrapper" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "50px", pointerEvents: "auto", width: "fit-content" }}>
        <a href="/"><img src="/icons/fl_logo.svg" alt="finanzleser" style={{ width: "225px", height: "auto", display: "block", marginTop: "19px" }} /></a>
        <span
          ref={claimRef}
          style={{ fontFamily: "'Merriweather', serif", fontStyle: "italic", fontSize: "18px", fontWeight: "300", color: "var(--color-text-medium)", whiteSpace: "nowrap", marginTop: "8px" }}
        >
          Das digitale Finanzmagazin
        </span>
      </div>
    </div>
  );
}
