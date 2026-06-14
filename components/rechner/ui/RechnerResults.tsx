"use client";

import "@/lib/gsapConfig"; // ensures GSAP plugins are registered before tweens
import { useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import gsap from "@/lib/gsapConfig";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import ResultSpacer from "@/components/ui/ResultSpacer";
import { useRechnerLayout } from "@/components/rechner/RechnerLayoutContext";
import { animateCountUp } from "@/lib/animateCountUp";

interface RechnerResultsProps {
  children: React.ReactNode;
  scrollKey?: number;
}

// Edle, ruhig getaktete Reveal-Timeline beim Berechnen.
function runResultTimeline(root: HTMLElement, firstOpen: boolean) {
  const labelSpan = root.querySelector<HTMLElement>(".rechner-ergebnis-label span");
  const dots = root.querySelectorAll<HTMLElement>(".rechner-ergebnis-dot");
  const spacer = root.querySelector<HTMLElement>(".result-spacer");
  const boxes = root.querySelectorAll<HTMLElement>(".rechner-result-box");
  const values = root.querySelectorAll<HTMLElement>(".rechner-result-value");
  const rows = root.querySelectorAll<HTMLElement>(".rechner-result-table tbody tr");
  const hinweis = root.querySelector<HTMLElement>(".rechner-hinweis");

  // Inhalt-Startzustände (kein Flash). Header (Label/Dots/Pfeil) nur beim ersten Mal animieren.
  gsap.set(boxes, { scale: 0.7, opacity: 0, transformOrigin: "center center" });
  gsap.set(rows, { opacity: 0, y: 10 });
  if (hinweis) gsap.set(hinweis, { opacity: 0, y: 10 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  // Beim ersten Erscheinen: Header-Reveal + Platz sanft öffnen. Beim Aktualisieren:
  // Header „ERGEBNIS" + Pfeil bleiben stehen, nur der Inhalt wird neu eingeblendet.
  const base = firstOpen ? 0.3 : 0.28; // beim Aktualisieren erst nach dem Ghost-Ausfaden

  if (firstOpen) {
    gsap.set(dots, { scaleX: 0, transformOrigin: "center center" });
    if (spacer) gsap.set(spacer, { opacity: 0, scaleX: 0, transformOrigin: "center center" });

    const h = root.offsetHeight;
    gsap.set(root, { overflow: "hidden", height: 0 });
    tl.to(root, {
      height: h,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => { gsap.set(root, { height: "auto", overflow: "" }); },
    }, 0);

    if (labelSpan) {
      const full = labelSpan.textContent ?? "";
      const o = { n: 0 };
      labelSpan.textContent = "";
      tl.to(o, {
        n: full.length,
        duration: 0.45,
        ease: "none",
        onUpdate: () => { labelSpan.textContent = full.slice(0, Math.round(o.n)); },
        onComplete: () => { labelSpan.textContent = full; },
      }, 0.05);
    }
    if (dots.length) tl.to(dots, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.12);
    if (spacer) tl.to(spacer, { opacity: 1, scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.16);
  }

  // Ergebnis-Boxen wachsen sanft (dezenter Bounce) + Zahlen zählen hoch
  if (boxes.length) tl.to(boxes, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.3)", stagger: 0.09 }, base);
  values.forEach((v) => animateCountUp(v, tl, base + 0.06, 0.95));
  // Tabelle Reihe für Reihe
  if (rows.length) tl.to(rows, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 }, base + 0.16);
  // Berechnungserläuterung
  if (hinweis) tl.to(hinweis, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, ">-0.1");
}

export default function RechnerResults({ children, scrollKey = 0 }: RechnerResultsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef<string>("");
  const animatedKey = useRef(-1);
  const opened = useRef(false);
  const { resultsContainer } = useRechnerLayout();

  // Nach jedem Render den aktuellen Ergebnis-Inhalt merken (für das Ausfaden des
  // ALTEN Ergebnisses beim nächsten „Aktualisieren").
  useEffect(() => {
    if (bodyRef.current) snapshot.current = bodyRef.current.innerHTML;
  });

  useIsoLayoutEffect(() => {
    if (scrollKey <= 0 || !ref.current) return;
    const root = ref.current;

    // Pro Berechnung nur einmal animieren (StrictMode-Doppelmount / Re-Render sicher)
    if (animatedKey.current !== scrollKey) {
      animatedKey.current = scrollKey;
      const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        const firstOpen = !opened.current;
        // Beim Aktualisieren: altes Ergebnis als „Ghost" über dem neuen ausfaden (Header/Pfeil bleiben).
        if (!firstOpen && snapshot.current && bodyRef.current) {
          const ghost = document.createElement("div");
          ghost.setAttribute("aria-hidden", "true");
          ghost.style.cssText = `position:absolute;left:0;width:100%;top:${bodyRef.current.offsetTop}px;pointer-events:none;`;
          ghost.innerHTML = snapshot.current;
          root.style.position = "relative";
          root.appendChild(ghost);
          gsap.to(ghost, { opacity: 0, duration: 0.28, ease: "power2.out", onComplete: () => ghost.remove() });
        }
        runResultTimeline(root, firstOpen);
        opened.current = true;
      }
    }

    // Sanfter Auto-Scroll im nächsten Frame (Layout ist gesetzt)
    requestAnimationFrame(() => {
      gsap.to(window, {
        scrollTo: { y: root, offsetY: 90 },
        duration: 0.8,
        ease: "power2.inOut",
      });
    });
  }, [scrollKey]);

  const content = (
    <div className="rechner-results" ref={ref}>
      <div className="rechner-ergebnis-header">
        <div className="rechner-ergebnis-label">
          <div className="rechner-ergebnis-dot" />
          <span>ERGEBNIS</span>
          <div className="rechner-ergebnis-dot" />
        </div>
        <ResultSpacer />
      </div>
      <div className="rechner-results-body" ref={bodyRef}>{children}</div>
    </div>
  );

  // Render via portal if container is available, fallback to inline rendering
  if (resultsContainer) {
    return createPortal(content, resultsContainer);
  }
  return content;
}
