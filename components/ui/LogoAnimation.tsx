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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !isShrunk.current) {
          isShrunk.current = true;
          playLottie(anim, 0, anim.totalFrames - 1, "none");

          // Animate to fixed top-left position
          const wrapper = wrapperRef.current!;
          const rect = wrapper.getBoundingClientRect();
          const parent = wrapper.offsetParent as HTMLElement;
          const parentRect = parent ? parent.getBoundingClientRect() : { top: 0, left: 0 };
          const endTop = TARGET_TOP - parentRect.top;
          const endLeft = TARGET_LEFT - parentRect.left;
          const startTop = rect.top - parentRect.top;
          const startLeft = rect.left - parentRect.left;

          gsap.set(wrapper, {
            position: "fixed",
            top: startTop,
            left: startLeft,
            x: 0,
            y: 0,
            zIndex: 61,
          });
          gsap.to(wrapper, {
            top: endTop,
            left: endLeft,
            duration: 0.7,
            ease: "power3.out",
          });
        } else if (entry.isIntersecting && isShrunk.current) {
          isShrunk.current = false;
          playLottie(anim, anim.totalFrames - 1, 0, "power2.out");

          // Animate back from fixed to flow position
          const wrapper = wrapperRef.current!;
          const fixedRect = wrapper.getBoundingClientRect();

          // Remove fixed to measure where it would be in flow
          gsap.set(wrapper, { clearProps: "position,top,left,x,y,zIndex" });
          const flowRect = wrapper.getBoundingClientRect();

          // Offset from flow position to current fixed position
          const offsetX = fixedRect.left - flowRect.left;
          const offsetY = fixedRect.top - flowRect.top;

          gsap.fromTo(wrapper, {
            x: offsetX,
            y: offsetY,
          }, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
          });
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
    <div ref={wrapperRef} style={{ flexShrink: 0 }}>
      <div
        ref={lottieRef}
        style={{ width: LOGO_W, height: LOGO_H }}
      />
    </div>
  );
}
