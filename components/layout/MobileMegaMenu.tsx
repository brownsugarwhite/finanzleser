"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import gsap from "@/lib/gsapConfig";
import { NAV_ITEMS } from "@/lib/navItems";
import { TYP_LABELS } from "@/lib/rechnerCategories";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import AlphaList from "@/components/ui/AlphaList";
import { cn } from "@/lib/cn";
import { scrollToBookmarkSticky } from "@/lib/scrollToBookmarkSticky";

/* ── Types ── */

type MainSection = "ratgeber" | "finanztools" | "service";
type DetailType =
  | { kind: "ratgeber"; categoryLabel: string; categoryHref: string }
  | { kind: "rechner" }
  | { kind: "vergleiche" }
  | { kind: "checklisten" }
  | { kind: "anbieter" };

interface MegaPost {
  title: string;
  slug: string;
  uri?: string;
  href?: string;
}

/* ── Constants ── */

const SIDE_MARGIN = 24;   // bg gap on the bg-visible side
const PEEK = 24;          // peek of the OTHER page next to the spine (so spine never touches edge)
const SPINE_W = 10;       // magenta spine width (matches desktop)
const SPINE_GRAY_W = 27;  // gray bar behind spine (matches desktop)
const PAGE_RADIUS = 24;   // rounded corners on pages
const TOP_OFFSET = 80;    // below sticky bookmark (23 + 50 + gap)
const BOTTOM_OFFSET = 16;
const SLIDE_DURATION = 0.42;
const HEIGHT_TWEEN_MS = 320;
const MAIN_PAGE_HEIGHT = 550; // fixed height for main menu view

/* ── Icons map ── */

const RATGEBER_ICONS: Record<string, string> = {
  Finanzen: "/icons/icon_finanzen.svg",
  Versicherungen: "/icons/icon_versicherungen.svg",
  Steuern: "/icons/icon_steuer.svg",
  Recht: "/icons/icon_recht.svg",
};

const FINANZTOOLS_ITEMS: { label: string; icon: string; kind: "rechner" | "vergleiche" | "checklisten"; href: string }[] = [
  { label: "Rechner", icon: "/icons/iconRechner.svg", kind: "rechner", href: "/finanztools/rechner" },
  { label: "Vergleiche", icon: "/icons/iconVergleich.svg", kind: "vergleiche", href: "/finanztools/vergleiche" },
  { label: "Checklisten", icon: "/icons/iconCheckliste.svg", kind: "checklisten", href: "/finanztools/checklisten" },
];

/* ── Utils ── */

function categorySlug(href: string): string {
  return href.split("/").filter(Boolean).pop() || "";
}

/* ── Component ── */

export default function MobileMegaMenu() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [openSection, setOpenSection] = useState<MainSection>("ratgeber");
  const [detail, setDetail] = useState<DetailType | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const bookletRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const detailContentRef = useRef<HTMLDivElement>(null);
  const [stageHeight, setStageHeight] = useState<number | null>(null);

  // Computed positions for booklet translateX (refresh on resize)
  const positionsRef = useRef({ vw: 0, pageW: 0, xClosedRight: 0, xMain: 0, xDetail: 0, xClosedLeft: 0 });

  const recalcPositions = useCallback(() => {
    const vw = window.innerWidth;
    // Each page takes the available width minus bg gap on one side AND peek of the other page on the spine side
    const pageW = vw - SIDE_MARGIN - SPINE_W - PEEK;
    positionsRef.current = {
      vw,
      pageW,
      xClosedRight: vw + SIDE_MARGIN,
      xMain: SIDE_MARGIN,                                       // bg gap on LEFT, page2 peeks on RIGHT (PEEK px)
      xDetail: PEEK - pageW,                                    // page1 peeks on LEFT (PEEK px), bg gap on RIGHT
      xClosedLeft: -(2 * pageW + SPINE_W) - SIDE_MARGIN,
    };
  }, []);

  useEffect(() => {
    recalcPositions();
    const onResize = () => recalcPositions();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recalcPositions]);

  /* ─── Open / Close lifecycle ─── */

  useEffect(() => {
    const handleBurgerOpened = () => {
      // Smooth scroll page so bookmark hits its sticky position; menu slides in below
      scrollToBookmarkSticky();
      setOpen(true);
      setDetail(null);
      setOpenSection("ratgeber");
    };
    const handleMenuClosed = () => setOpen(false);
    window.addEventListener("burger-opened", handleBurgerOpened);
    window.addEventListener("menu-closed", handleMenuClosed);
    return () => {
      window.removeEventListener("burger-opened", handleBurgerOpened);
      window.removeEventListener("menu-closed", handleMenuClosed);
    };
  }, []);

  // Animate booklet enter/exit
  useLayoutEffect(() => {
    const booklet = bookletRef.current;
    if (!booklet) return;
    recalcPositions();
    const { xClosedRight, xMain, xDetail, xClosedLeft } = positionsRef.current;

    if (open) {
      // Enter from right → main
      gsap.set(booklet, { x: xClosedRight });
      gsap.to(booklet, { x: xMain, duration: SLIDE_DURATION, ease: "power3.out" });
    } else {
      // Exit: from main → right, from detail → left
      const target = detail ? xClosedLeft : xClosedRight;
      gsap.to(booklet, { x: target, duration: SLIDE_DURATION, ease: "power3.in" });
    }
    // Note: xDetail used in the section-slide effect below
    void xDetail;
  }, [open, recalcPositions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate booklet slide between main and detail
  useEffect(() => {
    if (!open) return;
    const booklet = bookletRef.current;
    if (!booklet) return;
    const { xMain, xDetail } = positionsRef.current;
    gsap.to(booklet, {
      x: detail ? xDetail : xMain,
      duration: SLIDE_DURATION,
      ease: "power3.inOut",
    });
  }, [detail, open]);

  /* ─── Dynamic height ───
     Main view: fixed at MAIN_PAGE_HEIGHT (350).
     Detail view (non-alpha): measure the natural content via first child's scrollHeight.
     Detail view (alpha-list): force max viewport height for sticky-ABC scroll. */

  useLayoutEffect(() => {
    if (!open) return;

    const maxH = () => window.innerHeight - TOP_OFFSET - BOTTOM_OFFSET;
    const isAlphaList = detail?.kind === "anbieter" || detail?.kind === "checklisten";

    const update = () => {
      let next: number;
      if (!detail) {
        next = MAIN_PAGE_HEIGHT;
      } else if (isAlphaList) {
        next = maxH();
      } else {
        // detailContentRef has overflow:hidden + h-full child; its scrollHeight is bounded.
        // The child wrapper (h-full overflow-y-auto) reports natural content via scrollHeight.
        const measureEl = detailContentRef.current?.firstElementChild as HTMLElement | null;
        if (!measureEl) {
          next = maxH();
        } else {
          const chrome = 82; // header (~62) + content padding (~20)
          // Floor at MAIN_PAGE_HEIGHT so detail never collapses below the main page height
          next = Math.min(Math.max(measureEl.scrollHeight + chrome, MAIN_PAGE_HEIGHT), maxH());
        }
      }
      setStageHeight((prev) => (prev === next ? prev : next));
    };

    update();

    // Catch settling animations + lazy data loads on detail view
    const timers = !detail || isAlphaList ? [] : [200, 400, 700].map((d) => setTimeout(update, d));

    let mo: MutationObserver | undefined;
    let rafId = 0;
    if (detail && !isAlphaList && detailContentRef.current) {
      const scheduled = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(update);
      };
      mo = new MutationObserver(scheduled);
      mo.observe(detailContentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "aria-expanded"],
      });
    }

    window.addEventListener("resize", update);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafId);
      mo?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open, detail]);

  /* ─── Body lock + backdrop scaler events ─── */

  useEffect(() => {
    if (open) {
      // extended:true → ContentScaler also blurs TopNav, Logo and Landing search pill
      window.dispatchEvent(
        new CustomEvent("menu-opened", { detail: { label: "mobile", extended: true } })
      );
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ─── Escape key closes ─── */

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (detail) {
        setDetail(null);
      } else {
        closeMenu();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, detail]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeMenu = useCallback(() => {
    window.dispatchEvent(new CustomEvent("burger-closed"));
    window.dispatchEvent(new CustomEvent("menu-closed"));
  }, []);

  const navigateAndClose = useCallback(
    (href: string) => {
      router.push(href);
      closeMenu();
    },
    [router, closeMenu]
  );

  /* ─── Render guards ─── */

  if (!open && !bookletRef.current) {
    // Render nothing on first paint until first open — keeps DOM clean
    return null;
  }

  // Stage width = 2 * pageW + SPINE_W where pageW = vw - SIDE_MARGIN - SPINE_W - PEEK
  const stageWidth = `calc(200vw - ${2 * (SIDE_MARGIN + PEEK) + SPINE_W}px)`;

  return (
    <div
      ref={overlayRef}
      className="fixed left-0 right-0 z-[57]"
      style={{
        top: TOP_OFFSET,
        bottom: BOTTOM_OFFSET,
        pointerEvents: open ? "auto" : "none",
      }}
      aria-hidden={!open}
    >
      {/* Tap-target on the bg gap (left in detail, right in main) → back / close */}
      {detail && (
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="absolute top-0 bottom-0 left-0"
          style={{ width: SIDE_MARGIN, background: "transparent", border: "none", zIndex: 1 }}
          aria-label="Zurück zum Hauptmenü"
        />
      )}

      {/* The booklet stage — page1 + spine + page2, slides on x */}
      <div
        ref={bookletRef}
        className="absolute top-0 left-0 flex"
        style={{
          width: stageWidth,
          height: stageHeight !== null ? `${stageHeight}px` : "auto",
          transition: stageHeight !== null ? `height ${HEIGHT_TWEEN_MS}ms ease-in-out` : "none",
          willChange: "transform, height",
        }}
      >
        <div ref={stageRef} className="flex w-full h-full relative">
          {/* PAGE 1 — Main menu */}
          <PageMain
            visible={!detail}
            openSection={openSection}
            setOpenSection={setOpenSection}
            onPickRatgeberCategory={(label, href) =>
              setDetail({ kind: "ratgeber", categoryLabel: label, categoryHref: href })
            }
            onPickFinanztool={(kind) => setDetail({ kind } as DetailType)}
            onPickAnbieter={() => setDetail({ kind: "anbieter" })}
            onNavigate={navigateAndClose}
            contentRef={mainContentRef}
          />

          {/* Spine flex spacer — keeps pages flush with the seam */}
          <div style={{ width: SPINE_W, flexShrink: 0 }} aria-hidden />

          {/* PAGE 2 — Detail */}
          <PageDetail
            detail={detail}
            onBack={() => setDetail(null)}
            onNavigate={navigateAndClose}
            contentRef={detailContentRef}
          />

          {/* SPINE — magenta strip + spike + gray shadow (absolute, on top) */}
          <Spine />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Spine (between pages) — magenta + spike + gray shadow
   ──────────────────────────────────────────────── */

function Spine() {
  return (
    <>
      {/* Gray "shadow" bar behind the spine — overlaps both pages */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `calc(50% - ${SPINE_GRAY_W / 2}px)`,
          width: SPINE_GRAY_W,
          background: "rgba(0,0,0,0.03)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      {/* Magenta strip + spike — sits at the seam */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          bottom: "-4%",
          left: `calc(50% - ${SPINE_W / 2}px)`,
          width: SPINE_W,
          display: "flex",
          flexDirection: "column",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <div style={{ flex: 1, background: "var(--color-brand-secondary)" }} />
        <Image
          src="/icons/small_spikes_down.svg"
          alt=""
          width={SPINE_W}
          height={12}
          style={{ width: "100%", height: "auto", display: "block" }}
          aria-hidden
        />
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────
   PAGE 1: Main menu
   ──────────────────────────────────────────────── */

function PageMain({
  visible,
  openSection,
  setOpenSection,
  onPickRatgeberCategory,
  onPickFinanztool,
  onPickAnbieter,
  onNavigate,
  contentRef,
}: {
  visible: boolean;
  openSection: MainSection;
  setOpenSection: (s: MainSection) => void;
  onPickRatgeberCategory: (label: string, href: string) => void;
  onPickFinanztool: (kind: "rechner" | "vergleiche" | "checklisten") => void;
  onPickAnbieter: () => void;
  onNavigate: (href: string) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        width: `calc(100vw - ${SIDE_MARGIN + SPINE_W + PEEK}px)`,
        flexShrink: 0,
        borderTopLeftRadius: PAGE_RADIUS,
        borderBottomLeftRadius: PAGE_RADIUS,
        backgroundColor: "var(--color-pill-bg)",
        backdropFilter: "blur(16px) brightness(1.15)",
        WebkitBackdropFilter: "blur(16px) brightness(1.15)",
        boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
      }}
      aria-hidden={!visible}
    >
      <div ref={contentRef} className="flex-1 overflow-y-auto px-5 pt-6 pb-8">
        <Section
          label="Ratgeber"
          isOpen={openSection === "ratgeber"}
          onToggle={() => setOpenSection("ratgeber")}
        >
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => onPickRatgeberCategory(item.label, item.href)}
                  className="w-full flex items-center gap-3 py-3 px-2 rounded-lg text-left hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  {RATGEBER_ICONS[item.label] && (
                    <Image
                      src={RATGEBER_ICONS[item.label]}
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden
                    />
                  )}
                  <span className="text-base font-medium text-[var(--color-text-primary)]">
                    {item.label}
                  </span>
                  <span className="ml-auto text-[var(--color-text-secondary)]">→</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          label="Finanztools"
          isOpen={openSection === "finanztools"}
          onToggle={() => setOpenSection("finanztools")}
        >
          <ul className="space-y-1">
            {FINANZTOOLS_ITEMS.map((item) => (
              <li key={item.kind}>
                <button
                  type="button"
                  onClick={() => onPickFinanztool(item.kind)}
                  className="w-full flex items-center gap-3 py-3 px-2 rounded-lg text-left hover:bg-[var(--color-bg-subtle)] transition-colors"
                >
                  <Image src={item.icon} alt="" width={24} height={24} aria-hidden />
                  <span className="text-base font-medium text-[var(--color-text-primary)]">
                    {item.label}
                  </span>
                  <span className="ml-auto text-[var(--color-text-secondary)]">→</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          label="Service"
          isOpen={openSection === "service"}
          onToggle={() => setOpenSection("service")}
        >
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={onPickAnbieter}
                className="w-full flex items-center gap-3 py-3 px-2 rounded-lg text-left hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <Image src="/icons/icon_anbieter.svg" alt="" width={24} height={24} aria-hidden />
                <span className="text-base font-medium text-[var(--color-text-primary)]">Anbieter</span>
                <span className="ml-auto text-[var(--color-text-secondary)]">→</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate("/dokumente")}
                className="w-full flex items-center gap-3 py-3 px-2 rounded-lg text-left hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <Image src="/icons/iconDokumente.svg" alt="" width={24} height={24} aria-hidden />
                <span className="text-base font-medium text-[var(--color-text-primary)]">Dokumente</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate("/kontakt")}
                className="w-full flex items-center gap-3 py-3 px-2 rounded-lg text-left hover:bg-[var(--color-bg-subtle)] transition-colors"
              >
                <Image src="/icons/icon_kontakt.svg" alt="" width={24} height={24} aria-hidden />
                <span className="text-base font-medium text-[var(--color-text-primary)]">Kontakt</span>
              </button>
            </li>
          </ul>
        </Section>
      </div>

      <div className="flex items-center justify-center gap-3 py-4 border-t border-[var(--color-border-default)]">
        <span className="text-sm text-[var(--color-text-secondary)]">Modus</span>
        <DarkModeToggle />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Section accordion (one open at a time)
   ──────────────────────────────────────────────── */

function Section({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">(isOpen ? "auto" : 0);
  const initialMount = useRef(true);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    // Skip the open/close dance on initial mount — initial state already reflects
    // the desired layout (auto when open, 0 when closed). Without this, all closed
    // Sections briefly expand to scrollHeight before collapsing in RAF, which would
    // make the parent's height measurement see "all sections open" for one frame.
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (isOpen) {
      setHeight(el.scrollHeight);
      const t = setTimeout(() => setHeight("auto"), 320);
      return () => clearTimeout(t);
    } else {
      // Collapse: from auto → measured → 0
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [isOpen]);

  return (
    <div className="border-b border-[var(--color-border-default)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-[var(--color-text-primary)]">{label}</span>
        <span
          className={cn(
            "text-[var(--color-text-secondary)] transition-transform duration-300",
            isOpen ? "rotate-90" : "rotate-0"
          )}
        >
          →
        </span>
      </button>
      <div
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
        }}
      >
        <div ref={innerRef} className="pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   PAGE 2: Detail
   ──────────────────────────────────────────────── */

function PageDetail({
  detail,
  onBack,
  onNavigate,
  contentRef,
}: {
  detail: DetailType | null;
  onBack: () => void;
  onNavigate: (href: string) => void;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{
        width: `calc(100vw - ${SIDE_MARGIN + SPINE_W + PEEK}px)`,
        flexShrink: 0,
        borderTopRightRadius: PAGE_RADIUS,
        borderBottomRightRadius: PAGE_RADIUS,
        backgroundColor: "var(--color-pill-bg)",
        backdropFilter: "blur(16px) brightness(1.15)",
        WebkitBackdropFilter: "blur(16px) brightness(1.15)",
        boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
      }}
      aria-hidden={!detail}
    >
      <div className="flex items-center gap-2 px-5 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--color-bg-subtle)] transition-colors"
          aria-label="Zurück"
        >
          <span className="text-xl text-[var(--color-text-primary)]">←</span>
        </button>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] truncate">
          {detailTitle(detail)}
        </h2>
      </div>

      <div ref={contentRef} className="flex-1 overflow-hidden px-5 pb-5">
        {detail?.kind === "ratgeber" && (
          <RatgeberDetail
            categoryLabel={detail.categoryLabel}
            categoryHref={detail.categoryHref}
            onNavigate={onNavigate}
          />
        )}
        {detail?.kind === "rechner" && <RechnerDetail onNavigate={onNavigate} />}
        {detail?.kind === "vergleiche" && <VergleicheDetail onNavigate={onNavigate} />}
        {detail?.kind === "checklisten" && <ChecklistenDetail />}
        {detail?.kind === "anbieter" && <AnbieterDetail />}
      </div>
    </div>
  );
}

function detailTitle(detail: DetailType | null): string {
  if (!detail) return "";
  switch (detail.kind) {
    case "ratgeber":
      return detail.categoryLabel;
    case "rechner":
      return "Rechner";
    case "vergleiche":
      return "Vergleiche";
    case "checklisten":
      return "Checklisten";
    case "anbieter":
      return "Anbieter";
  }
}

/* ────────────────────────────────────────────────
   Detail: Ratgeber (subcategories, lazy-fetch posts)
   ──────────────────────────────────────────────── */

function RatgeberDetail({
  categoryLabel,
  categoryHref,
  onNavigate,
}: {
  categoryLabel: string;
  categoryHref: string;
  onNavigate: (href: string) => void;
}) {
  const item = NAV_ITEMS.find((n) => n.label === categoryLabel);
  const subs = item?.submenu || [];
  const [openSub, setOpenSub] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto -mr-1 pr-1">
      <ul className="space-y-1">
        {subs.map((sub) => (
          <SubAccordionItem
            key={sub.href}
            label={sub.label}
            isOpen={openSub === sub.href}
            onToggle={() => setOpenSub((cur) => (cur === sub.href ? null : sub.href))}
            categorySlug={categorySlug(sub.href)}
            categoryHref={sub.href}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-[var(--color-border-default)]">
        <button
          type="button"
          onClick={() => onNavigate(categoryHref)}
          className="text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          Alle Beiträge zu {categoryLabel} ansehen →
        </button>
      </div>
    </div>
  );
}

function SubAccordionItem({
  label,
  isOpen,
  onToggle,
  categorySlug: slug,
  categoryHref,
  onNavigate,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  categorySlug: string;
  categoryHref: string;
  onNavigate: (href: string) => void;
}) {
  const [posts, setPosts] = useState<MegaPost[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || posts !== null) return;
    setLoading(true);
    fetch(`/api/megamenu/posts?category=${encodeURIComponent(slug)}&limit=5`)
      .then((r) => (r.ok ? r.json() : { posts: [], hasMore: false }))
      .then((data) => {
        setPosts(data.posts || []);
        setHasMore(!!data.hasMore);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [isOpen, posts, slug]);

  return (
    <li className="border-b border-[var(--color-border-default)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3"
        aria-expanded={isOpen}
      >
        <span className="text-base text-[var(--color-text-primary)]">{label}</span>
        <span
          className={cn(
            "text-sm text-[var(--color-text-secondary)] transition-transform duration-300",
            isOpen ? "rotate-90" : "rotate-0"
          )}
        >
          →
        </span>
      </button>
      {isOpen && (
        <div className="pb-3 pl-1">
          {loading && (
            <p className="text-sm text-[var(--color-text-secondary)] py-1">Lädt …</p>
          )}
          {!loading && posts && posts.length === 0 && (
            <p className="text-sm text-[var(--color-text-secondary)] py-1">Keine Beiträge</p>
          )}
          {!loading && posts && posts.length > 0 && (
            <ul className="space-y-2">
              {posts.map((p) => {
                const href = p.uri || p.href || `${categoryHref}/${p.slug}`;
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => onNavigate(href)}
                      className="text-sm text-left text-[var(--color-text-primary)] hover:text-[var(--color-brand)]"
                    >
                      {p.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && hasMore && (
            <button
              type="button"
              onClick={() => onNavigate(categoryHref)}
              className="mt-3 text-sm font-medium text-[var(--color-brand)] hover:underline"
            >
              Alle Beiträge ansehen →
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/* ────────────────────────────────────────────────
   Detail: Rechner (grouped by typ)
   ──────────────────────────────────────────────── */

interface RechnerGroup {
  typ: string;
  items: { title: string; slug: string }[];
}

function RechnerDetail({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [groups, setGroups] = useState<RechnerGroup[] | null>(null);
  const [openTyp, setOpenTyp] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/megamenu/rechner-grouped")
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d) => setGroups(d.groups || []))
      .catch(() => setGroups([]));
  }, []);

  if (!groups) {
    return <p className="text-sm text-[var(--color-text-secondary)] py-2">Lädt …</p>;
  }

  return (
    <div className="h-full overflow-y-auto -mr-1 pr-1">
      <ul className="space-y-1">
        {groups.map((g) => {
          const limited = g.items.slice(0, 5);
          const hasMore = g.items.length > 5;
          const isOpen = openTyp === g.typ;
          return (
            <li key={g.typ} className="border-b border-[var(--color-border-default)]">
              <button
                type="button"
                onClick={() => setOpenTyp((cur) => (cur === g.typ ? null : g.typ))}
                className="w-full flex items-center justify-between py-3"
                aria-expanded={isOpen}
              >
                <span className="text-base text-[var(--color-text-primary)]">
                  {TYP_LABELS[g.typ] || g.typ}
                </span>
                <span
                  className={cn(
                    "text-sm text-[var(--color-text-secondary)] transition-transform duration-300",
                    isOpen ? "rotate-90" : "rotate-0"
                  )}
                >
                  →
                </span>
              </button>
              {isOpen && (
                <div className="pb-3 pl-1">
                  <ul className="space-y-2">
                    {limited.map((r) => (
                      <li key={r.slug}>
                        <button
                          type="button"
                          onClick={() => onNavigate(`/finanztools/rechner/${r.slug}`)}
                          className="text-sm text-left text-[var(--color-text-primary)] hover:text-[var(--color-brand)]"
                        >
                          {r.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => onNavigate("/finanztools/rechner")}
                      className="mt-3 text-sm font-medium text-[var(--color-brand)] hover:underline"
                    >
                      Alle Rechner ansehen →
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Detail: Vergleiche (latest 10)
   ──────────────────────────────────────────────── */

interface VergleicheItem { title: string; slug: string }

function VergleicheDetail({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [items, setItems] = useState<VergleicheItem[] | null>(null);

  useEffect(() => {
    fetch("/api/megamenu/vergleiche-latest?limit=10")
      .then((r) => (r.ok ? r.json() : { vergleiche: [] }))
      .then((d) => setItems(d.vergleiche || []))
      .catch(() => setItems([]));
  }, []);

  if (!items) {
    return <p className="text-sm text-[var(--color-text-secondary)] py-2">Lädt …</p>;
  }

  return (
    <div className="h-full overflow-y-auto -mr-1 pr-1">
      <ul className="space-y-1">
        {items.map((v) => (
          <li key={v.slug} className="border-b border-[var(--color-border-default)]">
            <button
              type="button"
              onClick={() => onNavigate(`/finanztools/vergleiche/${v.slug}`)}
              className="w-full text-left py-3 text-base text-[var(--color-text-primary)] hover:text-[var(--color-brand)]"
            >
              {v.title}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-[var(--color-border-default)]">
        <button
          type="button"
          onClick={() => onNavigate("/finanztools/vergleiche")}
          className="text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          Alle Vergleiche ansehen →
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Detail: Checklisten (alphabetical)
   ──────────────────────────────────────────────── */

function ChecklistenDetail() {
  const [items, setItems] = useState<{ title: string; slug: string }[] | null>(null);

  useEffect(() => {
    fetch("/api/megamenu/checklisten")
      .then((r) => (r.ok ? r.json() : { checklisten: [] }))
      .then((d) => setItems(d.checklisten || []))
      .catch(() => setItems([]));
  }, []);

  const alphaItems = useMemo(
    () =>
      (items || []).map((c) => ({
        label: c.title,
        href: `/finanztools/checklisten/${c.slug}`,
      })),
    [items]
  );

  if (!items) {
    return <p className="text-sm text-[var(--color-text-secondary)] py-2">Lädt …</p>;
  }

  return <AlphaList items={alphaItems} emptyLabel="Keine Checklisten" />;
}

/* ────────────────────────────────────────────────
   Detail: Anbieter (alphabetical)
   ──────────────────────────────────────────────── */

function AnbieterDetail() {
  const [items, setItems] = useState<{ title: string; slug: string }[] | null>(null);

  useEffect(() => {
    fetch("/api/megamenu/anbieter")
      .then((r) => (r.ok ? r.json() : { anbieter: [] }))
      .then((d) => setItems(d.anbieter || []))
      .catch(() => setItems([]));
  }, []);

  const alphaItems = useMemo(
    () => (items || []).map((a) => ({ label: a.title, href: `/${a.slug}` })),
    [items]
  );

  if (!items) {
    return <p className="text-sm text-[var(--color-text-secondary)] py-2">Lädt …</p>;
  }

  return <AlphaList items={alphaItems} emptyLabel="Keine Anbieter" />;
}
