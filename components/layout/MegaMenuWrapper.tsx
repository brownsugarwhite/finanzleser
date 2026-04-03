"use client";

import { useState, useEffect, useRef } from "react";
import { useNavItems } from "@/lib/NavContext";
import MegaMenu from "./MegaMenu";

export default function MegaMenuWrapper() {
  const NAV_ITEMS = useNavItems();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const label = (e as CustomEvent).detail?.label;
      if (!label) return;

      // Find the nav item with this label that has a megamenu
      const item = NAV_ITEMS.find((n) => n.label === label && n.megamenu);
      if (item) {
        setOpenCategory((prev) => (prev === label ? null : label));
      }
    };

    const handleClose = () => {
      setOpenCategory(null);
    };

    window.addEventListener("menu-opened", handleOpen);
    window.addEventListener("menu-closed", handleClose);
    return () => {
      window.removeEventListener("menu-opened", handleOpen);
      window.removeEventListener("menu-closed", handleClose);
    };
  }, [NAV_ITEMS]);

  // Close on outside click
  useEffect(() => {
    if (!openCategory) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
        window.dispatchEvent(new CustomEvent("menu-closed"));
      }
    };

    // Delay to avoid catching the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openCategory]);

  // Fade in with delay
  useEffect(() => {
    if (openCategory) {
      setVisible(false);
      const timer = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [openCategory]);

  // Lock scroll when open
  useEffect(() => {
    if (openCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openCategory]);

  // Close on Escape
  useEffect(() => {
    if (!openCategory) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenCategory(null);
        window.dispatchEvent(new CustomEvent("menu-closed"));
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [openCategory]);

  if (!openCategory) return null;

  const activeItem = NAV_ITEMS.find((n) => n.label === openCategory);
  if (!activeItem?.submenu) return null;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: 73,
        zIndex: 57,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <MegaMenu
        activeCategory={activeItem.href.substring(1)}
        activeCategoryLabel={activeItem.label}
        items={activeItem.submenu}
        mainCategoryHref={activeItem.href}
        onClose={() => {
          setOpenCategory(null);
          window.dispatchEvent(new CustomEvent("menu-closed"));
        }}
      />
    </div>
  );
}
