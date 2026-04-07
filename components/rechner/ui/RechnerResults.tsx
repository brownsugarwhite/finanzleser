"use client";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import ResultSpacer from "@/components/ui/ResultSpacer";
import { useRechnerLayout } from "@/components/rechner/RechnerLayoutContext";

gsap.registerPlugin(ScrollToPlugin);

interface RechnerResultsProps {
  children: React.ReactNode;
  scrollKey?: number;
}

export default function RechnerResults({ children, scrollKey = 0 }: RechnerResultsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { resultsContainer } = useRechnerLayout();

  useEffect(() => {
    if (scrollKey > 0 && ref.current) {
      gsap.to(window, {
        scrollTo: { y: ref.current, offsetY: 90 },
        duration: 0.6,
        ease: "power2.out",
      });
    }
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
      {children}
    </div>
  );

  // Render via portal if container is available, fallback to inline rendering
  if (resultsContainer) {
    return createPortal(content, resultsContainer);
  }
  return content;
}
