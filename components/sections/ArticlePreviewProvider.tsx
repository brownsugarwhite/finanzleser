"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Post } from "@/lib/types";
import type { PreviewSliderContext } from "./ArticleSliderContext";
import ArticlePreviewOverlay from "./ArticlePreviewOverlay";

export type PreviewTool = "rechner" | "vergleich" | "checkliste";

export interface PreviewExtras {
  firstParagraph: string;
  readingTime: number;
  tools: PreviewTool[];
}

/**
 * Two ways to open the preview:
 *  - With slider context: enables in-preview navigation (prev/next) between slider posts.
 *  - Standalone single post: no navigation, just the one article (legacy / fallback).
 */
export type OpenPreviewInput =
  | { ctx: PreviewSliderContext; currentIndex: number }
  | { post: Post; cardEl: HTMLElement };

interface PreviewState {
  // Resolved to always have ctx + currentIndex internally.
  // Standalone opens synthesize a single-post context.
  ctx: PreviewSliderContext;
  currentIndex: number;
}

interface ArticlePreviewContextValue {
  openPreview: (input: OpenPreviewInput) => void;
  navigate: (delta: -1 | 1) => void;
  goTo: (index: number) => void;
  closePreview: () => void;
  isOpen: boolean;
}

const ArticlePreviewContext = createContext<ArticlePreviewContextValue | null>(null);

export function useArticlePreview(): ArticlePreviewContextValue {
  const ctx = useContext(ArticlePreviewContext);
  if (!ctx) {
    return {
      openPreview: () => {},
      navigate: () => {},
      goTo: () => {},
      closePreview: () => {},
      isOpen: false,
    };
  }
  return ctx;
}

export default function ArticlePreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreviewState | null>(null);

  const openPreview = useCallback((input: OpenPreviewInput) => {
    setState((prev) => {
      if (prev) return prev;
      if ("ctx" in input) {
        return { ctx: input.ctx, currentIndex: input.currentIndex };
      }
      // Standalone: synthesize a single-post context with a fixed card element.
      const standaloneCtx: PreviewSliderContext = {
        posts: [input.post],
        emblaApi: null,
        getCardEl: () => input.cardEl,
      };
      return { ctx: standaloneCtx, currentIndex: 0 };
    });
  }, []);

  const navigate = useCallback((delta: -1 | 1) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = prev.currentIndex + delta;
      if (next < 0 || next >= prev.ctx.posts.length) return prev;
      // Sync background slider (emblaApi may be null for standalone).
      prev.ctx.emblaApi?.scrollTo(next);
      return { ...prev, currentIndex: next };
    });
  }, []);

  const goTo = useCallback((index: number) => {
    setState((prev) => {
      if (!prev) return prev;
      if (index === prev.currentIndex) return prev;
      if (index < 0 || index >= prev.ctx.posts.length) return prev;
      prev.ctx.emblaApi?.scrollTo(index);
      return { ...prev, currentIndex: index };
    });
  }, []);

  const closePreview = useCallback(() => {
    setState(null);
  }, []);

  return (
    <ArticlePreviewContext.Provider value={{ openPreview, navigate, goTo, closePreview, isOpen: !!state }}>
      {children}
      {state && (
        <ArticlePreviewOverlay
          ctx={state.ctx}
          currentIndex={state.currentIndex}
          onNavigate={navigate}
          onGoTo={goTo}
          onClose={closePreview}
        />
      )}
    </ArticlePreviewContext.Provider>
  );
}
