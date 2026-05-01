"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";
import { Flip } from "@/lib/gsapConfig";
import { scrollToBookmarkSticky } from "@/lib/scrollToBookmarkSticky";
import VersichererSelect from "@/components/ui/VersichererSelect";
import LeoCharacter from "@/components/ui/LeoCharacter";
import type { Versicherer } from "@/lib/versicherer";

const LEO_SIZE_DESKTOP = 70;
const LEO_SIZE_MOBILE = 64;
const BUBBLE_H = 80;            // Höhe der AI-Section-Sprechblase (matched ChatBubble single-line)
// Höhe der Eingabe-Pille im Chat-Overlay = 100 px (siehe #leo-chat-pill-slot in components.css)
const isMobileMQ = "(max-width: 767px)";
const checkMobile = () =>
  typeof window !== "undefined" && window.matchMedia(isMobileMQ).matches;

export default function LeoIcon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const tieRef = useRef<SVGSVGElement>(null);
  const leoGroupRef = useRef<HTMLDivElement>(null);
  const spikeRightRef = useRef<SVGSVGElement>(null);
  const arrowBtnRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const chatInputElRef = useRef<HTMLInputElement>(null);    // <input> für mobile auto-focus
  const chatCenterRef = useRef<HTMLDivElement>(null);       // statischer Chat-Overlay-Container (in JSX)
  const pillSlotRef = useRef<HTMLDivElement>(null);         // statischer Pill-Slot (Flip-Target)
  const iconwrapRef = useRef<HTMLDivElement>(null);         // Icon-Leo + Greeting Wrapper
  const dockedInSlot = useRef(false);
  const chatOpenRef = useRef(false);
  const previousParentRef = useRef<HTMLElement | null>(null);
  const [docked, setDocked] = useState(false);
  const [selectedVersicherer, setSelectedVersicherer] = useState<Versicherer | null>(null);
  const isLanding = useRef(false);
  const hasUndocked = useRef(false);
  const isAtHomeRef = useRef(false); // Mobile: Leo aktuell unten-rechts (true) oder im Sticky-Slot (false)?
  const [size, setSize] = useState(LEO_SIZE_DESKTOP);
  const pathname = usePathname();

  // Reactive viewport-size (mobile = 64, desktop = 70). Updated on matchMedia change.
  useEffect(() => {
    const mq = window.matchMedia(isMobileMQ);
    const update = () => setSize(mq.matches ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Detect landing page + set initial home container + docked state.
  // Der Home-Container ist die "feste Ecke" (position:fixed bottom-right),
  // in der die Batch wohnt wenn sie nicht gerade in einem anderen Slot
  // (Search-Pill oder KI-Section) angedockt ist.
  // Re-runs bei Navigation (pathname-Änderung), damit Leo nach Page-Wechsel
  // wieder einen gültigen Parent hat — sonst hängt sie im DOM-Limbo wenn ein
  // page-spezifischer Slot (z.B. leo-dock-slot, leo-dock-slot-ai) entfernt wird.
  useEffect(() => {
    let home = document.getElementById("leo-floating-home");
    if (!home) {
      home = document.createElement("div");
      home.id = "leo-floating-home";
      const homeSize = checkMobile() ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP;
      Object.assign(home.style, {
        position: "fixed",
        bottom: "23px",
        right: "36px",
        width: `${homeSize}px`,
        height: `${homeSize}px`,
        zIndex: "100",
      });
      document.body.appendChild(home);
    } else {
      // Existing home — Maße aktualisieren falls Mobile/Desktop gewechselt
      const homeSize = checkMobile() ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP;
      home.style.width = `${homeSize}px`;
      home.style.height = `${homeSize}px`;
    }

    const el = containerRef.current;
    if (!el) return;

    // State zurücksetzen — falls vorherige Page Leo in Chat- oder Dock-Mode hatte
    dockedInSlot.current = false;
    if (chatOpenRef.current) {
      chatOpenRef.current = false;
      document.body.style.overflow = "";
      const backdrop = document.getElementById("leo-chat-backdrop");
      if (backdrop) backdrop.style.display = "none";
      const chatCenter = document.getElementById("leo-chat-center");
      if (chatCenter) chatCenter.style.pointerEvents = "none";
      window.dispatchEvent(new CustomEvent("menu-closed"));
    }
    gsap.killTweensOf(el);
    el.dataset.state = "default";
    el.style.position = "relative";
    el.style.top = "";
    el.style.left = "";
    const elSize = checkMobile() ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP;
    el.style.width = `${elSize}px`;
    el.style.height = `${elSize}px`;
    gsap.set(el, { x: 0, y: 0, clearProps: "transform" });

    isLanding.current = document.body.hasAttribute("data-landing");
    hasUndocked.current = false;
    isAtHomeRef.current = false;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isLanding.current && isMobile) {
      // Mobile: Leo lebt im sticky-top-left Slot — bis der Revolver-Slider
      // mind. 100px vom unteren Bildrand entfernt nach oben gewandert ist
      // (= Slider-Bottom ≥ 100px überm Viewport-Bottom).
      const buttons = document.querySelector<HTMLElement>("[data-revolver-buttons]");
      const initiallyFarFromBottom = buttons
        ? window.innerHeight - buttons.getBoundingClientRect().bottom >= 100
        : false;
      const slot = document.getElementById("leo-dock-slot-mobile");
      if (initiallyFarFromBottom || !slot) {
        isAtHomeRef.current = true;
        setDocked(false);
        home.appendChild(el);
      } else {
        setDocked(true);
        slot.appendChild(el);
      }
    } else if (isLanding.current && window.scrollY <= 5) {
      // Desktop: dock nur am Page-Top in den Search-Pill-Slot
      setDocked(true);
      const slot = document.getElementById("leo-dock-slot");
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

  // Scroll listener: Mobile = Revolver-Trigger (Swap mit Logo), Desktop = First-Scroll-Undock
  useEffect(() => {
    if (!isLanding.current) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      // Mobile: getriggert wenn Revolver-Slider mind. 100px vom unteren
      // Bildrand entfernt nach oben gewandert ist (= rect.bottom + 100 ≤ vh).
      // Hinflug = MotionPath (wie Desktop), Rückflug = Collapse-Animation
      // (Badge width/height → 0 zur Mitte, leoGroup taucht vorher ab,
      //  tie skaliert wie im KI-Button-Morph).

      // OUT: Container scaled von 1 → 0 zur Mitte (wie Morph mit container.scale,
      //      kein layout-thrashing). leoGroup taucht etwas vorher nach unten ab,
      //      tie kollabiert wie im KI-Button-Morph.
      // IN: rückwärts mit back.out für sanften Pop.
      const collapseSwap = (target: HTMLElement, onAtTarget?: () => void) => {
        const el = containerRef.current;
        const leoGroup = leoGroupRef.current;
        const tie = tieRef.current;
        if (!el || !leoGroup || !tie) return;

        gsap.killTweensOf([el, leoGroup, tie]);

        const outTl = gsap.timeline({
          onComplete: () => {
            target.appendChild(el);
            onAtTarget?.();

            const inTl = gsap.timeline({
              onComplete: () => {
                // React-JSX-Originalwerte sicherstellen, damit nachfolgender
                // KI-Button-Morph (der container.scale 1.25 + tie scaleX/Y +
                // leoGroup y:80 selbst animiert) sauber von der Default-Lage
                // starten kann.
                gsap.set(el, { scale: 1, transformOrigin: "50% 50%" });
                gsap.set(tie, { scale: 1, opacity: 1, transformOrigin: "50% 50%" });
                gsap.set(leoGroup, { y: 0 });
              },
            });
            // Container expandiert zuerst — back.out für sanften Pop
            inTl.fromTo(el,
              { scale: 0, transformOrigin: "50% 50%" },
              { scale: 1, duration: 0.4, ease: "back.out(1.6)", transformOrigin: "50% 50%" },
              0
            );
            // Tie kommt zurück — uniform scale (gleichförmig zur Mitte)
            inTl.fromTo(tie,
              { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
              { scale: 1, opacity: 1,
                duration: 0.32, ease: "power2.out" },
              0.08
            );
            // Leo taucht aus dem Boden auf (etwas nach Container)
            inTl.fromTo(leoGroup,
              { y: 60 },
              { y: 0, duration: 0.4, ease: "back.out(1.4)" },
              0.1
            );
          },
        });

        // leoGroup taucht zuerst ab (etwas vor dem Container-Collapse)
        outTl.to(leoGroup, { y: 60, duration: 0.32, ease: "power2.in" }, 0);
        // Tie kollabiert uniform (gleichförmig auf 0 zur Mitte) — keine Quetschung mehr
        outTl.to(tie, {
          scale: 0, opacity: 0,
          transformOrigin: "50% 50%",
          duration: 0.3, ease: "power2.in",
        }, 0.05);
        // Container schrumpft zur Mitte (analog zum Morph, nur in die andere Richtung)
        outTl.to(el, {
          scale: 0, transformOrigin: "50% 50%",
          duration: 0.32, ease: "power2.in",
        }, 0.1);
      };

      // Hinflug: MotionPath wie Desktop (der „flip")
      const flyTo = (target: HTMLElement, onComplete?: () => void) => {
        const el = containerRef.current;
        if (!el) return;
        gsap.killTweensOf(el);

        const startRect = el.getBoundingClientRect();
        const startX = startRect.left;
        const startY = startRect.top;
        target.appendChild(el);
        const endRect = el.getBoundingClientRect();
        const dx = startX - endRect.left;
        const dy = startY - endRect.top;

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
            onComplete?.();
          },
        });
      };

      const onScroll = () => {
        const buttons = document.querySelector<HTMLElement>("[data-revolver-buttons]");
        const home = document.getElementById("leo-floating-home");
        const slot = document.getElementById("leo-dock-slot-mobile");
        if (!buttons || !home || !slot) return;

        const dist = window.innerHeight - buttons.getBoundingClientRect().bottom;
        const farFromBottom = dist >= 100;

        if (farFromBottom && !isAtHomeRef.current) {
          // → MotionPath-Flug zur Home-Ecke, danach Logo-shortIn
          isAtHomeRef.current = true;
          setDocked(false);
          flyTo(home, () => {
            window.dispatchEvent(new CustomEvent("leo-flew-home"));
          });
        } else if (!farFromBottom && isAtHomeRef.current) {
          // → Logo-shortOut signalisieren (parallel), Leo kollabiert,
          //    Reparent in Slot, expandiert wieder
          isAtHomeRef.current = false;
          window.dispatchEvent(new CustomEvent("revolver-far-from-bottom"));
          collapseSwap(slot, () => {
            setDocked(true);
          });
        }
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Desktop: erster Scroll → MotionPath-Flug zurück zur Home-Ecke
    if (hasUndocked.current) return;

    const handleScroll = () => {
      if (hasUndocked.current || !containerRef.current) return;
      if (window.scrollY > 5) {
        hasUndocked.current = true;

        const el = containerRef.current;
        const home = document.getElementById("leo-floating-home");
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
        window.dispatchEvent(new CustomEvent("leo-undocked"));

        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [docked]);

  // (Pupil-Tracking + Hover-Effekt sind in <LeoCharacter trackPupils={...} />
  //  selbst gekapselt — wird mit !checkMobile() aktiviert.)

  // (Alter Morph zur „KI-Agent"-Pille entfernt — wird durch Morph 1
  //  „Leo → Bubble-mit-Spike" in der Dock-Slot-Effect ersetzt.)

  // Dock: LeoIcon flippt in den reservierten Slot unter den Bubbles und
  // expandiert zum Chat-Eingabefeld. Reversibel beim Zurückscrollen.
  useEffect(() => {
    const container = containerRef.current;
    const badge = badgeRef.current;
    const input = inputRef.current;
    if (!container || !badge || !input) return;

    const slot = document.getElementById("leo-dock-slot-ai");
    if (!slot) return;

    const tie = tieRef.current;
    const leoGroup = leoGroupRef.current;
    const arrowBtn = arrowBtnRef.current;
    const spike = spikeRightRef.current;
    if (!tie || !leoGroup || !arrowBtn || !spike) return;

    let trigger: ScrollTrigger | null = null;

    // MORPH 1: alle Animationen PARALLEL (Pulse + Expand gleichzeitig).
    //  - leoGroup taucht ab, tie kollabiert uniform
    //  - container pulst (scale 1→1.25→1)
    //  - arrowBtn pulst von 0→1
    //  - Flip: Container reparenten zum Slot, Width/Height animieren
    //  - badge borderRadius von 50% (rund) → bubbleH/2 (Stadium-Shape)
    //  - Spike fährt aus (CSS via data-state="morphed")
    const dockIntoSlot = () => {
      if (dockedInSlot.current) return;
      dockedInSlot.current = true;

      gsap.killTweensOf([container, input, tie, leoGroup, arrowBtn, badge, spike]);
      container.dataset.state = "morphed"; // CSS triggert Bubble-Bg-Übergang

      const bubbleH = BUBBLE_H;
      const bubbleW = checkMobile()
        ? slot.offsetWidth || window.innerWidth
        : 410;

      // Flip-Reparent SOFORT (parallel zum Pulse). Nimmt width/height-Snapshot.
      const state = Flip.getState(container, { props: "width,height" });
      slot.appendChild(container);
      container.style.width = `${bubbleW}px`;
      container.style.height = `${bubbleH}px`;
      Flip.from(state, {
        duration: 0.6,
        ease: "power3.inOut",
        absolute: true,
      });

      // Pulse-Animationen + borderRadius parallel zum Flip
      const tl = gsap.timeline();
      tl.to(leoGroup, { y: 80, duration: 0.38, ease: "power2.in" }, 0);
      tl.to(tie, {
        scale: 0, opacity: 0, transformOrigin: "50% 50%",
        duration: 0.32, ease: "power2.in",
      }, 0);
      tl.to(container, { scale: 1.15, duration: 0.28, ease: "power2.out" }, 0);
      tl.to(container, { scale: 1, duration: 0.36, ease: "power2.inOut" }, 0.28);
      tl.to(badge, {
        borderRadius: "27px",   // matched mit ChatBubble
        duration: 0.5,
        ease: "power2.inOut",
      }, 0);
      tl.to(arrowBtn, { scale: 1, duration: 0.32, ease: "back.out(1.8)" }, 0.28);
      // Spike fährt aus der unteren-linken Ecke aus (nur Scale, keine Opacity)
      tl.to(spike, {
        scale: 1, transformOrigin: "0% 0%",
        duration: 0.4, ease: "back.out(1.6)",
      }, 0.18);

      // Input-Feld in der Bubble einblenden (mit Placeholder-Text)
      input.style.pointerEvents = "auto";
      tl.to(input, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.35);
    };

    const undockFromSlot = () => {
      if (!dockedInSlot.current) return;
      dockedInSlot.current = false;

      gsap.killTweensOf([container, input, tie, leoGroup, arrowBtn, badge, spike]);
      container.dataset.state = "default";

      // Input zuerst ausfaden (parallel zum Bubble-Schrumpfen, schneller fertig)
      input.style.pointerEvents = "none";
      gsap.to(input, { opacity: 0, duration: 0.2, ease: "power2.in" });

      const home = document.getElementById("leo-floating-home");
      if (!home) return;

      const homeS = checkMobile() ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP;

      // Flip zurück + Pulse-Reverse + borderRadius zurück — alles parallel
      const state = Flip.getState(container, { props: "width,height" });
      home.appendChild(container);
      container.style.width = `${homeS}px`;
      container.style.height = `${homeS}px`;
      Flip.from(state, {
        duration: 0.55,
        ease: "power3.inOut",
        absolute: true,
      });

      const back = gsap.timeline();
      back.to(arrowBtn, { scale: 0, duration: 0.25, ease: "power2.in" }, 0);
      back.to(spike, {
        scale: 0, transformOrigin: "0% 0%",
        duration: 0.3, ease: "power2.in",
      }, 0);
      back.to(badge, { borderRadius: "35px", duration: 0.45, ease: "power2.inOut" }, 0);
      back.to(tie, {
        scale: 1, opacity: 1, transformOrigin: "50% 50%",
        duration: 0.32, ease: "power2.out",
      }, 0.1);
      back.to(leoGroup, { y: 0, duration: 0.4, ease: "back.out(1.2)" }, 0.15);
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

    // chat-center, pill-slot, iconwrap sind STATISCH in JSX gerendert
    // (siehe Render-Block) — Refs greifen auf die Elemente. So ist das
    // Flip-Target-Layout STABIL bevor openChat fired (kein DOM-Mutation
    // während der Animation = kein Sprung).
    const chatCenterEl = chatCenterRef.current;
    const pillSlotEl = pillSlotRef.current;
    const iconwrapEl = iconwrapRef.current;
    if (!chatCenterEl || !pillSlotEl || !iconwrapEl) return;

    // Backdrop bleibt dynamisch (nur Click-Layer, nicht Flip-Target)
    let backdrop = document.getElementById("leo-chat-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "leo-chat-backdrop";
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

    const openChat = () => {
      if (chatOpenRef.current) return;
      chatOpenRef.current = true;

      const tie = tieRef.current;
      const leoGroup = leoGroupRef.current;
      const arrowBtn = arrowBtnRef.current;
      const badge = badgeRef.current;
      const spike = spikeRightRef.current;

      // Wenn Leo aktuell noch im "default"-State (Mini-Badge ohne Pulse-Morph),
      // muss zuerst die Pulse-Choreographie laufen (sonst kein Pfeil-Button,
      // kein Abtauchen, etc.). Im "morphed"-State (bereits Bubble) entfällt das.
      const wasDefault = container.dataset.state === "default";
      const wasMorphed = container.dataset.state === "morphed";

      const wasLandingDocked = isLanding.current && !hasUndocked.current;
      hasUndocked.current = true;
      if (wasLandingDocked) {
        window.dispatchEvent(new CustomEvent("leo-undocked"));
      }

      previousParentRef.current = container.parentElement;
      scrollToBookmarkSticky();

      container.dataset.state = "chat";

      gsap.killTweensOf([container, input, tie, leoGroup, arrowBtn, badge, spike]);

      // Wenn bereits in der AI-Bubble: Spike rausanimieren (Chat-Pille hat keinen Spike)
      if (wasMorphed && spike) {
        gsap.to(spike, {
          scale: 0, transformOrigin: "0% 0%",
          duration: 0.3, ease: "power2.in",
        });
      }

      // Pille-Dimensionen werden durch pill-slot definiert (CSS, fixed dimensions).
      // Container reparented IN den statischen pill-slot — Flip-Target stabil vorhanden.
      const state = Flip.getState(container, { props: "width,height" });
      pillSlotEl.appendChild(container);
      container.style.width = "100%";
      container.style.height = "100%";

      // chat-center sichtbar machen (kein Layout-Change, nur opacity)
      chatCenterEl.style.opacity = "1";
      chatCenterEl.style.pointerEvents = "auto";

      document.body.style.overflow = "hidden";
      backdropEl.style.display = "block";
      backdropEl.addEventListener("click", closeChat);
      window.dispatchEvent(new CustomEvent("menu-opened", { detail: { extended: true } }));

      Flip.from(state, {
        duration: 0.75,
        ease: "power3.inOut",
        absolute: true,
        onComplete: () => {
          gsap.to(input, { opacity: 1, duration: 0.3, ease: "power2.out" });
          input.style.pointerEvents = "auto";
          // Mobile: Tastatur automatisch öffnen via input.focus()
          if (checkMobile()) {
            chatInputElRef.current?.focus();
          }
        },
      });

      // Icon-Leo + Greeting fade-in (parallel zur Flip)
      gsap.fromTo(iconwrapEl,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", delay: 0.2 }
      );

      // Falls aus default state geklickt: Pulse parallel zur Flip-Expand.
      if (wasDefault && tie && leoGroup && arrowBtn && badge) {
        const pulse = gsap.timeline();
        pulse.to(leoGroup, { y: 80, duration: 0.38, ease: "power2.in" }, 0);
        pulse.to(tie, {
          scale: 0, opacity: 0, transformOrigin: "50% 50%",
          duration: 0.32, ease: "power2.in",
        }, 0);
        pulse.to(badge, { borderRadius: "27px", duration: 0.5, ease: "power2.inOut" }, 0);
        pulse.to(arrowBtn, { scale: 1, duration: 0.32, ease: "back.out(1.8)" }, 0.28);
      }
    };

    const closeChat = () => {
      if (!chatOpenRef.current) return;
      chatOpenRef.current = false;

      let prev = previousParentRef.current;
      if (!prev) return;

      // Wenn User inzwischen gescrollt hat (z.B. durch scrollToBookmarkSticky beim Open),
      // ist der search-pill-slot collapsed (width 0). In dem Fall statt dessen zu home zurück.
      if (prev.id === "leo-dock-slot" && window.scrollY > 5) {
        const home = document.getElementById("leo-floating-home");
        if (home) prev = home;
      }

      const prevIsDockSlot = prev.id === "leo-dock-slot-ai";
      const defSize = checkMobile() ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP;
      const targetWidth = prevIsDockSlot
        ? (checkMobile() ? prev.offsetWidth || window.innerWidth : 410)
        : defSize;
      const targetHeight = prevIsDockSlot ? BUBBLE_H : defSize;

      // Un-blur anstoßen (ContentScaler) + Backdrop weg
      backdropEl.removeEventListener("click", closeChat);
      backdropEl.style.display = "none";
      chatCenterEl.style.pointerEvents = "none";
      // Icon-Leo + Greeting fadet aus (parallel zum container-back-flight)
      gsap.to(iconwrapEl, { opacity: 0, y: 12, duration: 0.3, ease: "power2.in" });

      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("menu-closed"));

      // Mobile: Input blur (Tastatur schließen)
      chatInputElRef.current?.blur();

      // data-state zurücksetzen — CSS fadet bg/shadow/spike automatisch
      container.dataset.state = prevIsDockSlot ? "morphed" : "default";

      // Input ausfaden falls Ziel ≠ Dock-Slot
      if (!prevIsDockSlot) {
        gsap.to(input, { opacity: 0, duration: 0.2, ease: "power2.out" });
        input.style.pointerEvents = "none";
      }

      // Spike wiederherstellen, wenn Ziel = AI-Bubble (Bubble hat Spike)
      if (prevIsDockSlot) {
        const spike = spikeRightRef.current;
        if (spike) {
          gsap.to(spike, {
            scale: 1, transformOrigin: "0% 0%",
            duration: 0.4, ease: "back.out(1.6)",
          });
        }
      }

      // Falls Ziel = default state (home/search-pill): Pulse rückwärts —
      // Pfeil raus, badge-borderRadius zurück, tie zurück, leoGroup auftauchen.
      if (!prevIsDockSlot) {
        const tie = tieRef.current;
        const leoGroup = leoGroupRef.current;
        const arrowBtn = arrowBtnRef.current;
        const badge = badgeRef.current;
        if (tie && leoGroup && arrowBtn && badge) {
          const back = gsap.timeline();
          back.to(arrowBtn, { scale: 0, duration: 0.25, ease: "power2.in" }, 0);
          back.to(badge, { borderRadius: "35px", duration: 0.45, ease: "power2.inOut" }, 0);
          back.to(tie, {
            scale: 1, opacity: 1, transformOrigin: "50% 50%",
            duration: 0.32, ease: "power2.out",
          }, 0.1);
          back.to(leoGroup, { y: 0, duration: 0.4, ease: "back.out(1.2)" }, 0.15);
        }
      }

      // Target viewport rect berechnen. Wenn prev in einem skalierten Ancestor liegt
      // (.scalable-landing oder [data-scale-extended] sind aktuell bei scale 0.95 vom
      // Content-Scaler), müssen wir die UNscaled-Rect berechnen — sonst landet Leo
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

      // Leo auf position:absolute 0,0 innerhalb chat-center, explizite Start-Werte
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      gsap.set(container, { x: 0, y: 0 });

      // Manuelle Animation: Leo BLEIBT in chat-center während der gesamten Close-Anim,
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
          // Chat-Center jetzt verstecken (container ist raus reparented, kein Sprung)
          chatCenterEl.style.opacity = "0";
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

  return (
    <>
    <div
      ref={containerRef}
      data-flip-id="leo"
      data-state="default"
      className="leo-batch-container"
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
          right: size / 2 - 6,    // mittig im Leo-Column (size/2 von rechts), korrigiert um tie-width/2 (=6)
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
          className="leo-spike-img"
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
        className="leo-badge"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "35px",       // px statt % damit GSAP-Tween zu/von 27px sauber interpoliert
          backdropFilter: "brightness(1.3) blur(13px)",
          WebkitBackdropFilter: "brightness(1.3) blur(13px)",
          overflow: "hidden",
        }}
      >
        <div
          ref={leoGroupRef}
          style={{
            position: "absolute",
            right: 0,           // anchor right-bottom — bleibt rechts in der expandierten Bubble
            bottom: 0,          // (statt zur Mitte zu wandern wenn die Bubble breiter wird)
            width: size,        // Charakter belegt eine size-px breite Spalte am rechten Rand
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <LeoCharacter trackPupils={!checkMobile()} />
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
            ref={chatInputElRef}
            type="text"
            placeholder="Sende Leo eine Nachricht ..."
            size={29}
            className="leo-chat-input"
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
            className="leo-versicherer-slot"
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
          .leo-chat-input::placeholder {
            color: #636A5F;
            opacity: 1;
          }
        `}</style>

      </div>

      {/* Arrow-Button (Send-Style) — top-right des Badges, OUTSIDE des badge
          weil badge overflow:hidden hat. Initial scale(0), pulst während
          Morph 1 in. Magenta wie var(--color-brand-secondary). */}
      <div
        ref={arrowBtnRef}
        className="leo-arrow-btn"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 50,
          height: 50,
          borderRadius: "22px",   // proportional zu 50×50, passt zum 27px-Bubble-Stil
          background: "var(--color-brand-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "scale(0)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 14V2M8 2L3 7M8 2l5 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style>{`
        .leo-batch-container .leo-badge {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.05);
          transition: background 0.35s ease, box-shadow 0.35s ease;
        }
        .leo-batch-container[data-state="morphed"] .leo-badge {
          background: #E9FFDE;
          box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0);
        }
        .leo-batch-container[data-state="chat"] .leo-badge {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.05);
        }

        /* Versicherer-Trigger nur im echten Chat-Modus zeigen,
           nicht im morphed-State (KI-Section-Pille) */
        .leo-batch-container .leo-versicherer-slot {
          display: none;
        }
        .leo-batch-container[data-state="chat"] .leo-versicherer-slot {
          display: block;
        }

        /* Spike-Init — GSAP-driven (siehe dockIntoSlot/openChat). Nur Scale, keine Opacity. */
        .leo-batch-container .leo-spike-img {
          transform: scale(0);
          transform-origin: 0% 0%;
        }
      `}</style>
    </div>

    {/* Chat-Overlay — STATISCH gerendert (immer im DOM), hidden via opacity:0
        damit Flip-Targets stabil sind und Layout vor/während Animation nicht
        springt. Sichtbar via gsap.to(opacity, 1) in openChat. */}
    <div
      ref={chatCenterRef}
      id="leo-chat-center"
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      <div ref={pillSlotRef} id="leo-chat-pill-slot" />
    </div>
    <div ref={iconwrapRef} id="leo-chat-iconwrap">
      <div style={{ width: 90, height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LeoCharacter headWidth={56} mouthWidth={58} mouthMarginBottom={-13} trackPupils={!checkMobile()} />
      </div>
      <div id="leo-chat-greeting">Wie kann ich Ihnen helfen?</div>
    </div>
    </>
  );
}
