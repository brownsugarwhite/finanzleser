"use client";

// IMPORTANT: this file uses the same default import that all other files use,
// so the gsap instance whose plugins we register here is the same instance
// every component sees. Do NOT change to `import { gsap } from "gsap"`.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";
import { Flip } from "gsap/dist/Flip";

let initialized = false;

export function initGSAP() {
  if (initialized) return;
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MotionPathPlugin, Flip);

  // Lag-Smoothing: First-Paint-Lags > 150ms (typisch 200-400ms beim
  // ersten Tap auf Mobile) werden auf 16ms geglättet, sonst springt GSAP
  // den Tween um den vollen Lag-Wert vor → Animation wirkt "instant".
  // Normale Mobile-Frames (25-40ms) liegen UNTER der Schwelle und laufen
  // nativ — keine Slowdown der Wall-Clock-Time. Default war 500/33 was
  // typische First-Paint-Lags nicht abdeckte.
  gsap.ticker.lagSmoothing(150, 16);

  initialized = true;
}

// Eager registration on module load: any file that side-effect-imports this
// module (e.g. `import "@/lib/gsapConfig";`) is guaranteed to have all GSAP
// plugins registered before its component code runs.
initGSAP();

export { gsap, ScrollTrigger, ScrollToPlugin, MotionPathPlugin, Flip };
export default gsap;
