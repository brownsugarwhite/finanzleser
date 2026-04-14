"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChecklisteLayoutContext } from "./ChecklisteLayoutContext";

interface Props {
  children: React.ReactNode;
}

export default function ChecklisteDetailWrapper({ children }: Props) {
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(null);
  const visualRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Find the visual placeholder and place the portal container at its bottom
    const visual = document.querySelector(".checkliste-detail-visual");
    if (visual) {
      visualRef.current = visual as HTMLDivElement;
      const portal = document.createElement("div");
      portal.style.cssText = "display:flex;justify-content:flex-end;padding:12px 16px;margin-top:auto;";
      visual.appendChild(portal);
      setActionsContainer(portal);
      return () => { portal.remove(); };
    }
  }, []);

  return (
    <ChecklisteLayoutContext.Provider value={{ actionsContainer }}>
      {children}
    </ChecklisteLayoutContext.Provider>
  );
}
