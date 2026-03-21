"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import lottie, { AnimationItem } from "lottie-web";
import logoData from "@/assets/lottie/logoShrink.json";

const LOGO_W = 190;
const LOGO_H = Math.round((195 / 1662) * LOGO_W);

export default function LogoAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const isShrunk = useRef(false);
  const frameProxy = useRef({ frame: 0 });

  const playLottie = (anim: AnimationItem, from: number, to: number, ease = "power2.out") => {
    gsap.killTweensOf(frameProxy.current);
    frameProxy.current.frame = from;
    gsap.to(frameProxy.current, {
      frame: to,
      duration: 0.7,
      ease,
      onUpdate: () => anim.goToAndStop(frameProxy.current.frame, true),
    });
  };

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

    const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;

    const shrink = () => {
      if (isShrunk.current) return;
      isShrunk.current = true;
      playLottie(anim, 0, anim.totalFrames - 1, "none");
      window.dispatchEvent(new CustomEvent("nav-scrolled-out"));
    };

    const grow = () => {
      if (!isShrunk.current) return;
      isShrunk.current = false;
      playLottie(anim, anim.totalFrames - 1, 0, "power2.out");
      window.dispatchEvent(new CustomEvent("nav-scrolled-in"));
    };

    // Desktop: IntersectionObserver on nav
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isMobile()) return;
        if (!entry.isIntersecting) shrink();
        else grow();
      },
      { threshold: 0, rootMargin: "0px" }
    );
    observer.observe(topNav);

    // Mobile: scroll position
    const onScroll = () => {
      if (!isMobile()) return;
      if (window.scrollY > 10) shrink();
      else grow();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Hide logo when search opens on small screens
    const onSearchOpen = () => {
      if (!window.matchMedia("(max-width: 570px)").matches) return;
      if (!wrapperRef.current) return;
      gsap.to(wrapperRef.current, {
        opacity: 0, filter: "blur(8px)", duration: 0.5, ease: "power2.out",
      });
    };
    const onSearchClose = () => {
      if (!wrapperRef.current) return;
      gsap.to(wrapperRef.current, {
        opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out",
      });
    };
    window.addEventListener("search-opened", onSearchOpen);
    window.addEventListener("search-closed", onSearchClose);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("search-opened", onSearchOpen);
      window.removeEventListener("search-closed", onSearchClose);
      anim.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="logo-wrapper" style={{
      position: "fixed",
      top: 23,
      left: 36,
      zIndex: 61,
      height: 50,
      display: "flex",
      alignItems: "center",
      paddingBottom: 8,
      pointerEvents: "none",
    }}>
      <div
        ref={lottieRef}
        style={{ width: LOGO_W, height: LOGO_H }}
      />
    </div>
  );
}
