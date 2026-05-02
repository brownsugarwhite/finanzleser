"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Post } from "@/lib/types";
import type { PreviewSliderContext } from "./ArticleSliderContext";
import ArticlePreviewOverlay from "./ArticlePreviewOverlay";
import { scrollToBookmarkSticky } from "@/lib/scrollToBookmarkSticky";

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
  prefetchExtras: (slug: string) => void;
  // extrasCache absichtlich NICHT im Context — Cards brauchen es nicht
  // (nur das Overlay), aber jeder API-Response würde sonst alle Cards
  // re-rendern → Main-Thread-Backlog auf Mobile.
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
      prefetchExtras: () => {},
    };
  }
  return ctx;
}

export default function ArticlePreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreviewState | null>(null);
  const [extrasCache, setExtrasCache] = useState<Record<string, PreviewExtras>>({});
  const inflightRef = useRef<Set<string>>(new Set());
  // Spiegelt extrasCache als Ref, damit prefetchExtras stabil bleiben kann
  // (kein extrasCache-Dep). Sonst wird die Funktion bei jeder API-Response
  // neu erzeugt → das Context-Value-Objekt ändert sich → ALLE Cards (200+)
  // re-rendern bei jedem Hover-Prefetch → progressiver UI-Slowdown.
  const extrasCacheRef = useRef(extrasCache);
  useEffect(() => { extrasCacheRef.current = extrasCache; }, [extrasCache]);

  const prefetchExtras = useCallback((slug: string) => {
    if (!slug) return;
    if (extrasCacheRef.current[slug]) return;
    if (inflightRef.current.has(slug)) return;
    inflightRef.current.add(slug);
    fetch(`/api/article-preview?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PreviewExtras | null) => {
        if (data) {
          setExtrasCache((prev) => (prev[slug] ? prev : { ...prev, [slug]: data }));
        }
      })
      .catch(() => {})
      .finally(() => {
        inflightRef.current.delete(slug);
      });
  }, []);

  const openPreview = useCallback((input: OpenPreviewInput) => {
    scrollToBookmarkSticky();
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
      return { ...prev, currentIndex: next };
    });
  }, []);

  const goTo = useCallback((index: number) => {
    setState((prev) => {
      if (!prev) return prev;
      if (index === prev.currentIndex) return prev;
      if (index < 0 || index >= prev.ctx.posts.length) return prev;
      return { ...prev, currentIndex: index };
    });
  }, []);

  // Embla-Sync nach Render-Commit, damit setState-Updater pure bleiben.
  // Synchroner scrollTo im Updater löste "Cannot update component while
  // rendering different component"-Warning aus, weil Embla per Event-Bus
  // sofort setSelectedIndex in ArticleSlider triggerte.
  // Nur bei Index-Wechseln INNERHALB eines offenen Previews syncen — beim
  // ersten Open (null → state) nicht, sonst springt die Source-Card und
  // der Open-Morph misst falsche Rects.
  const lastSyncedIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (!state) {
      lastSyncedIndexRef.current = null;
      return;
    }
    if (lastSyncedIndexRef.current === null) {
      // Erster Render mit state → Open. Kein Sync.
      lastSyncedIndexRef.current = state.currentIndex;
      return;
    }
    if (lastSyncedIndexRef.current !== state.currentIndex) {
      // +1 wegen Leading-Spacer: ArticleSlider rendert <spacer><card0><card1>…
      // emblaApi.slideNodes() enthält den Spacer an Index 0. Um zu Card N zu
      // scrollen muss scrollTo(N + 1) gerufen werden — sonst landet die Card
      // eine Position weiter rechts als gewünscht. Auf Desktop fiel das nicht
      // auf weil der Viewport breit genug war; auf Mobile (schmaler Viewport
      // + flexBasis-0-Spacer) slidet die Ziel-Card aus dem sichtbaren Bereich.
      state.ctx.emblaApi?.scrollTo(state.currentIndex + 1, true);
      lastSyncedIndexRef.current = state.currentIndex;
    }
  }, [state]);

  const closePreview = useCallback(() => {
    setState(null);
  }, []);

  // Context-Value memoizen, damit Consumer (Cards via useArticlePreview())
  // nicht bei jedem Provider-Re-Render unnötig re-rendern. Ändert sich nur
  // wenn isOpen flippt — extrasCache und prefetchExtras sind absichtlich
  // raus (extrasCache wird direkt ans Overlay geprop't, prefetchExtras ist
  // durch die ref-basierte Implementation stabil ohne Deps).
  const isOpen = !!state;
  const value = useMemo(
    () => ({ openPreview, navigate, goTo, closePreview, isOpen, prefetchExtras }),
    [openPreview, navigate, goTo, closePreview, isOpen, prefetchExtras]
  );

  return (
    <ArticlePreviewContext.Provider value={value}>
      {children}
      {state && (
        <ArticlePreviewOverlay
          ctx={state.ctx}
          currentIndex={state.currentIndex}
          onNavigate={navigate}
          onGoTo={goTo}
          onClose={closePreview}
          extrasCache={extrasCache}
          prefetchExtras={prefetchExtras}
        />
      )}
    </ArticlePreviewContext.Provider>
  );
}
