"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MorphingSectionProps {
  variant?: "default" | "inverted";
  zIndex?: number;
}

export default function MorphingSection({ variant = "default", zIndex }: MorphingSectionProps) {
  const inverted = variant === "inverted";
  const resolvedZIndex = zIndex ?? (inverted ? 2 : 1);
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: inner,
          start: "top bottom",
          end: "top top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.to(section, {
        paddingLeft: "0px",
        paddingRight: "0px",
        ease: "power2.in",
      }, 0).to(inner, {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        ease: "power2.in",
      }, 0);
    });

    // Refresh after fonts/images/sticky layout settle
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") {
      requestAnimationFrame(onLoad);
    } else {
      window.addEventListener("load", onLoad);
    }
    const t = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        width: "100%",
        height: 650,
        paddingLeft: "10vw",
        paddingRight: "10vw",
        display: "flex-column",
        alignItems: "flex-start",
        position: "relative",
        zIndex: resolvedZIndex,
        background: "transparent",
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: "100%",
          minHeight: "230vh",
          background: inverted ? "var(--color-bg-page)" : "#fff",
          borderTopLeftRadius: 57,
          borderTopRightRadius: 57,
          boxShadow: inverted ? "none" : "0 3px 23px rgba(0, 0, 0, 0.02)",
        }}
      />
    </section>
  );
}
