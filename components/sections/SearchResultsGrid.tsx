"use client";

import { useMemo, useRef } from "react";
import type { Post } from "@/lib/types";
import {
  SliderPreviewContextProvider,
  type PreviewSliderContext,
} from "@/components/sections/ArticleSliderContext";
import SearchResultCard from "./SearchResultCard";

export default function SearchResultsGrid({ posts }: { posts: Post[] }) {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const ctx = useMemo<PreviewSliderContext>(
    () => ({
      posts,
      emblaApi: null,
      getCardEl: (i: number) => cardRefs.current[i] ?? null,
    }),
    [posts],
  );

  return (
    <SliderPreviewContextProvider value={ctx}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-20">
        {posts.map((post, i) => (
          <SearchResultCard
            key={post.id}
            post={post}
            index={i}
            registerRef={(el) => {
              cardRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </SliderPreviewContextProvider>
  );
}
