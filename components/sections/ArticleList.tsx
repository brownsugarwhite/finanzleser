'use client';

import type { Post } from '@/lib/types';
import ArticleListItem from '@/components/ui/ArticleListItem';

interface ArticleListProps {
  posts: Post[];
  mainCategorySlug?: string;
}

export default function ArticleList({ posts, mainCategorySlug }: ArticleListProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      {posts.map((post, index) => {
        const category = post.categories?.nodes?.[0];
        const postLink = mainCategorySlug && category
          ? `/${mainCategorySlug}/${category.slug}/${post.slug}`
          : `/${category?.slug || 'beitraege'}/${post.slug}`;

        return (
          <ArticleListItem
            key={post.id}
            post={post}
            href={postLink}
            bookmarkType={index < 2 ? 'neu' : undefined}
          />
        );
      })}
    </div>
  );
}
