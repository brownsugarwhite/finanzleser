"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchSection() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/suche?q=${encodeURIComponent(searchInput)}`);
      setSearchInput("");
    }
  };

  return (
    <section className="py-16 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          Suche
        </h2>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Suchbegriff eingeben..."
              className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition whitespace-nowrap"
            >
              Suchen
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
