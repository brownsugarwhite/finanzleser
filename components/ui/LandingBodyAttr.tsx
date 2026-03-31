"use client";

import { useEffect } from "react";

export default function LandingBodyAttr() {
  useEffect(() => {
    document.body.setAttribute("data-landing", "");
    return () => document.body.removeAttribute("data-landing");
  }, []);
  return null;
}
