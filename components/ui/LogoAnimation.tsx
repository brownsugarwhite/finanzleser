"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import lottie, { AnimationItem } from "lottie-web";
import logoData from "@/assets/lottie/logoShrink.json";

const LOGO_W = 190;
const LOGO_H = Math.round((195 / 1662) * LOGO_W);
const TARGET_TOP = 36;
const TARGET_LEFT = 36;

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
    if (!lottieRef.current || !wrapperRef.current) return;

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

      if (!isMobile()) {
        const wrapper = wrapperRef.current!;
        const rect = wrapper.getBoundingClientRect();
        const parent = wrapper.offsetParent as HTMLElement;
        const parentRect = parent ? parent.getBoundingClientRect() : { top: 0, left: 0 };

        gsap.set(wrapper, {
          position: "fixed",
          top: rect.top - parentRect.top,
          left: rect.left - parentRect.left,
          x: 0, y: 0, zIndex: 61,
        });
        gsap.to(wrapper, {
          top: TARGET_TOP - parentRect.top,
          left: TARGET_LEFT - parentRect.left,
          duration: 0.7,
          ease: "power3.out",
        });
      }
    };

    const grow = () => {
      if (!isShrunk.current) return;
      isShrunk.current = false;
      playLottie(anim, anim.totalFrames - 1, 0, "power2.out");
      window.dispatchEvent(new CustomEvent("nav-scrolled-in"));

      if (!isMobile()) {
        const wrapper = wrapperRef.current!;
        const fixedRect = wrapper.getBoundingClientRect();
        gsap.set(wrapper, { clearProps: "position,top,left,x,y,zIndex" });
        const flowRect = wrapper.getBoundingClientRect();

        gsap.fromTo(wrapper, {
          x: fixedRect.left - flowRect.left,
          y: fixedRect.top - flowRect.top,
        }, {
          x: 0, y: 0,
          duration: 0.7,
          ease: "power2.inOut",
        });
      }
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

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      anim.destroy();
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ flexShrink: 0 }}>
      <div
        ref={lottieRef}
        style={{ width: LOGO_W, height: LOGO_H }}
      />
    </div>
  );
}
