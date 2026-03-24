"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navItems";

export default function Header() {
  const router = useRouter();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchInput)}`);
      setSearchInput("");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-center relative">
          {/* Logo */}
          <div className="absolute left-0 text-2xl font-bold text-gray-900">
            <Link href="/">finanzleser</Link>
          </div>

          {/* Desktop Nav */}
          <nav className="flex gap-8">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => setOpenSubmenu(item.label)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition ${
                    item.featured
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>

                {/* Desktop Dropdown */}
                {item.submenu && (
                  <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.label}
                        href={subitem.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap first:rounded-t last:rounded-b"
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Search Field */}
          <form onSubmit={handleSearch} className="absolute right-0 flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Suchen..."
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            <Link href="/">finanzleser</Link>
          </div>

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
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <nav className="md:hidden border-t border-gray-200 pt-4">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() =>
                    setOpenSubmenu(openSubmenu === item.label ? null : item.label)
                  }
                  className={`w-full text-left px-0 py-2 text-sm font-medium transition ${
                    item.featured
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
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
      </div>
    </header>
  );
}
