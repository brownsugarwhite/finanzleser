"use client";

import { createContext, useContext } from "react";

interface RechnerLayoutContextValue {
  resultsContainer: HTMLElement | null;
}

export const RechnerLayoutContext = createContext<RechnerLayoutContextValue>({
  resultsContainer: null,
});

export function useRechnerLayout() {
  return useContext(RechnerLayoutContext);
}
