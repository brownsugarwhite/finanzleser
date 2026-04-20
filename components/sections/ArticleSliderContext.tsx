"use client";

import { createContext, useContext } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import type { Post } from "@/lib/types";

export interface PreviewSliderContext {
  posts: Post[];
  emblaApi: EmblaCarouselType | null;
  /** Returns the card DOM element (with data-flip-id="preview-{slug}-box") at the given index, or null. */
  getCardEl: (index: number) => HTMLElement | null;
}

const Ctx = createContext<PreviewSliderContext | null>(null);

export function useSliderPreviewContext(): PreviewSliderContext | null {
  return useContext(Ctx);
}

export const SliderPreviewContextProvider = Ctx.Provider;
