import { useState, useCallback, useRef } from "react";

export function useRechner<P, R>(
  initialParams: P,
  calculate: (params: P) => R
) {
  const [params, setParams] = useState<P>(initialParams);
  const [result, setResult] = useState<R | null>(null);
  const hasCalculated = useRef(false);
  const [isDirty, setIsDirty] = useState(false);

  const set = useCallback(<K extends keyof P>(key: K, val: P[K]) => {
    setParams((p) => ({ ...p, [key]: val }));
    if (hasCalculated.current) {
      setIsDirty(true);
    }
  }, []);

  const handleBerechnen = useCallback(() => {
    setResult(calculate(params));
    hasCalculated.current = true;
    setIsDirty(false);
  }, [params, calculate]);

  return {
    params,
    setParams,
    result,
    set,
    handleBerechnen,
    buttonDisabled: hasCalculated.current && !isDirty,
    needsUpdate: isDirty,
  };
}
