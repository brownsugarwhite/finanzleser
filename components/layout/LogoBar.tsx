"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useRef, useEffect, useState } from "react";
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
  // Saved state from before a mobile preview-overlay opened. Restored on close.
  const previewPriorStateRef = useRef<LogoState | null>(null);
  // Restore-Timer (cancel-bar wenn ein erneutes menu-opened reinkommt — z.B.
  // beim Dev-Mode-StrictMode-Doppellauf des Overlays, wo Mount-Cleanup ein
  // menu-closed feuert zwischen zwei menu-opened-Events).
  const previewRestoreTimerRef = useRef<number | null>(null);
  const pathname = usePathname();
  const isLanding = pathname === "/";

  // Slot-Position responsive: Mobile 60px, Desktop 90px vom linken Bildrand.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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

  // Landing: Mobile = Leo-Swap-Events (Leo↔Logo), Desktop = nav-scrolled-out/-in
  useEffect(() => {
    if (!isLanding) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      // Mobile: Logo erscheint NACH Leos Flug zur Home-Ecke,
      // verschwindet wenn Revolver-Buttons den 100px-Bereich verlassen.
      const onFlewHome = () => {
        if (menuOpenRef.current) return;
        if (stateRef.current !== "hidden") return;
        logoRef.current?.playShortIn();
        stateRef.current = "short-visible";
        const el = wrapperRef.current;
        if (el) el.style.pointerEvents = "auto";
      };
      const onRevolverFar = () => {
        if (menuOpenRef.current) return;
        if (stateRef.current !== "short-visible") return;
        logoRef.current?.playShortOut();
        stateRef.current = "hidden";
        const el = wrapperRef.current;
        if (el) el.style.pointerEvents = "none";
      };
      window.addEventListener("leo-flew-home", onFlewHome);
      window.addEventListener("revolver-far-from-bottom", onRevolverFar);
      return () => {
        window.removeEventListener("leo-flew-home", onFlewHome);
        window.removeEventListener("revolver-far-from-bottom", onRevolverFar);
      };
    }

    // Desktop: bestehendes Verhalten — TopNav-Out/-In triggert shortIn/shortOut
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
    const onMenuOpened = (e: Event) => {
      // Pending Restore canceln (z.B. Dev-StrictMode-Cleanup hat menu-closed
      // gefeuert während Overlay tatsächlich noch öffnet). priorState bleibt
      // erhalten für den späteren echten Close.
      if (previewRestoreTimerRef.current) {
        clearTimeout(previewRestoreTimerRef.current);
        previewRestoreTimerRef.current = null;
      }
      menuOpenRef.current = true;
      const detail = (e as CustomEvent).detail as { label?: string } | undefined;

      // Preview-Overlay: OUT-Animation passend zum aktuellen Zustand spielen
      // und prior state merken. NUR Mobile — auf Desktop bleibt das Logo
      // sichtbar (Slidercard liegt z-index-mäßig drüber).
      // priorState NUR einmal pro Open setzen — der Overlay-IN-Effect feuert
      // in Dev (StrictMode) doppelt, sonst würde der zweite Call "hidden"
      // reinschreiben und der Restore beim Close wäre kaputt.
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (detail?.label === "preview" && isMobile) {
        const state = stateRef.current;
        if (previewPriorStateRef.current === null) {
          previewPriorStateRef.current = state;
        }
        if (state === "short-visible") {
          logoRef.current?.playShortOut();
          stateRef.current = "hidden";
        } else if (state === "long-visible") {
          logoRef.current?.playLongOut();
          stateRef.current = "hidden";
        }
        const el = wrapperRef.current;
        if (el) el.style.pointerEvents = "none";
        return;
      }

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

      // Restore prior logo state — verzögert via Timer, damit ein potentielles
      // sofortiges Re-Open (Dev-StrictMode-Cleanup) den Timer wieder canceln
      // kann. priorState wird erst im Timer-Callback geleert.
      if (previewPriorStateRef.current !== null) {
        const prior = previewPriorStateRef.current;
        if (prior === "hidden") {
          previewPriorStateRef.current = null;
          return;
        }
        if (previewRestoreTimerRef.current) clearTimeout(previewRestoreTimerRef.current);
        previewRestoreTimerRef.current = window.setTimeout(() => {
          previewRestoreTimerRef.current = null;
          previewPriorStateRef.current = null;
          if (prior === "short-visible") {
            logoRef.current?.playShortIn();
            stateRef.current = "short-visible";
          } else if (prior === "long-visible") {
            logoRef.current?.playLongIn();
            stateRef.current = "long-visible";
          }
          const el = wrapperRef.current;
          if (el) el.style.pointerEvents = "auto";
        }, 320);
        return;
      }

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
    <>
      <div className="logo-bar-sticky" style={{ width: "100%", height: "50px", position: "sticky", top: "13px", zIndex: 62, marginTop: "-50px", pointerEvents: "none" }}>
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
      {/* Fixed-positionierter Target-Slot für SparkHeading-Flip-Dock.
          Bewusst position:fixed (nicht im Sticky-Wrapper) — Flip braucht zwei
          stabile Endpunkte, sticky-relative Positionen verschieben sich beim
          Scrollen und führen zu Snap-Sprüngen. */}
      <div
        id="ratgeber-flip-target"
        style={{
          position: "fixed",
          top: isMobile ? 35 : 32,
          left: isMobile ? 40 : 82,
          width: 220,
          height: 30,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          zIndex: 62,
        }}
      />
    </>
  );
}
