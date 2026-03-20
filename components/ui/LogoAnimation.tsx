"use client";
import { useEffect, useRef } from "react";
import lottie, { AnimationItem } from "lottie-web";
import logoData from "@/assets/lottie/logoShrink.json";

const LOGO_W = 190;
const LOGO_H = Math.round((195 / 1662) * LOGO_W);

export default function LogoAnimation() {
  const lottieRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const isShrunk = useRef(false);

  useEffect(() => {
    if (!lottieRef.current) return;

    const anim = lottie.loadAnimation({
      container: lottieRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: logoData,
    });
    animRef.current = anim;

    const topNav = document.querySelector("nav");
    if (!topNav) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !isShrunk.current) {
          isShrunk.current = true;
          anim.setDirection(1);
          anim.play();
        } else if (entry.isIntersecting && isShrunk.current) {
          isShrunk.current = false;
          anim.setDirection(-1);
          anim.play();
        }
      },
      { threshold: 0, rootMargin: "0px" }
    );

    observer.observe(topNav);
    return () => {
      observer.disconnect();
      anim.destroy();
    };
  }, []);

  return (
    <div
      ref={lottieRef}
      style={{ width: LOGO_W, height: LOGO_H, flexShrink: 0 }}
    />
  );
}
