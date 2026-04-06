import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Zentraler State-Hook für alle Rechner.
 * Verwaltet button-disabled, needs-update und scroll-trigger.
 */
export function useRechnerState<P>(params: P) {
  const hasCalculated = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [scrollKey, setScrollKey] = useState(0);
  const paramsRef = useRef(params);

  useEffect(() => {
    if (hasCalculated.current && params !== paramsRef.current) {
      setIsDirty(true);
    }
    paramsRef.current = params;
  }, [params]);

  const markCalculated = useCallback(() => {
    hasCalculated.current = true;
    setIsDirty(false);
    setScrollKey((k) => k + 1);
  }, []);

  return {
    markCalculated,
    buttonDisabled: hasCalculated.current && !isDirty,
    needsUpdate: isDirty,
    scrollKey,
  };
}
