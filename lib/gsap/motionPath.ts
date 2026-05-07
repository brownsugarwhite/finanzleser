"use client";

// Lazy-registriertes MotionPath-Plugin — separates Modul, damit es NICHT im
// Landing-Chunk landet. Nur von LeoIcon (Article-Routes / AIAgentTeaser)
// importiert. Hängt sich an dieselbe gsap-Instanz wie gsapConfig.ts an.
import "@/lib/gsapConfig";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/dist/MotionPathPlugin";

let registered = false;
if (!registered) {
  gsap.registerPlugin(MotionPathPlugin);
  registered = true;
}

export { MotionPathPlugin };
