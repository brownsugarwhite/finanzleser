"use client";

import { createContext, useContext } from "react";

interface ChecklisteLayoutContextValue {
  actionsContainer: HTMLElement | null;
}

export const ChecklisteLayoutContext = createContext<ChecklisteLayoutContextValue>({
  actionsContainer: null,
});

export function useChecklisteLayout() {
  return useContext(ChecklisteLayoutContext);
}
