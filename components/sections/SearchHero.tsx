"use client";

import SearchPill from "@/components/sections/SearchPill";

export default function SearchHero({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <div className="search-hero">
      {/* Lupe-Visual + Suche Heading */}
      <div className="search-hero__heading">
        <img className="search-hero__logo" src="/assets/lupeVisual.png" alt="" aria-hidden="true" />
        <h1 className="search-hero__title">Suche</h1>
      </div>

      {/* Geteiltes Such-Eingabefeld (identisch auf der Landing). */}
      <div className="search-hero__pillwrap">
        <SearchPill initialQuery={initialQuery} />
      </div>

      <style>{`
        .search-hero {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 0;
        }
        .search-hero__heading {
          display: flex;
          align-items: flex-end;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 32px;
        }
        .search-hero__logo {
          width: 150px;
          height: auto;
          object-fit: contain;
          flex-shrink: 0;
          display: block;
        }
        .search-hero__title {
          font-family: var(--font-heading, "Merriweather", serif);
          font-weight: 900;
          font-size: 50px;
          line-height: 1;
          color: var(--color-text-primary);
          margin: 0;
        }
        .search-hero__pillwrap {
          width: 100%;
          max-width: 680px;
        }
      `}</style>
    </div>
  );
}
