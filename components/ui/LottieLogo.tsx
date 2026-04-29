"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import lottie from "lottie-web";
import type { AnimationItem } from "lottie-web";
import gsap from "@/lib/gsapConfig";
import logoData from "@/assets/lottie/logoShrink.json";

export const LOGO_FRAMES = {
  longVisible: 0,
  shortVisible: 118,
  shortOutStart: 128,
  shortHidden: 180,
  longOutStart: 183,
  longHidden: 292,
} as const;

const DURATION = {
  shrink: 1.2,
  grow: 1.2,
  shortIn: 0.5,
  shortOut: 0.5,
  longIn: 1.2,
  longOut: 1.2,
} as const;

export interface LottieLogoHandle {
  playShrink(): void;
  playGrow(): void;
  playShortIn(): void;
  playShortOut(): void;
  playLongIn(): void;
  playLongOut(): void;
  setFrame(frame: number): void;
}

interface Props {
  initialFrame: number;
  width: number;
  ariaLabel?: string;
}

const LottieLogo = forwardRef<LottieLogoHandle, Props>(function LottieLogo(
  { initialFrame, width, ariaLabel = "finanzleser" },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const tweenObjRef = useRef({ f: initialFrame });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<(() => void) | null>(null);
  const reducedMotionRef = useRef(false);
  const initialFrameRef = useRef(initialFrame);
  initialFrameRef.current = initialFrame;

  useEffect(() => {
    if (!containerRef.current) return;

    if (typeof window !== "undefined") {
      reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: logoData,
    });
    animRef.current = anim;

    const finalize = () => {
      readyRef.current = true;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) {
        pending();
      } else {
        anim.goToAndStop(initialFrameRef.current, true);
        tweenObjRef.current.f = initialFrameRef.current;
      }
    };

    // DOMLoaded fires once the SVG is built. With static animationData
    // it may fire synchronously inside loadAnimation — guard with a flag.
    let fired = false;
    const onReady = () => {
      if (fired) return;
      fired = true;
      finalize();
    };
    anim.addEventListener("DOMLoaded", onReady);

    // Safety: if the event already fired before our listener registered
    // (synchronous code path with cached/static data), kick off via rAF.
    const raf = requestAnimationFrame(() => {
      if (!readyRef.current) onReady();
    });

    return () => {
      cancelAnimationFrame(raf);
      anim.removeEventListener("DOMLoaded", onReady);
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
      anim.destroy();
      animRef.current = null;
      readyRef.current = false;
      pendingRef.current = null;
    };
  }, []);

  const snap = (frame: number) => {
    const action = () => {
      const anim = animRef.current;
      if (!anim) return;
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
      anim.goToAndStop(frame, true);
      tweenObjRef.current.f = frame;
    };
    if (!readyRef.current) {
      pendingRef.current = action;
      return;
    }
    action();
  };

  const play = (from: number, to: number, duration: number) => {
    const action = () => {
      const anim = animRef.current;
      if (!anim) return;
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
      if (reducedMotionRef.current) {
        anim.goToAndStop(to, true);
        tweenObjRef.current.f = to;
        return;
      }
      // If currentF is on this segment, tween from there (smooth reverse with
      // proportional duration). Otherwise we're crossing between disjoint
      // segments — snap to `from` and play full duration. Lottie's segment
      // boundaries (118≈128, 180≈292, 0≈183) are visually identical, so the
      // snap is invisible.
      const currentF = tweenObjRef.current.f;
      const segMin = Math.min(from, to);
      const segMax = Math.max(from, to);
      const onSegment = currentF >= segMin && currentF <= segMax;

      let adjustedDuration: number;
      if (onSegment) {
        const span = segMax - segMin;
        const remaining = Math.abs(currentF - to);
        adjustedDuration = span > 0 ? duration * (remaining / span) : 0;
      } else {
        anim.goToAndStop(from, true);
        tweenObjRef.current.f = from;
        adjustedDuration = duration;
      }

      if (adjustedDuration === 0) {
        anim.goToAndStop(to, true);
        tweenObjRef.current.f = to;
        return;
      }
      tweenRef.current = gsap.to(tweenObjRef.current, {
        f: to,
        duration: adjustedDuration,
        ease: "power2.out",
        onUpdate: () => {
          const a = animRef.current;
          if (a) a.goToAndStop(tweenObjRef.current.f, true);
        },
        onComplete: () => {
          tweenRef.current = null;
        },
      });
    };
    if (!readyRef.current) {
      pendingRef.current = action;
      return;
    }
    action();
  };

  useImperativeHandle(ref, () => ({
    playShrink() {
      play(LOGO_FRAMES.longVisible, LOGO_FRAMES.shortVisible, DURATION.shrink);
    },
    playGrow() {
      play(LOGO_FRAMES.shortVisible, LOGO_FRAMES.longVisible, DURATION.grow);
    },
    playShortIn() {
      play(LOGO_FRAMES.shortHidden, LOGO_FRAMES.shortOutStart, DURATION.shortIn);
    },
    playShortOut() {
      play(LOGO_FRAMES.shortOutStart, LOGO_FRAMES.shortHidden, DURATION.shortOut);
    },
    playLongIn() {
      play(LOGO_FRAMES.longHidden, LOGO_FRAMES.longOutStart, DURATION.longIn);
    },
    playLongOut() {
      play(LOGO_FRAMES.longOutStart, LOGO_FRAMES.longHidden, DURATION.longOut);
    },
    setFrame(frame: number) {
      snap(frame);
    },
  }));

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      style={{ width, height: "auto", display: "block", aspectRatio: "1720 / 280" }}
    />
  );
});

export default LottieLogo;
