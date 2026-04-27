"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";
import { Flip } from "@/lib/gsapConfig";
import { scrollToBookmarkSticky } from "@/lib/scrollToBookmarkSticky";
import VersichererSelect from "@/components/ui/VersichererSelect";
import type { Versicherer } from "@/lib/versicherer";

const LEFT_EYE = { cx: 158.34, cy: 450.80 };
const RIGHT_EYE = { cx: 413.69, cy: 450.80 };
const PUPIL_RADIUS = 80;
const MAX_OFFSET = 23;
const COLOR = "#000000";

export default function MayaIcon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const tieRef = useRef<SVGSVGElement>(null);
  const leoGroupRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillTextRef = useRef<HTMLSpanElement>(null);
  const spikeRightRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const dockedInSlot = useRef(false);
  const morphTlRef = useRef<gsap.core.Timeline | null>(null);
  const chatOpenRef = useRef(false);
  const previousParentRef = useRef<HTMLElement | null>(null);
  const morphProgressBeforeChatRef = useRef(0);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [smooth, setSmooth] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const wasInWindow = useRef(true);
  const [docked, setDocked] = useState(false);
  const [selectedVersicherer, setSelectedVersicherer] = useState<Versicherer | null>(null);
  const isLanding = useRef(false);
  const hasUndocked = useRef(false);
  const pathname = usePathname();

  // Detect landing page + set initial home container + docked state.
  // Der Home-Container ist die "feste Ecke" (position:fixed bottom-right),
  // in der die Batch wohnt wenn sie nicht gerade in einem anderen Slot
  // (Search-Pill oder KI-Section) angedockt ist.
  // Re-runs bei Navigation (pathname-Änderung), damit Maya nach Page-Wechsel
  // wieder einen gültigen Parent hat — sonst hängt sie im DOM-Limbo wenn ein
  // page-spezifischer Slot (z.B. maya-dock-slot, maya-dock-slot-ai) entfernt wird.
  useEffect(() => {
    let home = document.getElementById("maya-floating-home");
    if (!home) {
      home = document.createElement("div");
      home.id = "maya-floating-home";
      Object.assign(home.style, {
        position: "fixed",
        bottom: "23px",
        right: "36px",
        width: "70px",
        height: "70px",
        zIndex: "100",
      });
      document.body.appendChild(home);
    }

    const el = containerRef.current;
    if (!el) return;

    // State zurücksetzen — falls vorherige Page Maya in Chat- oder Dock-Mode hatte
    dockedInSlot.current = false;
    if (chatOpenRef.current) {
      chatOpenRef.current = false;
      document.body.style.overflow = "";
      const backdrop = document.getElementById("maya-chat-backdrop");
      if (backdrop) backdrop.style.display = "none";
      const chatCenter = document.getElementById("maya-chat-center");
      if (chatCenter) chatCenter.style.pointerEvents = "none";
      window.dispatchEvent(new CustomEvent("menu-closed"));
    }
    gsap.killTweensOf(el);
    el.dataset.state = "default";
    el.style.position = "relative";
    el.style.top = "";
    el.style.left = "";
    el.style.width = "70px";
    el.style.height = "70px";
    gsap.set(el, { x: 0, y: 0, clearProps: "transform" });
    // Morph-TL auf Anfang zurück (falls auf voriger Page mid-play)
    if (morphTlRef.current && morphTlRef.current.progress() > 0) {
      morphTlRef.current.progress(0, false).pause();
    }

    isLanding.current = document.body.hasAttribute("data-landing");
    hasUndocked.current = false;

    if (isLanding.current && window.scrollY <= 5) {
      setDocked(true);
      const slot = document.getElementById("maya-dock-slot");
      if (slot) {
        slot.appendChild(el);
      } else {
        home.appendChild(el);
      }
    } else {
      hasUndocked.current = true;
      setDocked(false);
      home.appendChild(el);
    }
    el.style.visibility = "visible";
    // Versicherer-Auswahl bei Navigation zurücksetzen — neue Page = neuer Kontext
    setSelectedVersicherer(null);
  }, [pathname]);

  // Scroll listener: undock on first scroll
  useEffect(() => {
    if (!isLanding.current || hasUndocked.current) return;

    const handleScroll = () => {
      if (hasUndocked.current || !containerRef.current) return;
      if (window.scrollY > 5) {
        hasUndocked.current = true;

        const el = containerRef.current;
        const home = document.getElementById("maya-floating-home");
        if (!home) return;

        // Capture start position
        const startRect = el.getBoundingClientRect();
        const startX = startRect.left;
        const startY = startRect.top;

        // In Home reparenten (bleibt position:relative, Home managed Viewport-Pos)
        home.appendChild(el);

        // Capture end position (= Home's position = bottom-right)
        const endRect = el.getBoundingClientRect();
        const endX = endRect.left;
        const endY = endRect.top;

        const dx = startX - endX;
        const dy = startY - endY;

        gsap.set(el, { x: dx, y: dy });
        gsap.to(el, {
          duration: 0.6,
          ease: "power1.inOut",
          motionPath: {
            path: [
              { x: dx, y: dy },
              { x: dx * 0.5, y: dy + 100 },
              { x: 0, y: 0 },
            ],
            curviness: 1.5,
          },
          onComplete() {
            gsap.set(el, { clearProps: "x,y" });
          },
        });

        setDocked(false);
        window.dispatchEvent(new CustomEvent("maya-undocked"));

        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [docked]);

  // Pupil tracking
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!wasInWindow.current) {
        wasInWindow.current = true;
        setSmooth(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setSmooth(false)));
      }
      if (!headRef.current) return;
      const rect = headRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      const clamp = Math.min(dist, 400) / 400;
      setPupilOffset({
        x: (dx / dist) * MAX_OFFSET * clamp,
        y: (dy / dist) * MAX_OFFSET * clamp,
      });
    }

    function handleMouseLeave() {
      wasInWindow.current = false;
      setSmooth(true);
      setPupilOffset({ x: 0, y: 0 });
    }

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Morph: Leo-Badge → KI-Agent-Button beim Scroll in AIAgentTeaser
  useEffect(() => {
    const container = containerRef.current;
    const tie = tieRef.current;
    const leoGroup = leoGroupRef.current;
    const pill = pillRef.current;
    const pillText = pillTextRef.current;
    const spikeRight = spikeRightRef.current;
    if (!container || !tie || !leoGroup || !pill || !pillText || !spikeRight) return;

    const teaser = document.querySelector<HTMLElement>(".ai-agent-teaser");
    if (!teaser) return;

    const badge = badgeRef.current;
    if (!badge) return;

    const ctx = gsap.context(() => {
      // Morph-TL: nur die "Leo-Transform"-Bewegungen. bg/shadow/spike laufen
      // via CSS (data-state) und sind dadurch unabhängig vom Morph-Play-State.
      const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
      morphTlRef.current = tl;

      tl.to(container, { scale: 1.25, duration: 0.28, ease: "power2.out" }, 0);
      tl.to(leoGroup, { scale: 1 / 1.25, duration: 0.28, ease: "power2.out" }, 0);
      tl.to(badge, { borderRadius: "27px", duration: 0.32, ease: "power2.inOut" }, 0);
      tl.to(tie, {
        scaleX: 1.25,
        scaleY: 0.3,
        transformOrigin: "50% 0%",
        opacity: 0,
        duration: 0.32,
      }, 0);
      tl.to(leoGroup, { y: 80, duration: 0.38, ease: "power2.in" }, 0);
      tl.to(pill, { scale: 1, duration: 0.32, ease: "back.out(1.8)" }, 0.28);
      tl.to(container, { scale: 1, duration: 0.36, ease: "power2.inOut" }, 0.28);
      tl.to(leoGroup, { scale: 1, duration: 0.36, ease: "power2.inOut" }, 0.28);
      tl.to(pillText, { opacity: 1, duration: 0.22 }, 0.42);

      ScrollTrigger.create({
        trigger: teaser,
        start: "top bottom-=60",
        onEnter: () => {
          // Nur in "default"-State zu "morphed" wechseln — nicht überschreiben
          // wenn User gerade im Chat ist.
          if (container.dataset.state !== "chat") {
            container.dataset.state = "morphed";
          }
          morphTlRef.current?.play();
        },
        onLeaveBack: () => {
          if (container.dataset.state !== "chat") {
            container.dataset.state = "default";
          }
          morphTlRef.current?.reverse();
        },
      });
    }, container);

    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") {
      requestAnimationFrame(onLoad);
    } else {
      window.addEventListener("load", onLoad);
    }
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 300);
    // Zweiter Refresh nach 1.2s — fängt späte Bild-/Font-Loads auf Artikelseiten
    // ab, sonst trigger-Position aus stale Layout (morph feuert zu früh).
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 1200);

    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(t1);
      clearTimeout(t2);
      ctx.revert();
      morphTlRef.current = null;
    };
  }, [pathname]);

  // Dock: MayaIcon flippt in den reservierten Slot unter den Bubbles und
  // expandiert zum Chat-Eingabefeld. Reversibel beim Zurückscrollen.
  useEffect(() => {
    const container = containerRef.current;
    const badge = badgeRef.current;
    const input = inputRef.current;
    if (!container || !badge || !input) return;

    const slot = document.getElementById("maya-dock-slot-ai");
    if (!slot) return;

    let trigger: ScrollTrigger | null = null;

    // Morph-Timeline auf Ende zwingen falls sie gerade mid-play ist —
    // so kollidieren die Transforms nicht mit dem Flip.
    const forceMorphDone = () => {
      const tl = morphTlRef.current;
      if (tl && tl.progress() < 1) tl.progress(1, false);
    };

    // DOCK: Flip zwischen Home und Slot (beide sind positionierte Container).
    const dockIntoSlot = () => {
      if (dockedInSlot.current) return;
      dockedInSlot.current = true;

      forceMorphDone();
      gsap.killTweensOf(container);
      gsap.killTweensOf(input);

      const state = Flip.getState(container, { props: "width,height" });

      slot.appendChild(container);
      container.style.width = "410px";
      container.style.height = "70px";

      Flip.from(state, {
        duration: 0.75,
        ease: "power3.inOut",
        absolute: true,
        onComplete: () => {
          gsap.to(input, { opacity: 1, duration: 0.3, ease: "power2.out" });
          input.style.pointerEvents = "auto";
        },
      });
    };

    // UNDOCK: Flip zurück vom Slot in den Home-Container.
    const undockFromSlot = () => {
      if (!dockedInSlot.current) return;
      dockedInSlot.current = false;

      forceMorphDone();
      gsap.killTweensOf(container);
      gsap.killTweensOf(input);

      gsap.to(input, { opacity: 0, duration: 0.15, ease: "power2.out" });
      input.style.pointerEvents = "none";

      const home = document.getElementById("maya-floating-home");
      if (!home) return;

      const state = Flip.getState(container, { props: "width,height" });

      home.appendChild(container);
      container.style.width = "70px";
      container.style.height = "70px";

      Flip.from(state, {
        duration: 0.6,
        ease: "power3.inOut",
        absolute: true,
      });
    };

    trigger = ScrollTrigger.create({
      trigger: slot,
      start: "bottom bottom-=20",
      onEnter: dockIntoSlot,
      onLeaveBack: undockFromSlot,
    });

    // ScrollTrigger.refresh nach Navigation, damit der Trigger korrekte
    // Positionen für die neue Page bekommt (sonst feuert er evtl. zu früh
    // weil Layout-Höhen aus voriger Page gecached sind).
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      trigger?.kill();
      clearTimeout(refreshTimer);
    };
  }, [pathname]);

  // Chat-Modus: Klick auf Leo → Flip zur Viewport-Mitte + Content-Blur
  useEffect(() => {
    const container = containerRef.current;
    const spikeRight = spikeRightRef.current;
    const input = inputRef.current;
    if (!container || !spikeRight || !input) return;

    // Chat-Center Container (permanent, zentriert im Viewport, 560×140)
    let chatCenter = document.getElementById("maya-chat-center");
    if (!chatCenter) {
      chatCenter = document.createElement("div");
      chatCenter.id = "maya-chat-center";
      Object.assign(chatCenter.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "560px",
        height: "140px",
        zIndex: "200",
        pointerEvents: "none",
      });
      document.body.appendChild(chatCenter);
    }

    // Backdrop für Klick-zu-schließen (unter chat-center, über allem anderen)
    let backdrop = document.getElementById("maya-chat-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "maya-chat-backdrop";
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        zIndex: "150",
        background: "transparent",
        display: "none",
        cursor: "pointer",
      });
      document.body.appendChild(backdrop);
    }

    const backdropEl = backdrop;
    const chatCenterEl = chatCenter;

    const openChat = () => {
      if (chatOpenRef.current) return;
      chatOpenRef.current = true;

      // Legacy landing-undock MotionPath blockieren. Sonst feuert der Scroll-Handler
      // aus dem ersten useEffect beim scrollToBookmarkSticky()-Call (scrollY > 5) und
      // startet eine zweite, konkurrierende Flip/MotionPath-Animation auf dem Container.
      const wasLandingDocked = isLanding.current && !hasUndocked.current;
      hasUndocked.current = true;

      // Wenn vom Landing-Page-Top geklickt wurde: LandingIntro soll die search-pill
      // auf volle Breite expanden und die Sprechblase ausfaden (wie bei normalem Scroll).
      if (wasLandingDocked) {
        window.dispatchEvent(new CustomEvent("maya-undocked"));
      }

      const morphTl = morphTlRef.current;
      morphProgressBeforeChatRef.current = morphTl ? morphTl.progress() : 0;
      previousParentRef.current = container.parentElement;

      // Scroll zum Sticky-Punkt falls Bookmark noch nicht sticky (wie Finanztools-Button)
      scrollToBookmarkSticky();

      // data-state auf "chat" → CSS übernimmt bg/shadow/spike via Transitions
      container.dataset.state = "chat";

      // Flip-State capturen (Original-Position in search-pill / home / dock-slot)
      // Dann reparent + resize SOFORT — Maya raus aus allen blur-baren Ancestors
      // damit ContentScaler ihr nichts anhaben kann.
      const state = Flip.getState(container, { props: "width,height" });
      chatCenterEl.appendChild(container);
      container.style.width = "560px";
      container.style.height = "140px";

      // Erst JETZT menu-opened → Maya ist bereits body-child
      document.body.style.overflow = "hidden";
      backdropEl.style.display = "block";
      backdropEl.addEventListener("click", closeChat);
      chatCenterEl.style.pointerEvents = "auto";
      window.dispatchEvent(new CustomEvent("menu-opened", { detail: { extended: true } }));

      // Morph-TL (falls state A) parallel zur Flip-Expand — kein Konflikt weil
      // die TL nur scale/leoGroup/tie/pill/radius tweent, Flip nur width/height/pos.
      if (morphTl && morphTl.progress() < 1) {
        morphTl.play();
      }
      Flip.from(state, {
        duration: 0.75,
        ease: "power3.inOut",
        absolute: true,
        onComplete: () => {
          gsap.to(input, { opacity: 1, duration: 0.3, ease: "power2.out" });
          input.style.pointerEvents = "auto";
        },
      });
    };

    const closeChat = () => {
      if (!chatOpenRef.current) return;
      chatOpenRef.current = false;

      let prev = previousParentRef.current;
      if (!prev) return;

      // Wenn User inzwischen gescrollt hat (z.B. durch scrollToBookmarkSticky beim Open),
      // ist der search-pill-slot collapsed (width 0). In dem Fall statt dessen zu home zurück.
      if (prev.id === "maya-dock-slot" && window.scrollY > 5) {
        const home = document.getElementById("maya-floating-home");
        if (home) prev = home;
      }

      const prevIsDockSlot = prev.id === "maya-dock-slot-ai";
      const targetWidth = prevIsDockSlot ? 410 : 70;
      const targetHeight = 70;

      // Un-blur anstoßen (ContentScaler) + Backdrop weg
      backdropEl.removeEventListener("click", closeChat);
      backdropEl.style.display = "none";
      chatCenterEl.style.pointerEvents = "none";
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("menu-closed"));

      // data-state zurücksetzen — CSS fadet bg/shadow/spike automatisch
      container.dataset.state = prevIsDockSlot ? "morphed" : "default";

      // Input ausfaden falls Ziel ≠ Dock-Slot
      if (!prevIsDockSlot) {
        gsap.to(input, { opacity: 0, duration: 0.2, ease: "power2.out" });
        input.style.pointerEvents = "none";
      }

      // Target viewport rect berechnen. Wenn prev in einem skalierten Ancestor liegt
      // (.scalable-landing oder [data-scale-extended] sind aktuell bei scale 0.95 vom
      // Content-Scaler), müssen wir die UNscaled-Rect berechnen — sonst landet Maya
      // am falschen Platz und springt beim Reparent (un-blur → scale zurück auf 1).
      const rawRect = prev.getBoundingClientRect();
      // .scalable-content ist der Fallback-Scaler auf Nicht-Landing-Pages
      // (Artikelseiten). Ohne ihn hier wäre die Unscale-Math nur auf Landing
      // korrekt → springender Reparent-Snap auf Artikelseiten.
      const insideScaled = prev.closest(
        ".scalable-landing, [data-scale-extended], .scalable-content"
      );
      const targetRect = (() => {
        if (!insideScaled) return { left: rawRect.left, top: rawRect.top };
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const scale = 0.95; // ContentScaler's scale factor
        return {
          left: cx + (rawRect.left - cx) / scale,
          top: cy + (rawRect.top - cy) / scale,
        };
      })();

      const chatCenterRect = chatCenterEl.getBoundingClientRect();
      const deltaX = targetRect.left - chatCenterRect.left;
      const deltaY = targetRect.top - chatCenterRect.top;

      // Laufende Tweens auf container killen (Flip-Leftovers etc.)
      gsap.killTweensOf(container);

      // Maya auf position:absolute 0,0 innerhalb chat-center, explizite Start-Werte
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      gsap.set(container, { x: 0, y: 0 });

      // Manuelle Animation: Maya BLEIBT in chat-center während der gesamten Close-Anim,
      // damit sie nicht in einen (noch) geblurrten Ancestor reparented wird.
      gsap.to(container, {
        x: deltaX,
        y: deltaY,
        width: targetWidth,
        height: targetHeight,
        duration: 0.55,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          // Un-blur ist nun durch (0.5s) → sicher reparenten
          prev.appendChild(container);
          container.style.position = "relative";
          container.style.top = "";
          container.style.left = "";
          container.style.width = `${targetWidth}px`;
          container.style.height = `${targetHeight}px`;
          gsap.set(container, { x: 0, y: 0, clearProps: "transform" });

          // Morph-TL rückwärts wenn Ziel = state A (home oder search-pill)
          const morphTl = morphTlRef.current;
          if (morphTl && !prevIsDockSlot && morphProgressBeforeChatRef.current < 1) {
            morphTl.reverse();
          }
        },
      });
    };

    const handleContainerClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (chatOpenRef.current) return;
      openChat();
    };
    container.addEventListener("click", handleContainerClick);

    return () => {
      container.removeEventListener("click", handleContainerClick);
      backdropEl.removeEventListener("click", closeChat);
    };
  }, []);

  const size = 70;

  return (
    <div
      ref={containerRef}
      data-flip-id="maya"
      data-state="default"
      className="maya-batch-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width: size,
        height: size,
        cursor: "pointer",
      }}
    >
      <svg
        ref={tieRef}
        viewBox="0 0 136.46 313.85"
        style={{
          position: "absolute",
          bottom: -9,
          left: "50%",
          transform: "translateX(-50%)",
          width: 12,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <path
          d="M80.02,82.29l20.97-34.49L70.63,0l-33.16,48.08,19.65,30.78C38.54,123.63,2.23,211.44.09,218.98c-2.88,10.16,67.79,94.87,67.79,94.87l68.58-95.23-56.44-136.33Z"
          fill="#ff1d7b"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          right: "-5.5px",
          bottom: "-0.24px",
          width: "19.142px",
          height: "23.244px",
          transform: "scaleX(-1)",
          pointerEvents: "none",
        }}
      >
        <svg
          ref={spikeRightRef}
          className="maya-spike-img"
          viewBox="0 0 20 24"
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        >
          <path
            d="M17 17C10.2 24.2 3.83333 23.9346 0 22.268C2.04406 22.268 4.0144 20.5274 5 18.5C6.1185 16.1992 6 12.4237 6 9.5V0C12.8333 3 23.8 9.8 17 17Z"
            fill="#E9FFDE"
          />
        </svg>
      </div>

      <div
        ref={badgeRef}
        className="maya-badge"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          backdropFilter: "brightness(1.3) blur(13px)",
          WebkitBackdropFilter: "brightness(1.3) blur(13px)",
          overflow: "hidden",
        }}
      >
        <div
          ref={leoGroupRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <div ref={headRef} style={{ position: "relative", display: "flex", alignItems: "flex-end" }}>
            <svg viewBox="0 0 564.09 533.81" style={{ width: 44 }}>
              <path
                d="M279.08,181.17C-49.69,181.17,3.12,533.81,3.12,533.81l85.65-2.08c-22.75-19.57-37.16-48.57-37.16-80.93,0-58.94,47.78-106.73,106.73-106.73s106.73,47.78,106.73,106.73c0,30.5-12.8,58.02-33.32,77.47l105.91-2.57c-18.98-19.27-30.7-45.71-30.7-74.9,0-58.94,47.78-106.73,106.73-106.73s106.73,47.78,106.73,106.73c0,27.32-10.27,52.24-27.16,71.12l68.62-1.66s45.95-339.08-282.82-339.08Z"
                fill={COLOR}
              />
              <path
                d="M279.92,214.41c-5.25-39.35-14.6-77.6-27.65-113.12,20.17-6.05,61.44-8.32,61.44-8.32,0,0-47.54-40.18-71.32-60.27,17.49-6.44,32.99-16.88,50.48-23.32"
                fill="none"
                stroke={COLOR}
                strokeMiterlimit={10}
                strokeWidth={30}
              />
            </svg>
            <svg
              viewBox="0 0 564.09 533.81"
              style={{ position: "absolute", top: 0, left: 0, width: 44, height: "100%", pointerEvents: "none", overflow: "visible" }}
            >
              <circle cx={LEFT_EYE.cx + pupilOffset.x} cy={LEFT_EYE.cy + pupilOffset.y} r={isHovered ? PUPIL_RADIUS * 0.6 : PUPIL_RADIUS} fill={COLOR} style={{ transition: `r 0.25s ease${smooth ? ", cx 0.3s ease, cy 0.3s ease" : ""}` }} />
              <circle cx={RIGHT_EYE.cx + pupilOffset.x} cy={RIGHT_EYE.cy + pupilOffset.y} r={isHovered ? PUPIL_RADIUS * 0.6 : PUPIL_RADIUS} fill={COLOR} style={{ transition: `r 0.25s ease${smooth ? ", cx 0.3s ease, cy 0.3s ease" : ""}` }} />
            </svg>
          </div>
          <div>
            <svg viewBox="0 0 604.6 469.6" style={{ width: 46, display: "block", marginBottom: -13 }}>
              <polygon
                points="2 479.1 76.8 0 171.7 157.9 297.7 8.1 432.7 155.2 534.2 0 605 483.6 2 479.1"
                fill={COLOR}
              />
            </svg>
          </div>
        </div>

        <div
          ref={inputRef}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 70,
            padding: "24px 23px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <input
            type="text"
            placeholder="Sende Leo eine Nachricht ..."
            size={29}
            className="maya-chat-input"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              padding: 0,
              margin: 0,
              fontFamily: "var(--font-body)",
              fontSize: "17px",
              lineHeight: 1.3,
              color: "#636A5F",
              width: "auto",
            }}
          />

          <div
            className="maya-versicherer-slot"
            style={{
              marginTop: "auto",
              alignSelf: "flex-end",
              marginRight: -60,
              paddingBottom: 4,
              pointerEvents: "auto",
              position: "relative",
              zIndex: 50,
            }}
          >
            <VersichererSelect
              value={selectedVersicherer}
              onChange={setSelectedVersicherer}
            />
          </div>
        </div>
        <style>{`
          .maya-chat-input::placeholder {
            color: #636A5F;
            opacity: 1;
          }
        `}</style>

        <div
          ref={pillRef}
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 60,
            height: 60,
            borderRadius: "22px",
            background: "var(--color-brand-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "scale(0)",
            pointerEvents: "none",
          }}
        >
          <span
            ref={pillTextRef}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              lineHeight: 1,
              color: "#fff",
              textAlign: "center",
              opacity: 0,
              marginBottom: "4px",
            }}
          >
            <span style={{ fontWeight: 700, color: "#fff" }}>KI</span>
            <br />
            <span style={{ fontWeight: 400, color: "#fff" }}>Agent</span>
          </span>
        </div>
      </div>

      <style>{`
        .maya-batch-container .maya-badge {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.05);
          transition: background 0.35s ease, box-shadow 0.35s ease;
        }
        .maya-batch-container[data-state="morphed"] .maya-badge {
          background: #E9FFDE;
          box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0);
        }
        .maya-batch-container[data-state="chat"] .maya-badge {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.05);
        }

        /* Versicherer-Trigger nur im echten Chat-Modus zeigen,
           nicht im morphed-State (KI-Section-Pille) */
        .maya-batch-container .maya-versicherer-slot {
          display: none;
        }
        .maya-batch-container[data-state="chat"] .maya-versicherer-slot {
          display: block;
        }

        .maya-batch-container .maya-spike-img {
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .maya-batch-container[data-state="morphed"] .maya-spike-img {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
    </div>
  );
}
