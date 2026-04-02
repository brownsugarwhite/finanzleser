"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LogoBar() {
  const claimRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!claimRef.current) return;

    gsap.to(claimRef.current, {
      opacity: 0,
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "70px top",
        scrub: true,
      },
    });

    return () => {
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
