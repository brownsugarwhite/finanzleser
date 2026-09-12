"use client";

/**
 * Wächter-Schalter des Lesers (Stufe 1: nur in diesem Browser, localStorage `faden-waechter`).
 * Die Regeln selbst kommen aus dem CMS (`getFadenOptionen().waechterRegeln`).
 */
import { useCallback, useEffect, useState } from "react";

const KEY = "faden-waechter";
const EREIGNIS = "faden:waechter";

export function leseWaechter(): Record<string, boolean> {
  try {
    const roh = JSON.parse(localStorage.getItem(KEY) || "{}");
    return roh && typeof roh === "object" ? Object.fromEntries(Object.entries(roh).map(([k, v]) => [k, !!v])) : {};
  } catch { return {}; }
}

export function useWaechter(): [Record<string, boolean>, (key: string, an: boolean) => void] {
  const [stand, setStand] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setStand(leseWaechter());
    const h = () => setStand(leseWaechter());
    window.addEventListener(EREIGNIS, h);
    return () => window.removeEventListener(EREIGNIS, h);
  }, []);
  const setzen = useCallback((key: string, an: boolean) => {
    const neu = { ...leseWaechter(), [key]: an };
    try { localStorage.setItem(KEY, JSON.stringify(neu)); } catch { /* egal */ }
    window.dispatchEvent(new Event(EREIGNIS));
  }, []);
  return [stand, setzen];
}
