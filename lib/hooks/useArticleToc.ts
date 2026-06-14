"use client";

import "@/lib/gsapConfig";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "@/lib/gsapConfig";

export type TocToolType = "rechner" | "checkliste" | "vergleich" | "dokumente";

export interface TOCItem {
  id: string;
  text: string;
  toolType?: TocToolType;
}

// Mobile braucht mehr Top-Offset wegen MobileTocIndicator (top 16, height 40 → bis 56px)
// + LogoBar; desktop reicht 90 weil keine Indicator-Pille im Weg.
function getScrollOffset() {
  if (typeof window === "undefined") return 90;
  return window.matchMedia("(max-width: 767px)").matches ? 110 : 90;
}

export function useArticleToc() {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);

  const isScrollingRef = useRef(false);
  const scrollCleanupRef = useRef<(() => void) | null>(null);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    isScrollingRef.current = true;
    // Direkte Pixel-Berechnung statt scrollTo:{y:el,offsetY:N}: zuverlässiger
    // bei verschachtelten Wrappern + dangerouslySetInnerHTML.
    const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - getScrollOffset());
    gsap.to(window, {
      scrollTo: { y: targetY, autoKill: false },
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => { isScrollingRef.current = false; },
    });
  }, []);

  // useLayoutEffect statt useEffect: der erste loadTOC()-Aufruf läuft VOR dem Paint,
  // sodass das (in-Flow-)TOC schon im ersten Frame gefüllt ist → kein Nachrutschen
  // des Artikel-Contents mehr während der Seiten-Transition.
  useLayoutEffect(() => {
    const loadTOC = () => {
      const article = document.querySelector("article");
      if (!article) return;

      const headings = Array.from(article.querySelectorAll("h2"));
      if (headings.length === 0) return;

      const tocItems: TOCItem[] = [];
      headings.forEach((heading) => {
        if (heading.hasAttribute("data-toc-exclude")) return;
        const isTool = heading.classList.contains("article-tool-label");
        // Dokumente-Kopf nutzt eigenes Markup (.dok-head-h, nicht .article-tool-label)
        const isDok = heading.classList.contains("dok-head-h");
        let toolType: TocToolType | undefined;
        let text: string;

        if (isDok) {
          toolType = "dokumente";
          text = "Dokumente";
        } else if (isTool) {
          const badge = heading.querySelector(".article-tool-badge");
          const titleEl = heading.querySelector(".article-tool-title");
          const badgeText = badge?.textContent?.trim().toLowerCase() || "";
          if (badgeText.includes("rechner")) toolType = "rechner";
          else if (badgeText.includes("checkliste")) toolType = "checkliste";
          else if (badgeText.includes("vergleich")) toolType = "vergleich";
          else if (badgeText.includes("dokument")) toolType = "dokumente";
          // Dokumente-H2 hat nur ein Badge (kein .article-tool-title) → "Dokumente"
          text = titleEl?.textContent?.trim() || heading.textContent?.trim() || "";
        } else {
          text = heading.textContent || "";
        }

        if (text.trim()) tocItems.push({ id: heading.id, text, toolType });
      });

      setItems(tocItems);

      if (!scrollCleanupRef.current) {
        let rafPending = false;
        const computeActive = () => {
          rafPending = false;
          // Auch während des programmatischen Tweens (TOC-Klick) weiter bestimmen →
          // die Kreise/Marker laufen beim Auto-Scroll dynamisch mit.
          const art = document.querySelector("article");
          if (!art) return;
          // Nur Überschriften MIT id (echte TOC-Ziele) → id-lose h2 (z.B. FAQ-Deko)
          // können den Active-Marker nicht auf einen falschen Punkt zwingen.
          const h2s = Array.from(art.querySelectorAll("h2:not([data-toc-exclude])"))
            .filter((h) => (h as HTMLElement).id);
          if (h2s.length === 0) return;

          // +1 Pixel Toleranz vermeidet Floating-Point-Lücke direkt nach dem Tween.
          const threshold = getScrollOffset() + 1;
          // Alle Tops EINMAL messen (konsistenter Snapshot statt mehrfacher Reads
          // zwischen denen ein Layout-Reflow den Marker springen lassen könnte).
          const tops = h2s.map((h) => h.getBoundingClientRect().top);
          let currentId = "";
          let progress = 0;

          for (let i = 0; i < h2s.length; i++) {
            if (tops[i] <= threshold) {
              currentId = h2s[i].id;
              const start = tops[i] + window.scrollY;
              const end =
                i < h2s.length - 1
                  ? tops[i + 1] + window.scrollY
                  : art.getBoundingClientRect().bottom + window.scrollY;
              const scrollPos = window.scrollY + threshold;
              progress = Math.min(1, Math.max(0, (scrollPos - start) / (end - start)));
            }
          }

          // Wenn unter dem Artikel: activeId zurücksetzen, damit der Indicator
          // am Artikel-Ende elegant ausanimiert.
          const artBottom = art.getBoundingClientRect().bottom;
          if (artBottom <= threshold) currentId = "";

          setActiveId(currentId);
          setScrollProgress(progress);
        };
        // rAF-gedrosselt → Messung passiert nach dem Layout, nicht mitten im Scroll-Burst.
        const handleScroll = () => {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(computeActive);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        scrollCleanupRef.current = () => window.removeEventListener("scroll", handleScroll);
      }
    };

    // SOFORT aufbauen — die h2-Überschriften (inkl. IDs) stehen beim Mount bereits
    // im DOM, also erscheint das TOC zusammen mit dem Artikel statt „nachträglich".
    // Die Timer-Kaskade verfeinert danach (async geladene Tool-Titel, lazy Embeds).
    loadTOC();
    const timers = [100, 200, 300, 500, 700, 1000, 1500, 2000, 3000].map((ms) =>
      setTimeout(loadTOC, ms),
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
      if (scrollCleanupRef.current) {
        scrollCleanupRef.current();
        scrollCleanupRef.current = null;
      }
    };
  }, []);

  return { items, activeId, scrollProgress, scrollToId };
}
