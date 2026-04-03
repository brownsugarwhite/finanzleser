"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavSubItem } from "@/lib/navItems";
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
    <div style={{ width: "100%", padding: "24px 50px 24px 24px" }} onClick={(e) => e.stopPropagation()}>
      {/* Dark Mode Toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <DarkModeToggle />
      </div>

      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        {/* Center Container: Subcategories + Posts */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderRadius: 36,
          padding: "36px 40px",
          position: "relative",
          maxWidth: 760,
          width: "100%",
          minHeight: 300,
        }}>
          {/* Headings row */}
          <div style={{ display: "flex", marginBottom: 0 }}>
            <div style={{ flex: 1, paddingRight: 24 }}>
              <Link
                href={mainCategoryHref}
                onClick={onClose}
                style={{
                  display: "block",
                  fontSize: 20,
                  fontWeight: 760,
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
          <div style={{ height: 1, background: "rgba(0, 0, 0, 0.07)", margin: "16px -40px", width: "calc(100% + 80px)" }} />

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
          <div style={{ display: "flex", paddingTop: 8 }}>
          {/* Subcategories */}
          <div style={{ flex: 1, paddingRight: 24 }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
              {items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => setSelectedSub(item.href)}
                  style={{
                    display: "inline-block",
                    textAlign: "left",
                    padding: "6px 12px",
                    fontSize: 16,
                    fontFamily: "var(--font-body)",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s ease, color 0.15s ease",
                    background: selectedSub === item.href ? "var(--color-bg-subtle)" : "transparent",
                    color: selectedSub === item.href ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontWeight: selectedSub === item.href ? 600 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Spacer for bookmark */}
          <div style={{ width: 10, flexShrink: 0 }} />

          {/* Posts */}
          <div style={{ flex: 1, paddingLeft: 36 }}>
            {loading ? (
              <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Wird geladen...</div>
            ) : posts.length > 0 ? (
              <nav style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
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
                      color: "var(--color-text-secondary)",
                      textDecoration: "none",
                      borderRadius: 8,
                      transition: "background 0.15s ease",
                    }}
                    className="megamenu-link"
                  >
                    {post.title}
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
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(0, 0, 0, 0.07)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-brand)",
                  textDecoration: "none",
                }}
              >
                Alle Beiträge ansehen →
              </Link>
            )}
          </div>
          </div>
        </div>

        {/* Right: Finanztools (transparent, absolute) */}
        <div style={{ position: "absolute", right: 0, top: 0, width: 250, padding: "12px 0", textAlign: "right" }}>
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
                      fontSize: 14,
                      fontFamily: "var(--font-body)",
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                      borderRadius: 8,
                      textAlign: "right",
                      transition: "background 0.15s ease",
                      gap: 3,
                    }}
                    className="megamenu-link"
                  >
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
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
                    {tool.title}
                  </Link>
                </div>
              ))}
            </nav>
          ) : (
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Keine Tools vorhanden</div>
          )}
        </div>
      </div>
    </div>
  );
}
