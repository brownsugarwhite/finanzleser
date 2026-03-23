"use client";
import { useEffect, useRef, useState } from "react";
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
  const [isSmallScreen, setIsSmallScreen] = useState(false);

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
    const isSmall = () => window.matchMedia("(max-width: 570px)").matches;
    setIsSmallScreen(isSmall());

    const mediaQuery570 = window.matchMedia("(max-width: 570px)");
    const handleMediaChange570 = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);

    mediaQuery570.addEventListener("change", handleMediaChange570);

    return () => {
      mediaQuery570.removeEventListener("change", handleMediaChange570);
    };
  }, []);

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

    // Grow logo when mega opens (if shrunk), shrink back when mega closes (if needed)
    const onMegaShow = () => {
      if (isShrunk.current) {
        isShrunk.current = false;
        playLottie(anim, anim.totalFrames - 1, 0, "power2.out");
      }
    };
    const onMegaClosed = () => {
      // Re-shrink if nav is not visible
      const navVisible = topNav.getBoundingClientRect().bottom > 0;
      if (!navVisible && !isShrunk.current) {
        isShrunk.current = true;
        playLottie(anim, 0, anim.totalFrames - 1, "none");
      }
    };
    window.addEventListener("mega-show", onMegaShow);
    window.addEventListener("mega-closed", onMegaClosed);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("search-opened", onSearchOpen);
      window.removeEventListener("search-closed", onSearchClose);
      window.removeEventListener("mega-show", onMegaShow);
      window.removeEventListener("mega-closed", onMegaClosed);
      anim.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="logo-wrapper" style={{
      position: "fixed",
      top: isSmallScreen ? 17 : 23,
      left: isSmallScreen ? "clamp(20px, 4vw, 40px)" : 50,
      zIndex: 61,
      height: 50,
      display: "flex",
      alignItems: "center",
      paddingBottom: 8,
      pointerEvents: "none",
    } as React.CSSProperties}>
      <div
        ref={lottieRef}
        style={{ width: LOGO_W, height: LOGO_H }}
      />
    </div>
  );
}
