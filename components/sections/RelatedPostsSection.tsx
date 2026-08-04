"use client";

import { useState, useCallback } from "react";
import ArticleSlider from "@/components/sections/ArticleSlider";
import SliderNav from "@/components/ui/SliderNav";
import type { Post } from "@/lib/types";

// Rein präsentational: Posts kommen serverseitig aus ArticleLayout (ISR) —
// der frühere /api/related-posts-Client-Fetch ist entfallen.
interface RelatedPostsSectionProps {
  posts: Post[];
}

interface NavState {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
}

export default function RelatedPostsSection({ posts }: RelatedPostsSectionProps) {
  const [nav, setNav] = useState<NavState | null>(null);

  const handleNavReady = useCallback((n: NavState) => setNav(n), []);

  if (posts.length === 0) return null;

  return (
    <section className="related-posts-section" aria-labelledby="related-posts-heading">
      <h2 id="related-posts-heading" className="related-posts-heading" data-toc-exclude>
        Das könnte Sie auch interessieren
      </h2>
      <ArticleSlider posts={posts} onNavReady={handleNavReady} sideArrows />
      {nav && (
        <div className="related-posts-nav">
          <SliderNav {...nav} />
        </div>
      )}
    </section>
  );
}
