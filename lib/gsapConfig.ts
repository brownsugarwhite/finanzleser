"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/dist/Flip";

let initialized = false;

export function initGSAP() {
  if (initialized) return;
  gsap.registerPlugin(ScrollTrigger, Flip);
  initialized = true;
}

export { gsap, ScrollTrigger, Flip };
