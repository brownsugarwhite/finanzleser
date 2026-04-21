"use client";

import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const STICKY_TOP = 23;

export function scrollToBookmarkSticky() {
  const bookmark = document.querySelector<HTMLElement>(".bookmark-section");
  if (!bookmark) return;
  const rect = bookmark.getBoundingClientRect();
  if (rect.top <= STICKY_TOP + 1) return;
  const targetY = window.scrollY + rect.top - STICKY_TOP;
  gsap.to(window, { scrollTo: { y: targetY }, duration: 0.5, ease: "power2.inOut" });
}
