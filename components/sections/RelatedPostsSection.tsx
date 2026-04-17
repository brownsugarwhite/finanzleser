"use client";

import { useEffect, useState, useCallback } from "react";
import ArticleSlider from "@/components/sections/ArticleSlider";
import SliderNav from "@/components/ui/SliderNav";
import type { Post } from "@/lib/types";

interface RelatedPostsSectionProps {
  categoryIds: number[];
  excludeSlug?: string;
  postsToShow?: number;
}

interface NavState {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
}

export default function RelatedPostsSection({
  categoryIds,
  excludeSlug,
  postsToShow = 10,
}: RelatedPostsSectionProps) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [nav, setNav] = useState<NavState | null>(null);

  useEffect(() => {
    if (categoryIds.length === 0) {
      setPosts([]);
      return;
    }
    const params = new URLSearchParams({
      cats: categoryIds.join(","),
      limit: String(postsToShow),
      ...(excludeSlug ? { excludeSlug } : {}),
    });
    fetch(`/api/related-posts?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => setPosts([]));
  }, [categoryIds.join(","), excludeSlug, postsToShow]);

  const handleNavReady = useCallback((n: NavState) => setNav(n), []);

  if (posts === null) return null;
  if (posts.length === 0) return null;

  return (
    <section className="related-posts-section" aria-labelledby="related-posts-heading">
      <h2 id="related-posts-heading" className="related-posts-heading" data-toc-exclude>
        Das könnte Sie auch interessieren
      </h2>
      <ArticleSlider posts={posts} onNavReady={handleNavReady} />
      {nav && (
        <div className="related-posts-nav">
          <SliderNav {...nav} />
        </div>
      )}
    </section>
  );
}
