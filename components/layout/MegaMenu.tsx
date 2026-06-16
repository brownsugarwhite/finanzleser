"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "@/lib/gsapConfig";
import type { NavSubItem } from "@/lib/navItems";
import { categoryIconForHref } from "@/lib/categoryIcons";

/**
 * Booklet-Überschrift mit Slide-Wechsel: bei Text-Änderung gleitet die alte
 * Zeile nach oben aus dem Clip-Container, die neue von unten herein.
 */
function SlideHeading({
  text,
  href,
  onClose,
  leadingIcon,
}: {
  text: string;
  href: string;
  onClose: () => void;
  leadingIcon?: string;
}) {
  const clipRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const prevText = useRef(text);
  const prevIcon = useRef(leadingIcon);

  // Icon pulsiert beim Kategoriewechsel (parallel zum Überschriften-Slide).
  useEffect(() => {
    if (prevIcon.current === leadingIcon) return;
    prevIcon.current = leadingIcon;
    const el = iconRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el, { scale: 0.6, opacity: 0.3 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.2)" });
  }, [leadingIcon]);

  useEffect(() => {
    if (prevText.current === text) return;
    const oldText = prevText.current;
    prevText.current = text;
    const clip = clipRef.current;
    const cur = textRef.current;
    if (!clip || !cur) return;

    const clone = document.createElement("span");
    clone.textContent = oldText;
    clone.style.cssText = "position:absolute;left:0;top:0;white-space:nowrap;display:inline-block;";
    clip.appendChild(clone);

    gsap.killTweensOf([clone, cur]);
    gsap.fromTo(clone, { yPercent: 0, opacity: 1 }, { yPercent: -110, opacity: 0, duration: 0.4, ease: "power2.out", onComplete: () => clone.remove() });
    gsap.fromTo(cur, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
  }, [text]);

  return (
    <Link
      href={href}
      onClick={onClose}
      className="megamenu-booklet-heading"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "var(--font-heading, 'Merriweather', serif)",
        color: "var(--color-text-primary)",
        textDecoration: "none",
      }}
    >
      {leadingIcon && (
        <span
          ref={iconRef}
          aria-hidden
          className="megamenu-cat-icon"
          style={{
            width: 26,
            height: 26,
            flexShrink: 0,
            display: "inline-block",
            transformOrigin: "center",
            background: "currentColor",
            WebkitMaskImage: `url(${leadingIcon})`,
            maskImage: `url(${leadingIcon})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      )}
      <span ref={clipRef} style={{ position: "relative", overflow: "hidden", display: "inline-block", paddingBottom: 2 }}>
        <span ref={textRef} style={{ display: "inline-block" }}>{text}</span>
      </span>
    </Link>
  );
}

function boldYears(text: string) {
  const parts = text.split(/(20\d{2}(?:\/\d{2,4})?)/g);
  return <span style={{ color: "inherit" }}>{parts.map((part, i) =>
    /^20\d{2}/.test(part) ? <strong key={i} style={{ fontWeight: 900 }}>{part}</strong> : part
  )}</span>;
}
import type { Post } from "@/lib/types";
import type { MegamenuTool } from "@/lib/wordpress";
import SiteLoader from "@/components/ui/SiteLoader";
import ToolDots, { TOOL_DOT_COLORS, TOOL_LABEL, type ToolType } from "@/components/ui/ToolDots";

export type { ToolType };
export type MegaMenuPost = Post & { tools?: ToolType[] };
export type PreloadedData = Record<string, { posts: MegaMenuPost[]; hasMore: boolean; tools: MegamenuTool[] }>;

// Finanztools-Spalte: Pfad-Segment je Tool-Typ.
const TOOL_PATH: Record<ToolType, string> = { rechner: "rechner", vergleich: "vergleiche", checkliste: "checklisten", dokumente: "dokumente" };

interface MegaMenuProps {
  activeCategory: string;
  activeCategoryLabel: string;
  items: NavSubItem[];
  mainCategoryHref: string;
  onClose: () => void;
  preloadedData?: PreloadedData;
}

export default function MegaMenu({
  activeCategory,
  activeCategoryLabel,
  items,
  mainCategoryHref,
  onClose,
  preloadedData = {},
}: MegaMenuProps) {
  const [selectedSub, setSelectedSub] = useState<string>(items[0]?.href || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const heightLocked = useRef(false);

  const [posts, setPosts] = useState<MegaMenuPost[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [tools, setTools] = useState<MegamenuTool[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<PreloadedData>({});
  const currentSubRef = useRef<string>(items[0]?.href || "");
  // Posts-Spalte (Liste/Loader) zum Ein-/Ausblenden beim Sub-Wechsel
  const postsBodyRef = useRef<HTMLDivElement>(null);

  const getCategorySlug = (href: string): string => {
    const parts = href.split("/").filter(Boolean);
    return parts[parts.length - 1];
  };

  // Merge preloaded data into local cache
  useEffect(() => {
    Object.assign(cacheRef.current, preloadedData);
  }, [preloadedData]);

  // Apply data for a subcategory (from cache or fetch)
  const applySubData = (href: string) => {
    const data = cacheRef.current[href];
    if (data) {
      // Cache-Hit: sofort, kein Loader
      setLoading(false);
      setPosts(data.posts);
      setHasMorePosts(data.hasMore);
      setTools(data.tools);
    } else {
      // Cache-Miss: Loader zeigen, dann nachladen
      setLoading(true);
      const slug = getCategorySlug(href);
      Promise.all([
        fetch(`/api/megamenu/posts?category=${slug}`).then(r => { if (!r.ok) throw new Error("mm-posts"); return r.json(); }),
        fetch(`/api/megamenu/tools?category=${slug}`).then(r => r.ok ? r.json() : []),
      ]).then(([postsData, toolsData]) => {
        cacheRef.current[href] = { posts: postsData.posts, hasMore: postsData.hasMore, tools: toolsData };
        // Only apply if still on this sub
        if (href === currentSubRef.current) {
          setPosts(postsData.posts);
          setHasMorePosts(postsData.hasMore);
          setTools(toolsData);
          setLoading(false);
        }
      }).catch(() => {
        // Fehler NICHT cachen → nächster Aufruf lädt neu (sonst „Beiträge laden nie").
        if (href === currentSubRef.current) setLoading(false);
      });
    }
  };

  // Reset to first subcategory when category changes
  useEffect(() => {
    const first = items[0]?.href || "";
    currentSubRef.current = first;
    setSelectedSub(first);
    applySubData(first);
  }, [items, preloadedData]);

  // Alle Subkategorien der aktiven Kategorie im Hintergrund vorladen, sobald
  // das Megamenü öffnet — so erscheinen die 3 neuesten Beiträge beim Umschalten
  // sofort (ohne Loader), nicht erst nach dem Fetch beim Klick.
  useEffect(() => {
    items.forEach((item) => {
      const href = item.href;
      if (cacheRef.current[href]) return;
      const slug = getCategorySlug(href);
      Promise.all([
        fetch(`/api/megamenu/posts?category=${slug}`).then((r) => { if (!r.ok) throw new Error("mm-posts"); return r.json(); }),
        fetch(`/api/megamenu/tools?category=${slug}`).then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([postsData, toolsData]) => {
          cacheRef.current[href] = { posts: postsData.posts, hasMore: postsData.hasMore, tools: toolsData };
          // Falls der User genau auf diese Sub wartet (Loader sichtbar), sofort zeigen.
          if (href === currentSubRef.current) {
            setPosts(postsData.posts);
            setHasMorePosts(postsData.hasMore);
            setTools(toolsData);
            setLoading(false);
          }
        })
        .catch(() => {
          // Fehler NICHT cachen → bleibt für einen erneuten Versuch offen.
        });
    });
  }, [items]);

  // Switch subcategory
  const switchSub = (href: string) => {
    if (href === selectedSub) return;
    // Aktuellen Inhalt sofort ausblenden (Fade-out) bevor neue Daten kommen
    if (postsBodyRef.current) {
      gsap.to(postsBodyRef.current, { opacity: 0, duration: 0.12, ease: "power1.in" });
    }
    currentSubRef.current = href;
    setSelectedSub(href);
    applySubData(href);
  };

  // Posts-Spalte einblenden, sobald sich der gerenderte Inhalt ändert
  // (neue Sub gewählt, Loader an/aus). Schlichter Fade.
  useEffect(() => {
    const el = postsBodyRef.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
  }, [selectedSub, loading]);

  // Finanztools schlicht „aufblitzen" lassen (Opacity-Fade) — wie die Posts-Spalte
  // in der rechten Booklet-Hälfte, beim Öffnen und bei jedem Inhaltswechsel.
  const toolsNavRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const nav = toolsNavRef.current;
    if (!nav) return;
    gsap.killTweensOf(nav);
    gsap.fromTo(nav, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
  }, [tools]);

  // Keep all seen category navs so they're always in the DOM
  const allNavsRef = useRef<Record<string, NavSubItem[]>>({});
  allNavsRef.current[mainCategoryHref] = items;
  const allNavs = allNavsRef.current;

  // Refs for each nav container
  const navRefsMap = useRef<Record<string, HTMLElement | null>>({});
  const prevCategoryRef = useRef(mainCategoryHref);
  // Track last active sub per category (for exit animation styling)
  const lastSubPerCategory = useRef<Record<string, string>>({});
  lastSubPerCategory.current[mainCategoryHref] = selectedSub;

  // Cross-fade stagger on category switch
  useEffect(() => {
    const prevKey = prevCategoryRef.current;
    const newKey = mainCategoryHref;
    prevCategoryRef.current = newKey;

    if (prevKey === newKey) {
      // First mount: fade in
      const nav = navRefsMap.current[newKey];
      if (nav) {
        const buttons = nav.querySelectorAll(".megamenu-sub-btn");
        gsap.fromTo(buttons, { opacity: 0, y: -25 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" });
      }
      return;
    }

    // Fade old out
    const oldNav = navRefsMap.current[prevKey];
    if (oldNav) {
      const oldBtns = oldNav.querySelectorAll(".megamenu-sub-btn");
      gsap.to(oldBtns, { opacity: 0, y: 25, duration: 0.25, stagger: 0.03, ease: "power2.in" });
    }

    // Fade new in
    const newNav = navRefsMap.current[newKey];
    if (newNav) {
      const newBtns = newNav.querySelectorAll(".megamenu-sub-btn");
      gsap.fromTo(newBtns, { opacity: 0, y: -25 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.15, ease: "power2.out" });
    }
  }, [mainCategoryHref]);

  // Lock container to explicit height on first render
  useEffect(() => {
    const el = containerRef.current;
    if (!el || heightLocked.current) return;
    heightLocked.current = true;
    el.style.height = el.offsetHeight + "px";
  });

  // Animate height after state changes (runs before paint)
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !heightLocked.current) return;

    const prevHeight = el.getBoundingClientRect().height;

    el.style.transition = "none";
    el.style.height = "auto";
    const newHeight = el.getBoundingClientRect().height;

    if (Math.abs(prevHeight - newHeight) < 0.5) {
      el.style.height = prevHeight + "px";
      el.style.transition = "height 0.4s ease-in-out";
      return;
    }

    el.style.height = prevHeight + "px";
    void el.offsetHeight;
    el.style.transition = "height 0.4s ease-in-out";
    el.style.height = newHeight + "px";
  }, [selectedSub, posts, tools, loading]);

  return (
    <div
      style={{ width: "100%", padding: "36px 50px 24px 24px", color: "var(--color-text-primary)" }}
      onClick={(e) => {
        // Klick in den leeren Bereich neben/zwischen den Panels schließt das Menü.
        // Klicks auf die eigentlichen Panels (weißes Booklet, Finanztools, Footer)
        // werden ignoriert.
        if (!(e.target as HTMLElement).closest("[data-megamenu-panel]")) {
          onClose();
        }
      }}
    >
      <div className="megamenu-stage" style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {/* Gray bar — behind bookmark, above overflow:hidden container */}
        <div data-megamenu-panel className="megamenu-seam" style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 27,
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.03)",
          zIndex: 1,
          maxWidth: 860,
        }} />

        {/* Bookmark Divider — above overflow:hidden container */}
        <div data-megamenu-panel className="megamenu-seam" style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: "-4%",
          width: 10,
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          zIndex: 2,
        }}>
          <div style={{
            flex: 1,
            background: "var(--color-brand-secondary)",
            width: "100%",
          }} />
          <img
            src="/icons/small_spikes_down.svg"
            alt=""
            style={{ width: "100%", height: "auto", display: "block" }}
            aria-hidden
          />
        </div>

        {/* Center Container: Subcategories + Posts */}
        <div
          ref={containerRef}
          data-megamenu-panel
          style={{
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderRadius: 36,
          padding: "36px 0 50px 0",
          position: "relative",
          boxShadow: "0 3px 23px rgba(0, 0, 0, 0.02)",
          maxWidth: 860,
          width: "100%",
          minHeight: 300,
          transition: "height 0.4s ease-in-out",
          overflow: "hidden",
        }}>
          {/* Headings row */}
          <div style={{ display: "flex", marginBottom: 0, padding: "0 40px", borderBottom: "1px solid rgba(0, 0, 0, 0.07)", paddingBottom: 16 }}>
            <div style={{ flex: 1, paddingRight: 24 }}>
              <SlideHeading
                text={activeCategoryLabel}
                href={mainCategoryHref}
                onClose={onClose}
                leadingIcon={categoryIconForHref(mainCategoryHref)}
              />
            </div>
            {/* Spacer for bookmark */}
            <div style={{ width: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingLeft: 36 }}>
              <SlideHeading
                text={items.find((item) => item.href === selectedSub)?.label || "Beiträge"}
                href={selectedSub}
                onClose={onClose}
              />
            </div>
          </div>


          {/* Columns */}
          <div style={{ display: "flex", paddingTop: 0 }}>
          {/* Subcategories */}
          <div style={{ width: "50%", flexShrink: 0, position: "relative" }}>
            {Object.entries(allNavs).map(([catHref, catItems]) => {
              const isActive = catHref === mainCategoryHref;
              const activeSub = isActive ? selectedSub : "";
              return (
              <nav
                key={catHref}
                ref={(el) => { navRefsMap.current[catHref] = el; }}
                style={{
                  display: "flex", flexDirection: "column",
                  ...(isActive ? {} : { position: "absolute", top: 0, left: 0, width: "100%", pointerEvents: "none" }),
                }}
              >
              {catItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => switchSub(item.href)}
                  className="megamenu-sub-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "15px 36px 5px 60px",
                    fontSize: 16,
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontStyle: activeSub === item.href ? "normal" : "italic",
                    borderRadius: 0,
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s ease, color 0.15s ease",
                    background: "transparent",
                    color: activeSub === item.href ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontWeight: activeSub === item.href ? 400 : 300,
                  }}
                >
                  {item.label}
                  <span className={`megamenu-sub-line ${activeSub === item.href ? "megamenu-sub-line--active" : ""}`} style={{
                    height: 0,
                    borderTop: "1px solid currentColor",
                    opacity: 1,
                    flexShrink: 0,
                  }} />
                  <svg width="8" height="8" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ flexShrink: 0, transform: "rotate(180deg)", marginLeft: "-12px" }}>                    
                    <polyline points="16.95 15.27 8.27 8.11 16.95 .5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
                  </svg>
                </button>
              ))}
              </nav>
              );
            })}
          </div>

          {/* Posts */}
          <div style={{ width: "50%", flexShrink: 0, paddingLeft: 36, paddingRight: 40, position: "relative", zIndex: 3 }}>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-medium)",
              opacity: 0.6,
              marginTop: 23,          
            }}>
              Neuste Beiträge
            </div>
            <div ref={postsBodyRef} style={{ minHeight: 140 }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 140 }}>
                <SiteLoader size={44} />
              </div>
            ) : posts.length > 0 ? (
              <nav style={{ display: "flex", flexDirection: "column", gap: 13, maxHeight: 320, overflowY: "auto", outline: "1px solid rgba(0, 0, 0, 0.04)", marginTop: 10, padding: "12px 8px" }}>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${activeCategory}/${getCategorySlug(selectedSub)}/${post.slug}`}
                    onClick={onClose}
                    style={{
                      display: "block",
                      color: "var(--color-text-primary)",
                      padding: "6px 12px",
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    className="megamenu-post-link"
                    onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = "#D3005E"; el.querySelectorAll("span, strong").forEach(c => (c as HTMLElement).style.color = "inherit"); }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = "var(--color-text-primary)"; el.querySelectorAll("span, strong").forEach(c => (c as HTMLElement).style.color = ""); }}
                  >
                    {/* Oben: kleiner post.title + Tool-Dots rechts daneben.
                        Darunter: der Kicker (1. Content-h2) als fetter Titel — wie
                        auf der Artikelseite und in den Card-Slidern. */}
                    {(() => {
                      const kicker = post.beitragFelder?.beitragUntertitel?.trim();
                      if (!kicker) {
                        return (
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {boldYears(post.title)}
                            <ToolDots tools={post.tools} />
                          </span>
                        );
                      }
                      return (
                        <>
                          <span style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 400,
                            fontFamily: "var(--font-body)",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.3,
                            marginBottom: 4,
                          }}>
                            <span>{post.title}</span>
                            <ToolDots tools={post.tools} size={8} style={{ marginLeft: 0 }} />
                          </span>
                          <span style={{ display: "block" }}>
                            {boldYears(kicker)}
                          </span>
                        </>
                      );
                    })()}
                  </Link>
                ))}
              </nav>
            ) : (
              <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Keine Beiträge gefunden</div>
            )}
            {!loading && hasMorePosts && (
              <Link
                href={selectedSub}
                onClick={onClose}
                className="megamenu-allposts-link"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 23,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(0, 0, 0, 0.07)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-brand)",
                  textDecoration: "none",
                }}
              >
                Alle Beiträge zu {items.find((item) => item.href === selectedSub)?.label || "dieser Kategorie"}
                <span className="megamenu-sub-line" style={{ height: 0, borderTop: "1px solid currentColor", flexShrink: 0 }} />
                <svg width="8" height="8" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ flexShrink: 0, transform: "rotate(180deg)", marginLeft: -12 }}><polyline points="16.95 15.27 8.27 8.11 16.95 .5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" /></svg>
              </Link>
            )}
            </div>
          </div>
          </div>
        </div>

        {/* Right: Finanztools (transparent, absolute) */}
        <div data-megamenu-panel style={{ position: "absolute", right: 0, top: 0, width: 230, padding: "12px 0", textAlign: "right" }}>
          <Link
            href="/finanztools"
            onClick={onClose}
            style={{
              display: "block",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "var(--font-heading, 'Merriweather', serif)",
              color: "var(--color-text-primary)",
              lineHeight: 1.15,
              marginBottom: 16,
              paddingRight: 10,
              textDecoration: "none",
            }}
          >
            Passende<br />Finanztools
          </Link>
          {tools.length > 0 ? (
            <nav ref={toolsNavRef} style={{ display: "flex", flexDirection: "column", maxHeight: 400, overflowY: "auto", alignItems: "flex-end" }}>
              {tools.map((tool, idx) => (
                <div key={`${tool.type}-${tool.slug}-${idx}`} className="megamenu-tool-item">
                  {idx > 0 && (
                    <div style={{ height: 1, background: "rgba(0, 0, 0, 0.07)", margin: "13px 12px" }} />
                  )}
                  <Link
                    href={`/finanztools/${TOOL_PATH[tool.type]}/${tool.slug}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      padding: "8px 12px",
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      fontFamily: "var(--font-heading, 'Merriweather', serif)",
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                      borderRadius: 8,
                      textAlign: "right",
                      transition: "background 0.15s ease",
                      gap: 3,
                      hyphens: "auto",
                      WebkitHyphens: "auto",
                      wordBreak: "break-word",
                    }}
                    lang="de"
                    className="megamenu-link megamenu-tool-link"
                  >
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "var(--font-body)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: 0,
                      background: TOOL_DOT_COLORS[tool.type],
                    }}>
                      {TOOL_LABEL[tool.type]}
                    </span>
                    {boldYears(tool.title)}
                  </Link>
                </div>
              ))}
            </nav>
          ) : (
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Keine Tools vorhanden</div>
          )}
        </div>
      </div>

      {/* Legal Links — links unter dem Booklet (wie zuvor) */}
      <div data-megamenu-panel style={{
        display: "flex",
        justifyContent: "flex-start",
        marginTop: 16,
        maxWidth: 700,
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[
            { label: "Anbieter", href: "/anbieter" },
            { label: "Dokumente", href: "/dokumente" },
            { label: "Kontakt", href: "/kontakt" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="megamenu-legal-link"
              style={{
                fontSize: 14,
                fontFamily: "var(--font-body)",
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
