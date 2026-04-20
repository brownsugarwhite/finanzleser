"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Post } from "@/lib/types";
import ArticlePreviewOverlay from "./ArticlePreviewOverlay";

export type PreviewTool = "rechner" | "vergleich" | "checkliste";

export interface PreviewExtras {
  firstParagraph: string;
  readingTime: number;
  tools: PreviewTool[];
}

interface PreviewState {
  post: Post;
  cardEl: HTMLElement;
}

interface ArticlePreviewContextValue {
  openPreview: (post: Post, cardEl: HTMLElement) => void;
  closePreview: () => void;
  isOpen: boolean;
}

const ArticlePreviewContext = createContext<ArticlePreviewContextValue | null>(null);

export function useArticlePreview(): ArticlePreviewContextValue {
  const ctx = useContext(ArticlePreviewContext);
  if (!ctx) {
    // Graceful fallback — never crash if component ends up outside provider during HMR
    return {
      openPreview: () => {},
      closePreview: () => {},
      isOpen: false,
    };
  }
  return ctx;
}

export default function ArticlePreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreviewState | null>(null);

  const openPreview = useCallback((post: Post, cardEl: HTMLElement) => {
    setState((prev) => (prev ? prev : { post, cardEl }));
  }, []);

  const closePreview = useCallback(() => {
    setState(null);
  }, []);

  return (
    <ArticlePreviewContext.Provider value={{ openPreview, closePreview, isOpen: !!state }}>
      {children}
      {state && (
        <ArticlePreviewOverlay
          key={state.post.slug}
          post={state.post}
          sourceCardEl={state.cardEl}
          onClose={closePreview}
        />
      )}
    </ArticlePreviewContext.Provider>
  );
}
