"use client";

import { useEffect, useRef } from "react";

export default function VerticalSpacer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId = 0;
    let pendingY = 50;
    let wasInForm = false;
    let easeTimer: ReturnType<typeof setTimeout> | null = null;

    function update() {
      if (ref.current) {
        ref.current.style.top = `${pendingY}%`;
      }
      rafId = 0;
    }

    function setY(y: number, smooth = false) {
      pendingY = y;
      if (ref.current) {
        ref.current.style.transition = smooth ? "top 0.3s ease-out" : "none";
      }
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!ref.current) return;
      const layout = ref.current.closest(".rechner-layout");
      const divider = ref.current.parentElement;
      const inputs = layout?.querySelector(".rechner-inputs") as HTMLElement | null;
      const button = layout?.querySelector(".rechner-button") as HTMLElement | null;
      const header = layout?.querySelector(".rechner-form-header") as HTMLElement | null;
      if (!layout || !divider || !inputs) return;

      const dividerRect = divider.getBoundingClientRect();
      const topEl = header || inputs;
      const bottomEl = button || inputs;
      const topY = topEl.getBoundingClientRect().top;
      const bottomY = bottomEl.getBoundingClientRect().bottom;

      const isRightOfDivider = e.clientX >= dividerRect.right;
      const isInInputArea = e.clientY >= topY && e.clientY <= bottomY;

      if (isRightOfDivider && isInInputArea) {
        // Map mouse position within inputs area to divider coordinates (only within inputs vertical range)
        const relY = (e.clientY - dividerRect.top) / dividerRect.height;
        const targetY = Math.max(5, Math.min(95, relY * 100));

        if (!wasInForm) {
          wasInForm = true;
          // Force browser to acknowledge current position before transition
          if (ref.current) {
            ref.current.style.transition = "none";
            void ref.current.offsetHeight; // force reflow
          }
          setY(targetY, true);
          if (easeTimer) clearTimeout(easeTimer);
          easeTimer = setTimeout(() => {
            easeTimer = null;
          }, 300);
        } else if (easeTimer) {
          // Still in ease phase — keep smooth
          setY(targetY, true);
        } else {
          setY(targetY, false);
        }
      } else {
        wasInForm = false;
        if (easeTimer) {
          clearTimeout(easeTimer);
          easeTimer = null;
        }
        setY(50, true);
      }
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", () => setY(50, true));
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="vertical-spacer" ref={ref}>
      <svg viewBox="0 0 20 2003" fill="none" className="vertical-spacer-icon" preserveAspectRatio="xMidYMid meet">
        <path
          d="M0.999913 1L0.999956 983.5L18.4999 1001L0.999957 1018.5L1 2001.5"
          stroke="var(--color-text-primary, #334A27)"
          strokeWidth="1"
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
