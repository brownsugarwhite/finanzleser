"use client";

import type { Post } from "@/lib/types";
import SearchResultCard from "./SearchResultCard";

export default function SearchResultsGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-20">
      {posts.map((post) => (
        <SearchResultCard key={post.id} post={post} />
      ))}
    </div>
  );
}
