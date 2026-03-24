"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NavSubItem } from "@/lib/navItems";
import type { Post, Rechner } from "@/lib/types";

interface MegaMenuProps {
  activeCategory: string;
  items: NavSubItem[];
  mainCategoryHref: string;
  onClose: () => void;
}

export default function MegaMenu({
  activeCategory,
  items,
  mainCategoryHref,
  onClose,
}: MegaMenuProps) {
  const [selectedSub, setSelectedSub] = useState<string>(items[0]?.href || "");
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [tools, setTools] = useState<Rechner[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract category slug from href (e.g., "/finanzen/geldanlagen" -> "geldanlagen")
  const getCategorySlug = (href: string): string => {
    const parts = href.split("/").filter(Boolean);
    return parts[parts.length - 1];
  };

  // Load tools on mount
  useEffect(() => {
    const loadTools = async () => {
      try {
        const response = await fetch("/api/megamenu/tools");
        if (response.ok) {
          const data = await response.json();
          setTools(data);
        }
      } catch (error) {
        console.error("Error loading tools:", error);
      }
    };
    loadTools();
  }, []);

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
    <div className="max-w-7xl mx-auto px-6 py-8" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Subcategories */}
        <div className="min-h-96">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Kategorien</h3>
          <nav className="space-y-2">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => setSelectedSub(item.href)}
                className={`block w-full text-left px-3 py-2 text-sm rounded transition ${
                  selectedSub === item.href
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Middle Column: Posts */}
        <div className="min-h-96">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Beliebte Beiträge</h3>
          {loading ? (
            <div className="text-sm text-gray-500">Wird geladen...</div>
          ) : posts.length > 0 ? (
            <nav className="space-y-2 max-h-80 overflow-y-auto">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${activeCategory}/${getCategorySlug(selectedSub)}/${post.slug}`}
                  onClick={onClose}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition line-clamp-2"
                >
                  {post.title}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="text-sm text-gray-500">Keine Beiträge gefunden</div>
          )}
          {hasMorePosts && (
            <Link
              href={selectedSub}
              onClick={onClose}
              className="block mt-4 pt-4 border-t border-gray-200 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Alle Beiträge [alle]
            </Link>
          )}
        </div>

        {/* Right Column: Tools */}
        <div className="min-h-96">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Finanztools</h3>
          {tools.length > 0 ? (
            <nav className="space-y-2 max-h-80 overflow-y-auto">
              {tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/finanztools/rechner/${tool.slug}`}
                  onClick={onClose}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition"
                >
                  {tool.title}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="text-sm text-gray-500">Keine Tools vorhanden</div>
          )}
        </div>
      </div>
    </div>
  );
}
