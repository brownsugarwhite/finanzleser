"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";
import LottieLogo, { LOGO_FRAMES, type LottieLogoHandle } from "@/components/ui/LottieLogo";

type LogoState = "hidden" | "short-visible" | "long-visible";

function createScrollAnimations(claim: HTMLElement, dotLine: HTMLElement | null) {
  // Wenn TopBanner ausgeblendet ist, soll der Fade sofort beim Scrollen starten.
  const topBannerVisible = !!document.querySelector(".top-banner");
  const start = topBannerVisible ? 50 : 0;
  const end = topBannerVisible ? 100 : 50;

  const triggers: ScrollTrigger[] = [];

  const st1 = ScrollTrigger.create({
    start,
    end,
    scrub: true,
    animation: gsap.fromTo(claim, { opacity: 1 }, { opacity: 0, ease: "easeIn", immediateRender: false }),
  });
  triggers.push(st1);

  if (dotLine) {
    const st2 = ScrollTrigger.create({
      start,
      end,
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
  const logoRef = useRef<LottieLogoHandle>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const logoTriggerRef = useRef<ScrollTrigger | null>(null);
  const stateRef = useRef<LogoState>("long-visible");
  const menuOpenRef = useRef(false);
  const reconcileSuspendedUntilRef = useRef(0);
  const pathname = usePathname();
  const isLanding = pathname === "/";

  // Init / pathname change → snap logo + state
  useEffect(() => {
    const initialFrame = isLanding ? LOGO_FRAMES.shortHidden : LOGO_FRAMES.longVisible;
    stateRef.current = isLanding ? "hidden" : "long-visible";
    menuOpenRef.current = false;
    logoRef.current?.setFrame(initialFrame);

    const el = wrapperRef.current;
    if (el) {
      el.style.pointerEvents = isLanding ? "none" : "auto";
    }
  }, [isLanding]);

  // Claim + dotline scrub fade (unchanged)
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
      triggersRef.current = [];
      window.removeEventListener("scroll-anim-kill", onKill);
      window.removeEventListener("scroll-anim-recreate", onRecreate);
    };
  }, [pathname]);

  // Non-landing: one-shot ScrollTrigger that drives shrink/grow
  useEffect(() => {
    if (isLanding) return;

    const create = () => {
      const topBannerVisible = !!document.querySelector(".top-banner");
      const triggerPos = topBannerVisible ? 50 : 0;

      logoTriggerRef.current = ScrollTrigger.create({
        start: triggerPos,
        end: triggerPos + 1,
        onEnter: () => {
          if (menuOpenRef.current) return;
          if (stateRef.current !== "long-visible") return;
          logoRef.current?.playShrink();
          stateRef.current = "short-visible";
        },
        onLeaveBack: () => {
          if (menuOpenRef.current) return;
          if (stateRef.current !== "short-visible") return;
          logoRef.current?.playGrow();
          stateRef.current = "long-visible";
        },
      });
    };

    const raf = requestAnimationFrame(create);

    const onKill = () => {
      if (logoTriggerRef.current) {
        logoTriggerRef.current.kill();
        logoTriggerRef.current = null;
      }
    };
    const onRecreate = () => {
      onKill();
      create();
    };

    window.addEventListener("scroll-anim-kill", onKill);
    window.addEventListener("scroll-anim-recreate", onRecreate);

    return () => {
      cancelAnimationFrame(raf);
      onKill();
      window.removeEventListener("scroll-anim-kill", onKill);
      window.removeEventListener("scroll-anim-recreate", onRecreate);
    };
  }, [isLanding]);

  // Landing: nav-scrolled-out / -in → shortIn / shortOut
  useEffect(() => {
    if (!isLanding) return;

    const onNavOut = () => {
      if (menuOpenRef.current) return;
      if (stateRef.current !== "hidden") return;
      logoRef.current?.playShortIn();
      stateRef.current = "short-visible";
      const el = wrapperRef.current;
      if (el) el.style.pointerEvents = "auto";
    };
    const onNavIn = () => {
      if (menuOpenRef.current) return;
      if (stateRef.current !== "short-visible") return;
      logoRef.current?.playShortOut();
      stateRef.current = "hidden";
      const el = wrapperRef.current;
      if (el) el.style.pointerEvents = "none";
    };

    // Reconcile: if logo ended up "short-visible" while still in the
    // "TopNav visible" zone (e.g. after opening the megamenu at page top
    // → long-in → close → shrink), the natural state up there is hidden.
    // On the next upward scroll, snap it back to hidden via short-out.
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const wentUp = currentY < lastScrollY;
      lastScrollY = currentY;
      if (!wentUp) return;
      if (menuOpenRef.current) return;
      if (performance.now() < reconcileSuspendedUntilRef.current) return;
      if (stateRef.current !== "short-visible") return;
      const navEl = document.querySelector(".landing-nav[data-topnav]") as HTMLElement | null;
      if (!navEl) return;
      if (navEl.getBoundingClientRect().bottom <= 0) return; // TopNav already out
      logoRef.current?.playShortOut();
      stateRef.current = "hidden";
      const el = wrapperRef.current;
      if (el) el.style.pointerEvents = "none";
    };

    window.addEventListener("nav-scrolled-out", onNavOut);
    window.addEventListener("nav-scrolled-in", onNavIn);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("nav-scrolled-out", onNavOut);
      window.removeEventListener("nav-scrolled-in", onNavIn);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isLanding]);

  // Menu open/close → grow/shrink (or longIn from hidden)
  useEffect(() => {
    const onMenuOpened = () => {
      menuOpenRef.current = true;
      const state = stateRef.current;
      if (state === "long-visible") return;
      if (state === "hidden") {
        logoRef.current?.playLongIn();
        const el = wrapperRef.current;
        if (el) el.style.pointerEvents = "auto";
      } else {
        logoRef.current?.playGrow();
      }
      stateRef.current = "long-visible";
    };

    const onMenuClosed = () => {
      menuOpenRef.current = false;
      if (stateRef.current !== "long-visible") return;
      logoRef.current?.playShrink();
      stateRef.current = "short-visible";
      // Suspend the landing reconcile-on-scroll-up listener until the shrink
      // tween has settled. Body-scroll-lock release / ContentScaler layout
      // shift can otherwise fire a phantom upward-scroll right after close,
      // which would interrupt shrink and snap to short-out.
      reconcileSuspendedUntilRef.current = performance.now() + 1300;
    };

    window.addEventListener("menu-opened", onMenuOpened);
    window.addEventListener("menu-closed", onMenuClosed);
    return () => {
      window.removeEventListener("menu-opened", onMenuOpened);
      window.removeEventListener("menu-closed", onMenuClosed);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "50px", position: "sticky", top: "13px", zIndex: 62, marginTop: "-50px", pointerEvents: "none" }}>
      <div ref={wrapperRef} className="logo-wrapper" style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "50px", pointerEvents: "auto", width: "fit-content" }}>
        <a href="/" style={{ display: "block", marginTop: "12px", marginLeft: "-3px" }} aria-label="finanzleser Startseite">
          <LottieLogo
            ref={logoRef}
            initialFrame={isLanding ? LOGO_FRAMES.shortHidden : LOGO_FRAMES.longVisible}
            width={233}
          />
        </a>
        <span
          ref={claimRef}
          className="logo-claim"
          style={{ fontFamily: "'Merriweather', serif", fontStyle: "italic", fontSize: "18px", fontWeight: "300", color: "var(--color-text-medium)", whiteSpace: "nowrap", marginTop: "4px" }}
        >
          Das digitale Finanzmagazin
        </span>
      </div>
    </div>
  );
}
