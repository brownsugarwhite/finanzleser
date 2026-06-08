"use client";

import "@/lib/gsapConfig"; // ensures core GSAP plugins are registered before tweens
import "@/lib/gsap/motionPath"; // LeoIcon ist einziger MotionPath-Konsument
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";
import { Flip } from "@/lib/gsapConfig";
import { scrollToBookmarkSticky } from "@/lib/scrollToBookmarkSticky";
import VersichererSelect from "@/components/ui/VersichererSelect";
import { openOverlay, closeOverlay, registerOverlayCloser } from "@/lib/overlayController";
import LeoCharacter from "@/components/ui/LeoCharacter";
import LeoChatMessages from "@/components/ui/LeoChatMessages";
import LeoChatSendButton from "@/components/ui/LeoChatSendButton";
import type { Versicherer } from "@/lib/versicherer";
import type { LeoUIMessage } from "@/lib/ai/leoMessage";
import { MAIN_CATEGORY_SLUGS } from "@/lib/categories";

const LEO_SIZE_DESKTOP = 70;
const LEO_SIZE_MOBILE = 64;
// Versicherer-Auswahl im Chat vorerst deaktiviert (Funktionalität folgt später).
const SHOW_VERSICHERER_SELECT = false;
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
  const arrowBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const chatInputElRef = useRef<HTMLInputElement>(null);    // <input> für mobile auto-focus
  const chatCenterRef = useRef<HTMLDivElement>(null);       // statischer Chat-Overlay-Container (in JSX)
  const pillSlotRef = useRef<HTMLDivElement>(null);         // statischer Pill-Slot (Flip-Target)
  const iconwrapRef = useRef<HTMLDivElement>(null);         // Icon-Leo + Greeting Wrapper
  const leoBoxRef = useRef<HTMLDivElement>(null);           // NUR der Leo-Container (Scale-Target, ohne Greeting)
  const dockedInSlot = useRef(false);
  const chatOpenRef = useRef(false);
  const previousParentRef = useRef<HTMLElement | null>(null);
  const [docked, setDocked] = useState(false);
  const [selectedVersicherer, setSelectedVersicherer] = useState<Versicherer | null>(null);
  const isLanding = useRef(false);
  const hasUndocked = useRef(false);
  const isAtHomeRef = useRef(false); // Mobile: Leo aktuell unten-rechts (true) oder im Sticky-Slot (false)?
  const wasInStickyForMenuRef = useRef(false); // Mobile: Leo flog wegen menu-open zur Home-Ecke → bei menu-close zurück swappen.
  const [size, setSize] = useState(LEO_SIZE_DESKTOP);
  const pathname = usePathname();

  // KI-Chat (Vercel AI SDK v6). /api/chat proxyt auf das LEO-Backend des Kunden
  // (RAG-Service auf Heroku); Modell + System-Prompt liegen dort.
  const { messages, sendMessage, status, stop, error } = useChat<LeoUIMessage>();
  const [chatInput, setChatInput] = useState("");
  const isBusy = status === "streaming" || status === "submitted";

  const handleChatSubmit = () => {
    if (isBusy) {
      stop();
      return;
    }
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    // Seiten-Kontext für die Broschüren-Vorauswahl des Backends mitgeben
    // (Logik gespiegelt von embed.js: slug = letztes Segment, category bevorzugt
    // die Subkategorie, sonst die Hauptkategorie).
    const seg = pathname.split("/").filter(Boolean);
    const slug = seg.length ? seg[seg.length - 1] : "";
    const category =
      seg.length && (MAIN_CATEGORY_SLUGS as readonly string[]).includes(seg[0])
        ? seg[1] ?? seg[0]
        : "";
    sendMessage({ text: trimmed }, { body: { slug, category } });
    setChatInput("");
  };

  // Layout-Mode + Leo-Tracking: welcome → conversation
  // - iconwrap-Position via GSAP Flip (smooth Morph zur Bubble-Position).
  // - Leo-Scale via separater gsap.to AUF leoBoxRef (nicht iconwrap), damit
  //   der Greeting-Text NICHT mit skaliert wird.
  // - Target-Fallback: wenn noch keine Assistant-Row da → User-Row nehmen, damit
  //   der Morph SOFORT beim Submit startet (nicht erst wenn Antwort kommt).
  // - ResizeObserver für Live-Tracking während Streaming.
  useEffect(() => {
    const center = chatCenterRef.current;
    const wrap = iconwrapRef.current;
    const leoBox = leoBoxRef.current;
    if (!center || !wrap || !leoBox) return;

    const computeTarget = () => {
      // Bevorzugt Assistant-Row, fallback auf User-Row (für sofortigen Morph beim Submit).
      const assistantRows = document.querySelectorAll<HTMLElement>(
        "#leo-chat-messages .chat-row--assistant"
      );
      let row: HTMLElement | undefined = assistantRows[assistantRows.length - 1];
      if (!row) {
        const userRows = document.querySelectorAll<HTMLElement>(
          "#leo-chat-messages .chat-row--user"
        );
        row = userRows[userRows.length - 1];
      }
      if (!row) return null;
      const rect = row.getBoundingClientRect();
      const isMob = window.matchMedia(isMobileMQ).matches;
      return {
        row,
        // Leo unten LINKS NEBEN dem Spike (nicht ON dem Spike).
        bottom: window.innerHeight - rect.bottom - 5,
        // Mobile: kleinerer Offset + Clamp, damit Leo nicht aus dem Bild läuft.
        left: isMob ? Math.max(8, rect.left - 30) : rect.left - 55,
      };
    };

    // Welcome (initial oder Reset)
    if (messages.length === 0) {
      const wasInConversation = wrap.dataset.mode === "conversation";
      if (!wasInConversation) {
        center.dataset.mode = "welcome";
        wrap.dataset.mode = "welcome";
        return;
      }
      // Reset: Flip-Morph zurück + Leo-Scale animieren.
      const state = Flip.getState(wrap);
      center.dataset.mode = "welcome";
      wrap.dataset.mode = "welcome";
      gsap.set(wrap, { clearProps: "left,bottom,x,xPercent,transform" });
      Flip.from(state, { duration: 0.5, ease: "power3.inOut" });
      gsap.to(leoBox, { scale: 1, duration: 0.5, ease: "power3.inOut" });
      return;
    }

    // Conversation mode
    const target = computeTarget();
    if (!target) return;
    const { row } = target;

    const wasInConversation = wrap.dataset.mode === "conversation";

    if (!wasInConversation) {
      // Erstmals in conversation: Flip-Morph iconwrap (Position) + gsap.to leoBox (Scale).
      // Beide laufen parallel mit gleicher duration/ease → smooth simultaner Morph.
      const state = Flip.getState(wrap);
      center.dataset.mode = "conversation";
      wrap.dataset.mode = "conversation";
      gsap.set(wrap, {
        left: target.left,
        bottom: target.bottom,
        x: 0,
        xPercent: 0,
      });
      Flip.from(state, {
        duration: 0.6,
        ease: "power3.inOut",
      });
      // Scale NUR auf Leo-Box (greeting bleibt unskaliert, fadet via CSS-Opacity).
      gsap.to(leoBox, {
        scale: 0.653,                      // 8% größer als 0.605
        duration: 0.6,
        ease: "power3.inOut",
      });
    } else {
      // Folgeupdates (neue Antwort, Streaming) — nur Position-Tweak.
      gsap.to(wrap, {
        left: target.left,
        bottom: target.bottom,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    // ResizeObserver: Bubble wächst während Streaming → Leo folgt
    const ro = new ResizeObserver(() => {
      const t = computeTarget();
      if (!t) return;
      gsap.to(wrap, {
        left: t.left,
        bottom: t.bottom,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    });
    ro.observe(row);
    return () => ro.disconnect();
  }, [messages.length, status]);

  // Reactive viewport-size (mobile = 64, desktop = 70). Updated on matchMedia change.
  useEffect(() => {
    const mq = window.matchMedia(isMobileMQ);
    const update = () => {
      const next = mq.matches ? LEO_SIZE_MOBILE : LEO_SIZE_DESKTOP;
      setSize(next);
      // Floating-Home div an neue Viewport-Klasse anpassen — sonst stay sie
      // auf alter Größe und Leo collapsed beim closeChat in den falschen Slot.
      const home = document.getElementById("leo-floating-home");
      if (home) {
        home.style.width = `${next}px`;
        home.style.height = `${next}px`;
      }
      // Wenn Chat offen ist: previousParentRef-Typ auf neuen Viewport mappen.
      // Top-Dock-Slot (leo-dock-slot oder leo-dock-slot-mobile) → der jeweils
      // korrekte für den neuen Viewport. Floating-Home bleibt floating-home.
      // hasUndocked.current ist hier irreführend (wird in openChat auf true
      // gesetzt) — wir verlassen uns auf den ursprünglich gespeicherten Parent.
      if (chatOpenRef.current) {
        const prev = previousParentRef.current;
        if (!prev) return;
        const wasTopDock = prev.id === "leo-dock-slot" || prev.id === "leo-dock-slot-mobile";
        if (wasTopDock) {
          const newPrev = document.getElementById(mq.matches ? "leo-dock-slot-mobile" : "leo-dock-slot");
          if (newPrev) previousParentRef.current = newPrev;
        }
        return;
      }

      // Chat zu + nicht undocked + Landing-Top: Leo in korrekten Slot umparken.
      if (!isLanding.current || hasUndocked.current || window.scrollY > 5) return;
      const el = containerRef.current;
      if (!el) return;
      const targetSlot = document.getElementById(mq.matches ? "leo-dock-slot-mobile" : "leo-dock-slot");
      if (targetSlot && el.parentElement !== targetSlot) {
        targetSlot.appendChild(el);
      }
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ResizeObserver auf pillSlot: bei jedem CSS-Größen-Change (Viewport-Resize,
  // Media-Query-Übergang) den Container-Width/Height auf "100%" zurücksetzen,
  // damit der von Flip resolved-px-Inline-Wert verworfen wird und die neue
  // pillSlot-CSS-Dimension greift. Greift NUR wenn Chat offen ist.
  useEffect(() => {
    const slot = pillSlotRef.current;
    if (!slot) return;
    const observer = new ResizeObserver(() => {
      if (!chatOpenRef.current) return;
      const c = containerRef.current;
      if (c && c.parentElement === slot) {
        c.style.width = "100%";
        c.style.height = "100%";
      }
    });
    observer.observe(slot);
    return () => observer.disconnect();
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
        bottom: "16px",
        right: "23px",
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
      closeOverlay("leo");
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
      const collapseSwap = (target: HTMLElement, onAtTarget?: () => void, inDelay = 0) => {
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
              delay: inDelay,
              onComplete: () => {
                // Inline-Transforms komplett räumen — kein matrix(1,0,0,1,0,0)
                // residue der Flip später irritieren könnte. JSX-Defaults
                // (scale 1, opacity 1, y 0) sind ohnehin identisch zu "kein
                // Transform" → gleiche Wirkung.
                gsap.set(el, { clearProps: "transform" });
                gsap.set(tie, { clearProps: "transform,opacity" });
                gsap.set(leoGroup, { clearProps: "transform" });
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
        // Wenn Menu Leo gerade in die Home-Ecke gezwungen hat, keine
        // Scroll-Reaktion — sonst würde ein spurious scroll-event (durch
        // body-scroll-lock beim Menu-Open) die collapseSwap(slot)-Logik
        // triggern und Leo direkt wieder nach oben swappen.
        if (wasInStickyForMenuRef.current) return;
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

      // Burger-Menü-Open auf Mobile: wenn Leo am Sticky-Slot oben ist, soll er
      // mit dem normalen Flip nach unten in die Home-Ecke fliegen, damit das
      // Logo (das beim menu-open via LongIn einanimiert) dort Platz hat.
      // Beim Close das gleiche wie beim Hochscrollen: Leo collapse-swappt
      // zurück in den Sticky-Slot.
      // Article-Preview (label="preview") und KI-Vorschau haben eigene
      // Handler — hier nur das nackte burger-menü ohne label.
      const onMenuOpened = (e: Event) => {
        const detail = (e as CustomEvent).detail as { label?: string } | undefined;
        if (detail?.label === "preview") return;
        // openChat dispatched ebenfalls menu-opened (für Logo-LongIn etc).
        // Wenn Chat gerade öffnet, NICHT collapse-swappen — sonst kollidiert
        // die Animation mit der Chat-Morph-Flip auf demselben Container.
        if (chatOpenRef.current) return;
        const home = document.getElementById("leo-floating-home");
        if (!home || isAtHomeRef.current) return;
        wasInStickyForMenuRef.current = true;
        isAtHomeRef.current = true;
        setDocked(false);
        // Statt Flip-MotionPath: Collapse-Swap wie beim Hochscrollen, nur
        // umgekehrte Richtung (Sticky-Slot → Floating-Home).
        collapseSwap(home);
      };
      const onMenuClosed = () => {
        const slot = document.getElementById("leo-dock-slot-mobile");
        if (!slot || !wasInStickyForMenuRef.current) return;
        wasInStickyForMenuRef.current = false;
        isAtHomeRef.current = false;
        // Logo longOut, Leo OUT ~0.32s → IN-Phase verzögern, damit Leo erst
        // auftaucht wenn das Logo überwiegend weg ist.
        collapseSwap(slot, () => {
          setDocked(true);
        }, 0.6);
      };
      window.addEventListener("menu-opened", onMenuOpened);
      window.addEventListener("menu-closed", onMenuClosed);

      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("menu-opened", onMenuOpened);
        window.removeEventListener("menu-closed", onMenuClosed);
      };
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
        zIndex: "30",
        background: "transparent",
        display: "none",
        // pointer-events: none → Backdrop blockiert weder Scroll noch Klicks auf
        // Messages-Container. Click-Outside-Close läuft stattdessen über einen
        // document-Listener (siehe handleClickOutside in openChat).
        pointerEvents: "none",
      });
      document.body.appendChild(backdrop);
    }

    const backdropEl = backdrop;

    // Click-Outside-Close: Klick außerhalb der Chat-Elemente schließt den Chat.
    // Ersetzt den backdrop-click-Listener (Backdrop hat pointer-events:none weil
    // sonst Scroll auf Messages blockiert würde).
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("#leo-chat-center") ||
        target.closest("#leo-chat-messages") ||
        target.closest("#leo-chat-iconwrap") ||
        target.closest(".leo-batch-container")
      ) return;
      closeChat();
    };

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

      // Body-Class für Modal-Mode → CSS deaktiviert pointer-events auf
      // TopNav-Elementen (BookmarkNav z:9999, FinanztoolsMenu z:58 etc.) damit
      // der User nichts außerhalb des Chats anklicken kann.
      document.body.classList.add("leo-chat-open");

      // Messages + Bottom-Fade beim Re-Open wieder einblenden.
      const messagesEl = document.getElementById("leo-chat-messages");
      const bottomFadeEl = document.querySelector(".leo-chat-bottom-fade") as HTMLElement | null;
      if (messagesEl) {
        gsap.to(messagesEl, { opacity: 1, duration: 0.35, ease: "power2.out" });
      }
      if (bottomFadeEl) {
        gsap.to(bottomFadeEl, { opacity: 1, duration: 0.35, ease: "power2.out" });
      }

      document.body.style.overflow = "hidden";
      backdropEl.style.display = "block";
      // Statt backdrop-click (geht nicht wegen pointer-events:none) → document
      // -Listener: Klick außerhalb der Chat-Elemente schließt. setTimeout delay
      // verhindert dass der gerade abgesendete Open-Click sofort wieder closet.
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 100);
      // Über den Controller öffnen → ein evtl. offenes Overlay (Menü/Vorschau)
      // animiert aus, der Blur bleibt bestehen, Leo morpht ein.
      openOverlay("leo", { extended: true });

      Flip.from(state, {
        duration: 0.75,
        ease: "power3.inOut",
        absolute: true,
        onComplete: () => {
          // Inline-Width/Height nach Flip wieder auf "100%" setzen — Flip
          // hat während der Animation resolved-px-Werte (z.B. 650px desktop)
          // ins inline geschrieben. Ohne Reset würde der Container bei
          // Viewport-Resize NICHT mit der pillSlot-CSS reagieren.
          container.style.width = "100%";
          container.style.height = "100%";
          gsap.to(input, { opacity: 1, duration: 0.3, ease: "power2.out" });
          input.style.pointerEvents = "auto";
          // Mobile: Tastatur automatisch öffnen via input.focus()
          if (checkMobile()) {
            chatInputElRef.current?.focus();
          }
        },
      });

      // Icon-Leo + Greeting nur opacity-fade (kein y-Slide mehr — User wollte
       // keine zusätzliche Pixel-Verschiebung nach dem Open-Morph).
      gsap.fromTo(iconwrapEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.45, ease: "power2.out", delay: 0.2 }
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

      // ─── Teardown SOFORT + idempotent ──────────────────────────────────
      // MUSS vor jedem early-return laufen, sonst bleibt die Seite unklickbar:
      // body.leo-chat-open setzt pointer-events:none auf Nav/Content, und der
      // fixed Messages-Container würde sonst weiter Klicks abfangen.
      document.removeEventListener("click", handleClickOutside);
      if (backdropEl) backdropEl.style.display = "none";
      if (chatCenterEl) chatCenterEl.style.pointerEvents = "none";
      document.body.classList.remove("leo-chat-open");
      document.body.style.overflow = "";
      closeOverlay("leo");

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

      // Icon-Leo + Greeting fadet aus (parallel zum container-back-flight)
      gsap.to(iconwrapEl, { opacity: 0, y: 12, duration: 0.3, ease: "power2.in" });

      // Messages-Container + Bottom-Fade-Gradient mit ausfaden.
      const messagesEl = document.getElementById("leo-chat-messages");
      const bottomFadeEl = document.querySelector(".leo-chat-bottom-fade") as HTMLElement | null;
      [messagesEl, bottomFadeEl].forEach((el) => {
        if (!el) return;
        gsap.set(el, { opacity: 1 });
        gsap.to(el, { opacity: 0, duration: 0.3, ease: "power2.in" });
      });

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
      // Wenn Chat schon offen ist: NICHT stopPropagation — sonst blockt der
      // native Listener das React-Synthetic-Event-System für innere Klicks
      // (z.B. Send/Stop-Button im Pill). React onClick handler würde nie feuern.
      if (chatOpenRef.current) return;
      e.stopPropagation();
      openChat();
    };
    container.addEventListener("click", handleContainerClick);

    // Handoff-Closer: schließt den Chat-Inhalt ohne Blur-Toggle, falls ein
    // anderes Overlay geöffnet wird während Leo offen ist.
    const unregisterOverlay = registerOverlayCloser("leo", () => {
      if (chatOpenRef.current) closeChat();
    });

    return () => {
      container.removeEventListener("click", handleContainerClick);
      document.removeEventListener("click", handleClickOutside);
      unregisterOverlay();
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
        viewBox="0 0 136.37 316.51"
        style={{
          position: "absolute",
          bottom: -9,
          // Mobile: schmalere Kravatte passend zum kleineren Leo-Character.
          // right korrigiert um tie-width/2 für mittige Ausrichtung im Leo-Column.
          right: size / 2 - (size === LEO_SIZE_MOBILE ? 5 : 6),
          width: size === LEO_SIZE_MOBILE ? 10 : 12,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <polygon
          points="86.91 70.59 109.42 70.59 100.02 0 36.36 0 26.96 70.59 49.5 70.59 0 221.64 67.79 316.51 136.37 221.28 86.91 70.59"
          fill="#d3005e"
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
          <LeoCharacter
            trackPupils={!checkMobile()}
            headWidth={size === LEO_SIZE_MOBILE ? 40 : 44}
            mouthWidth={size === LEO_SIZE_MOBILE ? 42 : 46}
          />
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
          <form
            onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
            style={{ width: "100%", display: "flex" }}
          >
            <input
              ref={chatInputElRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isBusy}
              placeholder={isBusy ? "Leo antwortet …" : "Sende Leo eine Nachricht ..."}
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
                flex: 1,
              }}
            />
          </form>

          {/* Versicherer-Auswahl vorerst ausgeblendet (wird wieder eingebaut,
              sobald die Funktionalität dahinter steht). Komponente + State
              bleiben erhalten — nur Rendering deaktiviert. */}
          {SHOW_VERSICHERER_SELECT && (
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
          )}
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
      <button
        ref={arrowBtnRef}
        type="button"
        className="leo-arrow-btn"
        aria-label={isBusy ? "Antwort stoppen" : "Nachricht senden"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleChatSubmit();
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 50,
          height: 50,
          borderRadius: "22px",
          background: "var(--color-brand-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "scale(0)",
          zIndex: 9999,            // absolut sicherheitshalber sehr hoch
          cursor: "pointer",
          border: "none",
          padding: 0,              // <button> default padding raus
          pointerEvents: "auto",
        }}
      >
        <LeoChatSendButton status={status} />
      </button>

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

        /* Send/Stop-Button: nicht klickbar wenn skaliert auf 0 (vor Chat-Open),
           klickbar im Chat-State. */
        .leo-batch-container:not([data-state="chat"]) .leo-arrow-btn {
          pointer-events: none;
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

    {/* Messages-Container — eigenständig (NICHT in chat-center), weil
        position:fixed innerhalb eines transform-Parents zu absolute relativ
        zum Parent wird (CSS-Gotcha). So bleibt der Bubble-Block unabhängig
        vom Pill-Morph an seiner Viewport-Position. */}
    <LeoChatMessages
      messages={messages}
      status={status}
      error={error}
      mode={messages.length > 0 ? "conversation" : "welcome"}
    />

    {/* Bottom-Fade-Gradient — nur in conversation-mode. Lässt die Bubbles
        unter die Eingabepille hin ausfaden. Page-Color full-alpha am Bottom
        zu 0% Alpha am Top (120px hoch). */}
    {messages.length > 0 && <div className="leo-chat-bottom-fade" aria-hidden />}
    {(() => {
      // size-State ist reaktiv auf matchMedia → mobile/desktop-Wechsel werden
      // automatisch ge-rendered. checkMobile() (Funktion) wäre nicht reaktiv
      // und würde bei SSR vs. Client-Render zu Hydration-Mismatch führen.
      const isMobile = size === LEO_SIZE_MOBILE;
      return (
        <div ref={iconwrapRef} id="leo-chat-iconwrap">
          <div ref={leoBoxRef} className="leo-chat-leo-box" style={{ width: isMobile ? 66 : 78, height: isMobile ? 66 : 78, display: "flex", alignItems: "center", justifyContent: "center", marginTop: isMobile ? -28 : -34, transformOrigin: "bottom left" }}>
            <LeoCharacter
              headWidth={isMobile ? 40 : 48}
              mouthWidth={isMobile ? 36 : 44}
              mouthMarginBottom={-5}
              trackPupils={!isMobile}
              bodyVariant="round"
              kravatteWidth={isMobile ? 10 : 12}
              kravatteOffsetTop={isMobile ? 6 : 8}
            />
          </div>
          <div id="leo-chat-greeting">Wie kann ich Ihnen helfen?</div>
        </div>
      );
    })()}
    </>
  );
}
