"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavSubItem } from "@/lib/navItems";

function boldYears(text: string) {
  const parts = text.split(/(20\d{2}(?:\/\d{2,4})?)/g);
  return <span>{parts.map((part, i) =>
    /^20\d{2}/.test(part) ? <strong key={i} style={{ fontWeight: 900 }}>{part}</strong> : part
  )}</span>;
}
import type { Post, Rechner } from "@/lib/types";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

interface MegaMenuProps {
  activeCategory: string;
  activeCategoryLabel: string;
  items: NavSubItem[];
  mainCategoryHref: string;
  onClose: () => void;
}

export default function MegaMenu({
  activeCategory,
  activeCategoryLabel,
  items,
  mainCategoryHref,
  onClose,
}: MegaMenuProps) {
  const [selectedSub, setSelectedSub] = useState<string>(items[0]?.href || "");
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [tools, setTools] = useState<Rechner[]>([]);
  const [loading, setLoading] = useState(false);

  const toolCategory = items.find((item) => item.href === selectedSub)?.toolCategory || "rechner";

  // Extract category slug from href (e.g., "/finanzen/geldanlagen" -> "geldanlagen")
  const getCategorySlug = (href: string): string => {
    const parts = href.split("/").filter(Boolean);
    return parts[parts.length - 1];
  };

  // Load tools based on selected subcategory
  useEffect(() => {
    const loadTools = async () => {
      setLoading(true);
      try {
        // Extract subcategory slug from href (e.g., "/finanzen/geldanlagen" -> "geldanlagen")
        const subCategorySlug = getCategorySlug(selectedSub);

        if (subCategorySlug) {
          // Fetch tools by subcategory
          const response = await fetch(`/api/megamenu/tools?category=${subCategorySlug}`);
          if (response.ok) {
            const data = await response.json();
            setTools(data);
          }
        } else {
          setTools([]);
        }
      } catch (error) {
        console.error("Error loading tools:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSub) {
      loadTools();
    }
  }, [selectedSub]);

  // Reset to first subcategory when category changes
  useEffect(() => {
    setSelectedSub(items[0]?.href || "");
  }, [items]);

  // Load posts when selectedSub changes
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const slug = getCategorySlug(selectedSub);
        const response = await fetch(`/api/megamenu/posts?category=${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
          setHasMorePosts(data.hasMore);
        }
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSub) {
      loadPosts();
    }
  }, [selectedSub]);

  return (
    <div style={{ width: "100%", padding: "36px 50px 24px 24px", color: "var(--color-text-primary)" }} onClick={(e) => e.stopPropagation()}>
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {/* Center Container: Subcategories + Posts */}
        <div style={{
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
        }}>
          {/* Headings row */}
          <div style={{ display: "flex", marginBottom: 0, padding: "0 40px" }}>
            <div style={{ flex: 1, paddingRight: 24 }}>
              <Link
                href={mainCategoryHref}
                onClick={onClose}
                style={{
                  display: "block",
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                }}
              >
                {activeCategoryLabel}
              </Link>
            </div>
            {/* Spacer for bookmark */}
            <div style={{ width: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, paddingLeft: 36 }}>
              <Link
                href={selectedSub}
                onClick={onClose}
                style={{
                  display: "block",
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: "var(--font-heading, 'Merriweather', serif)",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                }}
              >
                {items.find((item) => item.href === selectedSub)?.label || "Beiträge"}
              </Link>
            </div>
          </div>

          {/* Divider line */}
          <div style={{ height: 1, background: "rgba(0, 0, 0, 0.07)", margin: "16px 0px 0px 0px", width: "100%" }} />

          {/* Gray bar — full height behind bookmark */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 27,
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.03)",
            zIndex: 1,
          }} />

          {/* Bookmark Divider — absolute, full height */}
          <div style={{
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

          {/* Columns */}
          <div style={{ display: "flex", paddingTop: 0 }}>
          {/* Subcategories */}
          <div style={{ width: "50%", flexShrink: 0 }}>
            <nav style={{ display: "flex", flexDirection: "column" }}>
              {items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => setSelectedSub(item.href)}
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
                    fontStyle: selectedSub === item.href ? "normal" : "italic",
                    borderRadius: 0,
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s ease, color 0.15s ease",
                    background: "transparent",
                    color: selectedSub === item.href ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontWeight: selectedSub === item.href ? 400 : 300,
                  }}
                >
                  {item.label}
                  <span className={`megamenu-sub-line ${selectedSub === item.href ? "megamenu-sub-line--active" : ""}`} style={{
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
          </div>

          {/* Posts */}
          <div style={{ width: "50%", flexShrink: 0, paddingLeft: 36, paddingRight: 40, position: "relative", zIndex: 3 }}>
            <div style={{
              fontFamily: "var(--font-heading, 'Merriweather', serif)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginTop: 23,          
            }}>
              Neuste Beiträge
            </div>
            {loading ? (
              <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Wird geladen...</div>
            ) : posts.length > 0 ? (
              <nav style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto", outline: "1px solid rgba(0, 0, 0, 0.04)", marginTop: 10, padding: "12px 8px" }}>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${activeCategory}/${getCategorySlug(selectedSub)}/${post.slug}`}
                    onClick={onClose}
                    style={{
                      display: "block",
                      padding: "6px 12px",
                      fontSize: 14,
                      fontFamily: "var(--font-body)",
                      textDecoration: "none",
                      transition: "color 0.15s ease",
                    }}
                    className="megamenu-link"
                    onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = "#D3005E"; el.querySelectorAll("span, strong").forEach(c => (c as HTMLElement).style.color = "inherit"); }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = ""; el.querySelectorAll("span, strong").forEach(c => (c as HTMLElement).style.color = ""); }}
                  >
                    {boldYears(post.title)}
                  </Link>
                ))}
              </nav>
            ) : (
              <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Keine Beiträge gefunden</div>
            )}
            {hasMorePosts && (
              <Link
                href={selectedSub}
                onClick={onClose}
                style={{
                  display: "block",
                  marginTop: 23,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(0, 0, 0, 0.07)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-brand)",
                  textDecoration: "none",
                }}
              >
                Alle Beiträge ansehen <span style={{ display: "inline-block", width: 13, height: 0, borderTop: "1px solid currentColor", verticalAlign: "middle", marginLeft: 4 }} /><svg width="8" height="8" viewBox="0 0 17.45 15.77" fill="none" aria-hidden style={{ flexShrink: 0, transform: "rotate(180deg)", display: "inline", verticalAlign: "middle", marginLeft: -4 }}><polyline points="16.95 15.27 8.27 8.11 16.95 .5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" /></svg>
              </Link>
            )}
          </div>
          </div>
        </div>

        {/* Right: Finanztools (transparent, absolute) */}
        <div style={{ position: "absolute", right: 0, top: 0, width: 230, padding: "12px 0", textAlign: "right" }}>
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
            <nav style={{ display: "flex", flexDirection: "column", maxHeight: 400, overflowY: "auto", alignItems: "flex-end" }}>
              {tools.map((tool, idx) => (
                <div key={tool.id}>
                  {idx > 0 && (
                    <div style={{ height: 1, background: "rgba(0, 0, 0, 0.07)", margin: "13px 12px" }} />
                  )}
                  <Link
                    href={`/finanztools/rechner/${tool.slug}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      padding: "8px 12px",
                      fontSize: 15,
                      fontWeight: 500,
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
                      background: toolCategory === "rechner"
                        ? "var(--color-tool-rechner)"
                        : toolCategory === "vergleich"
                        ? "var(--color-tool-vergleiche)"
                        : "var(--color-tool-checklisten)",
                    }}>
                      {toolCategory === "rechner" ? "Rechner" : toolCategory === "vergleich" ? "Vergleich" : "Checkliste"}
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

      {/* Legal Links + Dark Mode Toggle */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 16,
        maxWidth: 700,
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {[
            { label: "Impressum", href: "/impressum" },
            { label: "Datenschutz", href: "/datenschutz" },
            { label: "AGB", href: "/agb" },
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
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 14,
            fontFamily: "var(--font-body)",
            color: "var(--color-text-secondary)",
          }}>
            Modus
          </span>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
