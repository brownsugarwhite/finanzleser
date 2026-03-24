"use client";
import { Merriweather } from "next/font/google";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

const merriweather = Merriweather({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-nav",
});

export default function MegaMenu() {
  const megaRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(false);

  const shownRef = useRef(false);

  const show = useCallback((label: string) => {
    if (!shownRef.current) {
      shownRef.current = true;
      setShown(true);
      requestAnimationFrame(() => {
        if (megaRef.current)
          gsap.fromTo(megaRef.current,
            { opacity: 0, y: -20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" },
          );
        if (titleRef.current) {
          titleRef.current.textContent = label;
          gsap.fromTo(titleRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" },
          );
        }
      });
    } else if (titleRef.current) {
      const el = titleRef.current;
      gsap.to(el, {
        opacity: 0, y: -10, duration: 0.15, ease: "power2.in",
        onComplete: () => {
          el.textContent = label;
          gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" });
        },
      });
    }
  }, [shown]);

  const hide = useCallback(() => {
    shownRef.current = false;
    if (!megaRef.current) { setShown(false); return; }
    gsap.to(megaRef.current, {
      opacity: 0, y: -12, scale: 0.97, duration: 0.25, ease: "power3.in",
      onComplete: () => setShown(false),
    });
  }, []);

  useEffect(() => {
    const onShow = (e: Event) => {
      const label = (e as CustomEvent).detail?.label;
      if (label) {
        // Kill any ongoing hide animation
        if (megaRef.current) gsap.killTweensOf(megaRef.current);
        if (titleRef.current) gsap.killTweensOf(titleRef.current);
        show(label);
        document.body.style.overflow = "hidden";
      }
    };
    const onHide = () => {
      hide();
      document.body.style.overflow = "";
    };
    const onClose = () => {
      hide();
      // Also tell nav components to close
      window.dispatchEvent(new CustomEvent("mega-closed"));
    };

    window.addEventListener("mega-show", onShow);
    window.addEventListener("mega-hide", onHide);
    return () => {
      window.removeEventListener("mega-show", onShow);
      window.removeEventListener("mega-hide", onHide);
    };
  }, [show, hide]);

  // Close on click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!shown) return;
      const target = e.target as HTMLElement;
      if (megaRef.current?.contains(target)) return;
      // Don't close if clicking nav buttons or bookmark
      if (target.closest(".top-nav-wrapper")) return;
      if (target.closest(".fixed-nav-wrapper")) return;
      if (target.closest(".bookmark-nav")) return;
      if (target.closest(".landing-nav")) return;
      window.dispatchEvent(new CustomEvent("mega-hide"));
      window.dispatchEvent(new CustomEvent("mega-closed"));
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [shown]);

  if (!shown) return null;

  return (
    <div
      ref={megaRef}
      className={merriweather.variable}
      style={{
        position: "fixed", top: "100px", left: "50%", transform: "translateX(-50%)",
        width: "min(90vw, 800px)", minHeight: "300px", background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        zIndex: 70, padding: "40px", opacity: 0,
      }}
    >
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent("mega-hide"));
          window.dispatchEvent(new CustomEvent("mega-closed"));
        }}
        aria-label="Menü schließen"
        style={{
          position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px",
          borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.05)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", color: "#334a27", fontWeight: 700,
        }}
      >
        ✕
      </button>
      <h2
        ref={titleRef}
        style={{
          fontFamily: "var(--font-nav)", fontSize: "32px", fontWeight: 700,
          color: "#334a27", marginBottom: "24px",
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ height: "48px", borderRadius: "10px", background: "rgba(69,161,23,0.08)" }} />
        ))}
      </div>
    </div>
  );
}
