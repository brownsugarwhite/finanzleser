"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import { useNavItems } from "@/lib/NavContext";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import MegaMenu, { type PreloadedData } from "./MegaMenu";
import MobileMegaMenu from "./MobileMegaMenu";
import TopNav from "./TopNav";
import { setActiveOverlay, closeOverlay, registerOverlayCloser, getActiveOverlay } from "@/lib/overlayController";

type MegaMenuCache = PreloadedData;

// Punkt 5: überlebt den Remount beim Breakpoint-Wechsel (Mobile↔Desktop), damit
// das Desktop-Megamenü nach dem Wechsel wieder die zuletzt offene Kategorie zeigt.
let persistedCategory: string | null = null;

export default function MegaMenuWrapper() {
  const isMobile = useIsMobile(1000); // Punkt 4: Mobile-Megamenü ab ≤1000px
  if (isMobile) return <MobileMegaMenu />;
  return <DesktopMegaMenuWrapper />;
}

function DesktopMegaMenuWrapper() {
  const NAV_ITEMS = useNavItems();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openedViaBurger, setOpenedViaBurger] = useState(false);
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const burgerNavRef = useRef<HTMLDivElement>(null);
  const [cache, setCache] = useState<MegaMenuCache>({});

  // Track last open category so burger can reopen it
  const lastCategoryRef = useRef<string | null>(null);

  // Preload first subcategory of each category at page load
  useEffect(() => {
    const firstSubs = NAV_ITEMS.map(item => (item.submenu || [])[0]?.href).filter(Boolean);
    const getCategorySlug = (href: string) => href.split("/").filter(Boolean).pop() || "";

    const loadFirstSubs = async () => {
      const results: MegaMenuCache = {};
      await Promise.all(firstSubs.map(async (href) => {
        const slug = getCategorySlug(href);
        try {
          const [postsRes, toolsRes] = await Promise.all([
            fetch(`/api/megamenu/posts?category=${slug}`),
            fetch(`/api/megamenu/tools?category=${slug}`),
          ]);
          // Posts-Fehler (WP 500/Timeout) → NICHT cachen, sonst „lädt nie mehr".
          // Der nächste Menü-Open/Sub-Wechsel versucht es dann erneut.
          if (!postsRes.ok) return;
          const postsData = await postsRes.json();
          const toolsData = toolsRes.ok ? await toolsRes.json() : [];
          results[href] = { posts: postsData.posts, hasMore: postsData.hasMore, tools: toolsData };
        } catch {
          // skip → nicht cachen
        }
      }));
      setCache(results);
    };

    // Nicht sofort beim Page-Load feuern — sonst konkurriert dieser Burst (~10-16
    // parallele WP-Fetches) mit den GraphQL-Calls der eigentlichen Seite und lässt
    // das (langsame) WP-Backend einbrechen. In die Idle-Zeit verschieben.
    let cancelled = false;
    const run = () => { if (!cancelled) loadFirstSubs(); };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) {
      idleHandle = w.requestIdleCallback(run, { timeout: 4000 });
    } else {
      timeoutHandle = setTimeout(run, 1800);
    }
    return () => {
      cancelled = true;
      if (idleHandle !== undefined && w.cancelIdleCallback) w.cancelIdleCallback(idleHandle);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [NAV_ITEMS]);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const label = detail?.label;
      if (!label) return;

      // Find the nav item with this label that has a megamenu
      const item = NAV_ITEMS.find((n) => n.label === label && n.megamenu);
      if (item) {
        // Keep burger mode when switching via burger TopNav, otherwise disable
        if (!detail.fromBurgerNav) setOpenedViaBurger(false);
        setOpenCategory((prev) => (prev === label ? null : label));
      }
    };

    const handleBurgerOpened = () => {
      // Open last active category, or first one as default
      const target = lastCategoryRef.current || NAV_ITEMS[0]?.label || null;
      setOpenedViaBurger(true);
      setOpenCategory(target);
    };

    const handleClose = () => {
      setOpenCategory(null);
      setOpenedViaBurger(false);
    };

    window.addEventListener("menu-opened", handleOpen);
    window.addEventListener("burger-opened", handleBurgerOpened);
    window.addEventListener("menu-closed", handleClose);
    return () => {
      window.removeEventListener("menu-opened", handleOpen);
      window.removeEventListener("burger-opened", handleBurgerOpened);
      window.removeEventListener("menu-closed", handleClose);
    };
  }, [NAV_ITEMS]);

  // Remember last open category (instanz- + modulweit für Remount-Persistenz)
  useEffect(() => {
    if (openCategory) {
      lastCategoryRef.current = openCategory;
      persistedCategory = openCategory;
    }
  }, [openCategory]);

  // Punkt 5: Beim Mounten (Resize Mobile→Desktop über 1000px) das Menü wieder
  // öffnen, wenn das Overlay aktiv ist → kein Verschwinden beim Breakpoint-Wechsel.
  useEffect(() => {
    if (getActiveOverlay() === "menu") {
      setOpenedViaBurger(true);
      setOpenCategory(persistedCategory || lastCategoryRef.current || NAV_ITEMS[0]?.label || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slide in burger TopNav
  useEffect(() => {
    if (openedViaBurger && visible && burgerNavRef.current) {
      gsap.fromTo(
        burgerNavRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [openedViaBurger, visible]);

  const isOpen = !!openCategory;

  // Overlay-Controller: Inhalts-Closer registrieren (Handoff schließt das Menü
  // ohne Blur-Toggle) und das Menü als aktives Overlay markieren, solange offen.
  useEffect(() => {
    const unregister = registerOverlayCloser("menu", () => {
      setOpenCategory(null);
      setOpenedViaBurger(false);
    });
    return unregister;
  }, []);
  useEffect(() => {
    if (isOpen) setActiveOverlay("menu");
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks on nav pills (TopNav buttons) — they handle their own events
      if (target.closest?.("[data-topnav]")) return;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpenCategory(null);
        setOpenedViaBurger(false);
        closeOverlay("menu");
      }
    };

    // Delay to avoid catching the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  // Fade in only on first open, not on category switch
  useEffect(() => {
    if (isOpen) {
      if (!visible) {
        const timer = setTimeout(() => setVisible(true), 200);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenCategory(null);
        setOpenedViaBurger(false);
        closeOverlay("menu");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const activeItem = NAV_ITEMS.find((n) => n.label === openCategory);
  if (!activeItem?.submenu) return null;

  const closeAll = () => {
    setOpenCategory(null);
    setOpenedViaBurger(false);
    closeOverlay("menu");
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: openedViaBurger ? 0 : 73,
        zIndex: 57,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Burger TopNav – slides in from top when opened via burger */}
      {openedViaBurger && (
        <div
          ref={burgerNavRef}
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 23,
            height: 83,
            boxSizing: "border-box",
            pointerEvents: "auto",
          }}
        >
          <TopNav
            className="burger-nav"
            defaultActive={openCategory || undefined}
            style={{
              position: "relative",
              zIndex: 3,
              marginTop: 0,
              pointerEvents: "auto",
            }}
          />
        </div>
      )}

      {/* Megamenu content */}
      <div style={openedViaBurger ? { marginTop: -10 } : undefined}>
        <MegaMenu
          activeCategory={activeItem.href.substring(1)}
          activeCategoryLabel={activeItem.label}
          items={activeItem.submenu}
          mainCategoryHref={activeItem.href}
          onClose={closeAll}
          preloadedData={cache}
        />
      </div>
    </div>
  );
}
