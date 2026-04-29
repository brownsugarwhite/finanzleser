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

const STRIP = 72; // visible strip width on the off-screen side (px)
const SLIDE_DURATION = 0.42;

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

  // Computed positions for booklet translateX (refresh on resize)
  const positionsRef = useRef({ vw: 0, pageW: 0, xClosedRight: 0, xMain: 0, xDetail: 0, xClosedLeft: 0 });

  const recalcPositions = useCallback(() => {
    const vw = window.innerWidth;
    const pageW = vw - STRIP;
    positionsRef.current = {
      vw,
      pageW,
      xClosedRight: vw,
      xMain: 0,
      xDetail: STRIP - pageW,
      xClosedLeft: -2 * pageW,
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

  /* ─── Body lock + backdrop scaler events ─── */

  useEffect(() => {
    if (open) {
      window.dispatchEvent(new CustomEvent("menu-opened", { detail: { label: "mobile" } }));
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

  const showLeftStrip = !detail; // strip on right when main visible
  const showRightStrip = !!detail; // strip on left when detail visible

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[57]"
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
    >
      {/* Tap-target on left strip when in detail view → back to main */}
      {showRightStrip && (
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="absolute top-0 bottom-0 left-0"
          style={{ width: STRIP, background: "transparent", border: "none", zIndex: 1 }}
          aria-label="Zurück zum Hauptmenü"
        />
      )}

      {/* The booklet — 2 pages wide, slides on x */}
      <div
        ref={bookletRef}
        className="absolute top-0 bottom-0 left-0 flex bg-[var(--color-bg-surface)]"
        style={{
          width: `calc(200vw - ${2 * STRIP}px)`,
          willChange: "transform",
          boxShadow: "0 0 32px rgba(0,0,0,0.18)",
        }}
      >
        <div ref={stageRef} className="flex w-full h-full">
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
            showRightStripDecor={showLeftStrip}
          />

          {/* PAGE 2 — Detail */}
          <PageDetail
            detail={detail}
            onBack={() => setDetail(null)}
            onNavigate={navigateAndClose}
            showLeftStripDecor={showRightStrip}
          />
        </div>
      </div>
    </div>
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
  showRightStripDecor,
}: {
  visible: boolean;
  openSection: MainSection;
  setOpenSection: (s: MainSection) => void;
  onPickRatgeberCategory: (label: string, href: string) => void;
  onPickFinanztool: (kind: "rechner" | "vergleiche" | "checklisten") => void;
  onPickAnbieter: () => void;
  onNavigate: (href: string) => void;
  showRightStripDecor: boolean;
}) {
  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{ width: `calc(100vw - ${STRIP}px)`, flexShrink: 0 }}
      aria-hidden={!visible}
    >
      {/* Right edge bookmark decoration (only on main view) */}
      {showRightStripDecor && (
        <div
          aria-hidden
          className="absolute top-0 bottom-0 right-0"
          style={{
            width: 4,
            background: "var(--color-brand-secondary, #D3005E)",
            opacity: 0.85,
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-20 pb-8">
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

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
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
  showLeftStripDecor,
}: {
  detail: DetailType | null;
  onBack: () => void;
  onNavigate: (href: string) => void;
  showLeftStripDecor: boolean;
}) {
  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      style={{ width: `calc(100vw - ${STRIP}px)`, flexShrink: 0 }}
      aria-hidden={!detail}
    >
      {/* Left edge bookmark decoration (only on detail view) */}
      {showLeftStripDecor && (
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-0"
          style={{
            width: 4,
            background: "var(--color-brand-secondary, #D3005E)",
            opacity: 0.85,
          }}
        />
      )}

      <div className="flex items-center gap-2 px-5 pt-20 pb-2">
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

      <div className="flex-1 overflow-hidden px-5 pb-5">
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
