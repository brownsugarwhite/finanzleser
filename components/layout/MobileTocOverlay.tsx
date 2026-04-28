"use client";

import { useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import TableOfContents from "@/components/sections/TableOfContents";
import type { TOCItem } from "@/lib/hooks/useArticleToc";

interface Props {
  items: TOCItem[];
  activeId: string;
  scrollProgress: number;
  scrollToId: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileTocOverlay({ items, activeId, scrollProgress, scrollToId, isOpen, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;

    if (isOpen) {
      gsap.set([panel, backdrop], { display: "block" });
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      gsap.fromTo(panel, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
    } else {
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => { if (backdropRef.current) backdropRef.current.style.display = "none"; },
      });
      gsap.to(panel, {
        y: -20,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        overwrite: "auto",
        onComplete: () => { if (panelRef.current) panelRef.current.style.display = "none"; },
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        className="mobile-toc-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 70,
          display: "none",
          opacity: 0,
        }}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="mobile-toc-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Inhaltsverzeichnis"
        style={{
          position: "fixed",
          top: 70,
          left: 13,
          right: 13,
          maxHeight: "calc(100vh - 90px)",
          overflowY: "auto",
          zIndex: 71,
          display: "none",
          opacity: 0,
          padding: "20px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{
            fontFamily: "Merriweather, serif",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}>
            Inhaltsverzeichnis
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid var(--color-text-medium)",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="2" y1="2" x2="10" y2="10" stroke="#334A27" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="2" x2="2" y2="10" stroke="#334A27" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <TableOfContents
          items={items}
          activeId={activeId}
          scrollProgress={scrollProgress}
          scrollToId={scrollToId}
          onItemClick={onClose}
        />
      </div>
    </>
  );
}
