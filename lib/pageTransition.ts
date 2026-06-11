/**
 * Page-Transition-Controller (Singleton, framework-frei — wie overlayController).
 *
 * Choreografie am geteilten, persistenten Wrapper `.scalable-content`:
 *   idle → exiting → pending → entering → idle
 *
 * EXIT animiert die alte Seite raus → router.push committet → neue children mounten
 * im selben (vorgeseedeten, unsichtbaren) Wrapper → ENTER animiert rein. Ein Loader
 * überbrückt die Wartezeit (pending) bei langsamen Routen.
 *
 * Zwei Fälle:
 *  - Fall A (fromOverlay): aus offenem Blur-Overlay heraus. Overlay schließt sofort,
 *    die bereits geblurte/skalierte Seite (+Chrome) faded ganz aus (opacity→0), neue
 *    Seite faded ein (scale 1.05→1, blur→0). ContentScaler übergibt per Takeover.
 *  - Fall B: normaler Link ohne Overlay. Wrapper scale/blur/opacity raus → rein.
 */

import gsap from "@/lib/gsapConfig";
import { ScrollTrigger } from "@/lib/gsapConfig";
import {
  consumeActiveOverlayForTransition,
  type OverlayId,
} from "@/lib/overlayController";
import {
  getTransitionWrapper,
  getOpenScalableTargets,
  clearOpenScalableTargets,
} from "@/lib/scalableTargets";

export type TransitionPhase = "idle" | "exiting" | "pending" | "entering";

type Listener = (phase: TransitionPhase) => void;

const EXIT_A = 0.3; // Fall A: nur opacity raus (Seite ist schon geblurt)
export const EXIT_B = 0.34; // Fall B: scale+blur+opacity raus
const ENTER_DUR = 0.55; // etwas länger + gediegener
// Notbremse: erholt einen echten Hänger in ~8s. Mit dem robusten pathname-ENTER-
// Trigger sollte sie quasi nie greifen — SSG-Seiten committen sofort.
const SAFETY_MS = 8000;

let phase: TransitionPhase = "idle";
let started = false;
let fromOverlay = false;
let exitEls: HTMLElement[] = [];
let enterEls: HTMLElement[] = [];
let enterWhenExitDone = false;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

// ENTER-Gate: Der Morph-Controller (lib/morphTransition.ts) hält das ENTER zurück,
// bis Visual + Titel an ihren Platz gemorpht sind. Solange `enterHeld` true ist,
// merkt runEnter sich den Wunsch (`enterPending`) und führt ihn erst bei
// releaseEnter() aus. Ohne aktiven Morph bleibt das Verhalten unverändert.
let enterHeld = false;
let enterPending = false;

export function holdEnter(): void {
  enterHeld = true;
}

export function releaseEnter(): void {
  enterHeld = false;
  if (enterPending) {
    enterPending = false;
    runEnter();
  }
}

function emit() {
  listeners.forEach((l) => l(phase));
}

export function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getPhase(): TransitionPhase {
  return phase;
}

export function isTransitioning(): boolean {
  return phase !== "idle";
}

function uniq(els: HTMLElement[]): HTMLElement[] {
  return Array.from(new Set(els));
}

// Transform-Origin = Viewport-Mitte (im lokalen Koordinatensystem des Elements) —
// exakt dieselbe Formel wie ContentScaler beim Blur-Scale, damit Ein-/Ausskalieren
// immer von der Bildschirmmitte ausgeht.
function viewportCenterOrigin(el: HTMLElement): string {
  const rect = el.getBoundingClientRect();
  return `${window.innerWidth / 2 - rect.left}px ${window.innerHeight / 2 - rect.top}px`;
}

const ENTER_SCALE = 1.03; // Start-Scale beim Einfaden (von 1.03 → 1)
// Enter-Blur bewusst klein: blur() auf dem ganzen Wrapper ist GPU-teuer (re-raster
// pro Frame) und ruckelt auf schweren Seiten (Slider/Bilder), die gleichzeitig
// hydraten. Scale+Opacity tragen den Effekt; ein leichter Blur reicht visuell.
const ENTER_BLUR = 6;
export const EXIT_SCALE = 0.95; // Fall B: alte Seite kleiner werden (wie beim Overlay-Öffnen)
export const EXIT_BLUR = 23; // gleicher Blur wie ContentScaler beim Overlay-Öffnen

/** Enter-Set: persistentes Chrome aus dem Exit-Set (noch im DOM, kein Content-Wrapper)
 *  plus der persistente `.scalable-content`-Wrapper, der die neuen children hält. */
function computeEnterEls(): HTMLElement[] {
  const chrome = exitEls.filter(
    (el) =>
      document.contains(el) &&
      !el.classList.contains("scalable-landing") &&
      !el.classList.contains("scalable-content")
  );
  return uniq([...chrome, ...getTransitionWrapper()]);
}

function clearSafety() {
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function armSafety() {
  clearSafety();
  safetyTimer = setTimeout(() => {
    // Notbremse: Wrapper sichtbar machen, Zustand zurücksetzen.
    uniq([...exitEls, ...enterEls, ...getTransitionWrapper()]).forEach((el) => {
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform,filter,opacity,transformOrigin" });
      el.style.pointerEvents = "";
    });
    reset();
  }, SAFETY_MS);
}

function reset() {
  phase = "idle";
  started = false;
  fromOverlay = false;
  exitEls = [];
  enterEls = [];
  enterWhenExitDone = false;
  enterHeld = false;
  enterPending = false;
  clearOpenScalableTargets();
  clearSafety();
  emit();
}

export interface StartTransitionOpts {
  href: string;
  fromOverlay?: boolean;
  overlayId?: OverlayId;
  /** Card→Artikel-Morph: KEINE Ausblend-Phase. Sofort pushen, neue Seite direkt
   *  auf den ENTER-Startzustand seeden, damit der Morph sofort losfliegen kann
   *  (das Ausblenden der alten Seite würde sonst ~0.34s Leerlauf vor dem Flug
   *  erzeugen). Das Einblenden des Rests läuft dann parallel zum Morph. */
  immediate?: boolean;
  doPush: (href: string) => void;
}

export function startTransition(opts: StartTransitionOpts): void {
  if (phase !== "idle") return; // Debounce: laufende Transition gewinnt

  // Immediate-Modus (Morph): kein EXIT — direkt pending, neue Seite vor-seeden, push.
  if (opts.immediate) {
    phase = "pending";
    started = true;
    enterWhenExitDone = false;
    emit();
    armSafety();
    enterEls = getTransitionWrapper();
    enterEls.forEach((el) => {
      gsap.killTweensOf(el);
      gsap.set(el, {
        scale: ENTER_SCALE,
        filter: `blur(${ENTER_BLUR}px)`,
        opacity: 0,
        pointerEvents: "none",
      });
    });
    opts.doPush(opts.href);
    return;
  }

  fromOverlay = opts.fromOverlay === true;
  phase = "exiting";
  started = true;
  enterWhenExitDone = false;
  emit();
  armSafety();

  if (fromOverlay) {
    // Set erfassen, das ContentScaler aktuell geblurt hält (Content + Chrome) …
    const open = getOpenScalableTargets();
    exitEls = open.length > 0 ? open.slice() : getTransitionWrapper();
    // … Overlays mit langsamer Eigen-Close-Animation (Preview-Morph) ZUERST hart
    //    schließen lassen (setzt deren isExitingRef → der folgende Closer wird No-Op) …
    window.dispatchEvent(
      new CustomEvent("overlay-fast-close", { detail: { id: opts.overlayId } })
    );
    // … aktives Overlay konsumieren: ruft den (schnellen) Inhalts-Closer, nullt
    //    `active`, feuert KEIN menu-closed → Blur bleibt für den Ausfade-Übergang …
    consumeActiveOverlayForTransition();
    // … und ContentScaler-State zurücksetzen (kein Gegen-Animieren).
    window.dispatchEvent(new CustomEvent("page-transition-takeover"));
  } else {
    exitEls = getTransitionWrapper();
  }

  if (exitEls.length === 0) {
    opts.doPush(opts.href);
    reset();
    return;
  }

  let remaining = exitEls.length;
  const onExitDone = () => {
    remaining -= 1;
    if (remaining > 0) return;
    phase = "pending";
    emit();
    // Enter-Startzustand auf dem persistenten Set vor-seeden, damit die neu
    // gemounteten children NICHT aufblitzen (sie erben opacity:0). Origin wird in
    // runEnter (nach Commit, korrekte rect) final gesetzt.
    enterEls = computeEnterEls();
    enterEls.forEach((el) => {
      gsap.killTweensOf(el);
      gsap.set(el, {
        scale: ENTER_SCALE,
        filter: `blur(${ENTER_BLUR}px)`,
        opacity: 0,
        pointerEvents: "none",
      });
    });
    // Navigation ERST jetzt anstoßen (nach dem EXIT) — sonst kann die neue Route
    // bei schnellen/gecachten Seiten MITTEN im EXIT committen und der EXIT
    // animiert den neuen Content raus → Flackern. Jetzt: alte Seite faded sauber
    // raus, dann pushen, dann ENTER beim Template-Mount.
    opts.doPush(opts.href);
    if (enterWhenExitDone) runEnter();
  };

  exitEls.forEach((el) => {
    gsap.killTweensOf(el);
    el.style.pointerEvents = "none";
    if (fromOverlay) {
      // Schon geblurt/skaliert (ContentScaler-Origin = Viewport-Mitte) → nur ausfaden.
      gsap.to(el, { opacity: 0, duration: EXIT_A, ease: "power2.inOut", onComplete: onExitDone });
    } else {
      gsap.set(el, { transformOrigin: viewportCenterOrigin(el) });
      gsap.to(el, {
        scale: EXIT_SCALE,
        filter: `blur(${EXIT_BLUR}px)`,
        opacity: 0,
        duration: EXIT_B,
        ease: "power2.inOut",
        onComplete: onExitDone,
      });
    }
  });
}

/** Vom PageTransitionProvider bei jedem pathname-Wechsel (= Navigation committed)
 *  aufgerufen → ENTER-Animation starten. */
export function notifyRouteCommitted(): void {
  if (phase === "idle") return; // erster App-Load oder keine Transition aktiv
  if (phase === "exiting") {
    // Neue Route committet bereits vor EXIT-Ende → ENTER direkt nach EXIT.
    enterWhenExitDone = true;
    return;
  }
  if (phase === "pending") {
    runEnter();
  }
}

function runEnter(): void {
  if (phase === "entering") return;
  // Morph-Gate: ENTER zurückhalten bis der Morph fertig ist. Wrapper bleibt im
  // vorgeseedeten Zustand (opacity 0, scale 1.03) — der Rest blendet erst nach
  // releaseEnter() ein. Phase bleibt "pending".
  if (enterHeld) {
    enterPending = true;
    return;
  }
  phase = "entering";
  emit();

  // Neu auflösen — falls der Content-Wrapper inzwischen ein anderer Knoten ist.
  enterEls = uniq([
    ...enterEls.filter((el) => document.contains(el)),
    ...getTransitionWrapper(),
  ]);
  if (enterEls.length === 0) {
    reset();
    return;
  }

  let remaining = enterEls.length;
  enterEls.forEach((el) => {
    gsap.killTweensOf(el);
    gsap.set(el, {
      scale: ENTER_SCALE,
      filter: `blur(${ENTER_BLUR}px)`,
      opacity: 0,
      transformOrigin: viewportCenterOrigin(el),
    });
    gsap.to(el, {
      scale: 1,
      filter: "blur(0px)",
      opacity: 1,
      duration: ENTER_DUR,
      ease: "power3.out",
      force3D: true,
      onComplete: () => {
        gsap.set(el, { clearProps: "transform,filter,opacity,transformOrigin" });
        el.style.pointerEvents = "";
        remaining -= 1;
        if (remaining === 0) {
          // Scroll-Animationen neu vermessen (Wrapper-Props sind jetzt clean).
          window.dispatchEvent(new CustomEvent("scroll-anim-recreate"));
          try {
            ScrollTrigger.refresh();
          } catch {
            /* noop */
          }
          reset();
        }
      },
    });
  });
}

// `started` wird aktuell nur intern gehalten; Export vermeidet ungenutzte-Var-Lint.
export function hasStarted(): boolean {
  return started;
}

