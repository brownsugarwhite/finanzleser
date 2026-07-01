"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";
import { useTransitionPhase } from "@/lib/usePageTransition";
import { subscribeMorph, getMorphPhase, type MorphPhase } from "@/lib/morphTransition";
import SiteLoader from "@/components/ui/SiteLoader";

// Erst nach dieser Schwelle anzeigen — schnelle/gecachte/SSG-Navigationen (Ziel
// mountet in ~50–150 ms) flashen so nie den Loader.
const THRESHOLD_MS = 450;
// Mindestanzeigedauer: einmal sichtbar, mind. so lange (sonst „Blitz" bei schnellen
// Ladezeiten). Wirkt jetzt nur noch als Floor für den START des Fade-outs.
const MIN_VISIBLE_MS = 700;
const FADE_IN = 0.25;

/**
 * Zentraler Loader während des „pending"-Fensters einer Seiten-Transition.
 *
 * Ein-/Ausblenden laufen über GSAP-Tweens und sind mit der Enter-Animation
 * gekoppelt: der Loader fadet erst beim echten Enter-Start aus (Event
 * `page-transition-loader-hide` aus lib/pageTransition.ts) und ist VOR Ende des
 * Page-Ins weg — er sitzt damit nie auf einer bereits committeten Seite.
 */
export default function PageTransitionLoader() {
  const phase = useTransitionPhase();
  const [morphPhase, setMorphPhase] = useState<MorphPhase>(getMorphPhase());
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const hidingRef = useRef(false);

  useEffect(() => subscribeMorph(setMorphPhase), []);

  // Fade-out helper (GSAP-Tween, endet ~0.15s vor dem Page-In). Idempotent via hidingRef.
  const fadeOut = (pageInDur: number) => {
    const el = elRef.current;
    if (!el || hidingRef.current) return;
    hidingRef.current = true;
    const elapsed = Date.now() - shownAt.current;
    const startDelay = Math.max(0, (MIN_VISIBLE_MS - elapsed) / 1000);
    const dur = Math.max(0.2, pageInDur > 0 ? pageInDur - 0.15 : 0.25);
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      duration: dur,
      delay: startDelay,
      ease: "power2.out",
      onComplete: () => {
        hidingRef.current = false;
        setMounted(false);
      },
    });
  };

  // Loader an den Enter-Start (bzw. SAFETY-Fallback) koppeln.
  useEffect(() => {
    const onHide = (e: Event) => {
      const dur = (e as CustomEvent).detail?.pageInDur ?? 0;
      fadeOut(dur);
    };
    window.addEventListener("page-transition-loader-hide", onHide);
    return () => window.removeEventListener("page-transition-loader-hide", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "pending" && morphPhase === "idle") {
      // (Neu) anzeigen; eventuelle In-Flight-Fade-outs abbrechen.
      if (showTimer.current) clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => {
        hidingRef.current = false;
        shownAt.current = Date.now();
        setMounted(true);
      }, THRESHOLD_MS);
    } else if (phase === "idle") {
      // Transition vollständig zu Ende (oder vor dem Show abgebrochen).
      if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
      // Falls noch sichtbar und kein Hide-Event kam: defensiv weich ausfaden.
      if (mounted && !hidingRef.current) fadeOut(0);
    } else {
      // exiting / entering: NICHT neu zeigen; das Ausblenden steuert das Hide-Event.
      if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
    }
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, [phase, morphPhase, mounted]);

  // Fade IN beim Mount.
  useEffect(() => {
    if (!mounted) return;
    const el = elRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: FADE_IN, ease: "power2.out" });
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={elRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 9000,
        opacity: 0,
      }}
    >
      <SiteLoader size={28} />
    </div>
  );
}
