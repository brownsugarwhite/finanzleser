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
  initialized = true;
}

// Eager registration on module load: any file that side-effect-imports this
// module (e.g. `import "@/lib/gsapConfig";`) is guaranteed to have all GSAP
// plugins registered before its component code runs.
initGSAP();

export { gsap, ScrollTrigger, ScrollToPlugin, MotionPathPlugin, Flip };
export default gsap;
