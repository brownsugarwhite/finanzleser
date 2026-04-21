"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { scrollToBookmarkSticky } from "@/lib/scrollToBookmarkSticky";

const TOOLS = [
  {
    title: "Rechner",
    description:
      "Interaktive Rechner für Finanzen, Steuern und Versicherungen",
    href: "/finanztools/rechner",
    color: "var(--color-tool-rechner)",
  },
  {
    title: "Vergleiche",
    description: "Vergleichstabellen für Angebote und Leistungen",
    href: "/finanztools/vergleiche",
    color: "var(--color-tool-vergleiche)",
  },
  {
    title: "Checklisten",
    description:
      "Praktische Checklisten für wichtige finanzielle Entscheidungen",
    href: "/finanztools/checklisten",
    color: "var(--color-tool-checklisten)",
  },
];

export default function FinanztoolsMenu() {
  const [open, setOpen] = useState(false);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for toggle event
  useEffect(() => {
    const handleToggle = () => {
      setOpen((prev) => {
        const opening = !prev;
        // Dispatch events outside of setState to avoid updating other components mid-render
        queueMicrotask(() => {
          if (opening) {
            scrollToBookmarkSticky();
            window.dispatchEvent(new CustomEvent("menu-closed"));
            requestAnimationFrame(() => {
              window.dispatchEvent(new CustomEvent("menu-opened", { detail: { extended: true } }));
            });
          } else {
            window.dispatchEvent(new CustomEvent("menu-closed"));
          }
        });
        return opening;
      });
    };

    // Close when a regular megamenu opens
    const handleMenuOpened = (e: Event) => {
      const label = (e as CustomEvent).detail?.label;
      if (label) {
        // A nav category opened → close finanztools
        setOpen(false);
      }
    };

    const handleMenuClosed = () => {
      // Only close if triggered externally (e.g. outside click on MegaMenuWrapper)
    };

    window.addEventListener("finanztools-toggle", handleToggle);
    window.addEventListener("menu-opened", handleMenuOpened);
    return () => {
      window.removeEventListener("finanztools-toggle", handleToggle);
      window.removeEventListener("menu-opened", handleMenuOpened);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        window.dispatchEvent(new CustomEvent("menu-closed"));
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        window.dispatchEvent(new CustomEvent("menu-closed"));
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Slide-in animation
  useEffect(() => {
    if (open) {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { x: 120, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            delay: i * 0.1,
            ease: "power3.out",
          }
        );
      });
    } else {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.set(card, { x: 120, opacity: 0 });
      });
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("menu-closed"));
  };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 73,
        right: 0,
        zIndex: 58,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
        padding: "12px 25px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {TOOLS.map((tool, i) => (
        <Link
          key={tool.href}
          href={tool.href}
          ref={(el) => {
            cardsRef.current[i] = el;
          }}
          onClick={handleClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 22px",
            backgroundColor: "var(--color-pill-bg)",
            backdropFilter: "brightness(1.15)",
            WebkitBackdropFilter: "brightness(1.15)",
            borderRadius: 19,
            boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
            textDecoration: "none",
            color: "var(--color-text-primary)",
            opacity: 0,
            transform: "translateX(120px)",
            width: 340,
            boxSizing: "border-box",
            transition: "box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 30px rgba(0, 0, 0, 0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 3px 23px rgba(0, 0, 0, 0.02)";
          }}
        >
          {/* Color accent bar */}
          <div
            style={{
              width: 4,
              height: 40,
              borderRadius: 2,
              background: tool.color,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "var(--font-heading, 'Merriweather', serif)",
                marginBottom: 2,
              }}
            >
              {tool.title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-body)",
                lineHeight: 1.4,
              }}
            >
              {tool.description}
            </div>
          </div>
          {/* Arrow */}
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            style={{ flexShrink: 0, opacity: 0.3 }}
          >
            <path
              d="M1 1l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ))}
    </div>
  );
}
