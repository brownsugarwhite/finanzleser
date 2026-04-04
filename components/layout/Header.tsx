"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useNavItems } from "@/lib/NavContext";
import { useNavPill } from "@/hooks/useNavPill";
import MegaMenu from "./MegaMenu";
import Spacer from "@/components/ui/Spacer";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

const Spark = () => (
  <svg width="12" height="12" viewBox="0 0 12 12.0005" fill="none" aria-hidden style={{ pointerEvents: "none", display: "block" }}>
    <path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="var(--fill-0, #334A27)"/>
  </svg>
);

export default function Header() {
  const router = useRouter();
  const NAV_ITEMS = useNavItems();
  const [openMegamenu, setOpenMegamenu] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const megamenuRef = useRef<HTMLDivElement>(null);

  const pill = useNavPill({
    items: NAV_ITEMS,
    hasLens: true,
    onActivate: (label) => {
      setOpenMegamenu(label);
    },
  });

  // Close megamenu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if ((target as HTMLElement).closest?.("[data-nav-pill]")) return;
      if (megamenuRef.current && !megamenuRef.current.contains(target)) {
        setOpenMegamenu(null);
        pill.closeMenu();
      }
    };

    if (openMegamenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMegamenu, pill]);

  // Listen for mega-closed event
  useEffect(() => {
    const onMegaClosed = () => {
      setOpenMegamenu(null);
      pill.closeMenu();
    };
    window.addEventListener("mega-closed", onMegaClosed);
    return () => window.removeEventListener("mega-closed", onMegaClosed);
  }, [pill]);

  // Lens sync
  useEffect(() => {
    const sync = () => {
      if (!pill.pillRef.current || !pill.lensRef.current) return;
      const px = gsap.getProperty(pill.pillRef.current, "x") as number;
      const pw = gsap.getProperty(pill.pillRef.current, "width") as number;
      gsap.set(pill.lensRef.current, { x: -px });
      pill.lensRef.current.style.transformOrigin = `${px + pw / 2}px center`;
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, [pill.pillRef, pill.lensRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchInput)}`);
      setSearchInput("");
    }
  };

  return (
    <header ref={megamenuRef}>
      {/* Desktop Layout */}
      <div className="topbar-grid hidden md:flex" style={{ position: "absolute", zIndex: 51, pointerEvents: "none" }}>
        <div className="logo-space" />
        <div className="nav-space" data-nav-pill style={{ pointerEvents: "auto" }}>
          <div
            {...pill.containerProps}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: 600,
              height: 50,
            }}
          >
            {pill.renderPill()}

            {NAV_ITEMS.map((item, i) => (
              <Fragment key={item.href}>
                <Spark />
                <button
                  {...pill.getButtonProps(i)}
                  style={{
                    fontFamily: "var(--font-heading, 'Merriweather', serif)",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "var(--color-nav-text)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "12px 20px",
                    margin: "0 -20px",
                    position: "relative",
                    zIndex: 3,
                  }}
                >
                  {item.label}
                </button>
              </Fragment>
            ))}
            <Spark />
          </div>
        </div>
        <div className="free-space" />
      </div>

      <Spacer noMargin />

      {/* Megamenu Overlay – immer gemounted */}
      <div
        className="fixed left-0 right-0 z-50 bg-white border-t border-gray-200"
        style={{
          top: 73,
          visibility: openMegamenu ? "visible" : "hidden",
          pointerEvents: openMegamenu ? "auto" : "none",
        }}
      >
        <MegaMenu
          activeCategory={(NAV_ITEMS.find((item) => item.label === openMegamenu) || NAV_ITEMS[0])?.href.substring(1) || ""}
          activeCategoryLabel={openMegamenu || NAV_ITEMS[0]?.label || ""}
          items={(NAV_ITEMS.find((item) => item.label === openMegamenu) || NAV_ITEMS[0])?.submenu || []}
          mainCategoryHref={(NAV_ITEMS.find((item) => item.label === openMegamenu) || NAV_ITEMS[0])?.href || ""}
          onClose={() => {
            setOpenMegamenu(null);
            pill.closeMenu();
          }}
        />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-700 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden mt-4 border-t border-gray-200 pt-4 pb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Suchen..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-2 text-gray-700 hover:text-gray-900 transition"
            aria-label="Search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 pt-4 pb-4">
          {/* Dark Mode Toggle */}
          <div className="flex justify-end mb-4 px-0">
            <DarkModeToggle />
          </div>

          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <button
                onClick={() =>
                  setOpenSubmenu(openSubmenu === item.label ? null : item.label)
                }
                className="w-full text-left px-0 py-2 text-sm font-medium transition text-gray-700 hover:text-gray-900"
              >
                {item.label}
              </button>

              {/* Mobile Dropdown */}
              {item.submenu && openSubmenu === item.label && (
                <div className="bg-gray-50 rounded my-2">
                  {item.submenu.map((subitem) => (
                    <Link
                      key={subitem.label}
                      href={subitem.href}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
