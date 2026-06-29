"use client";

import { useRef, useState } from "react";
import { useTransitionRouter } from "@/lib/usePageTransition";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";
import FieldOutline from "@/components/ui/FieldOutline";

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 22" fill="none" style={{ flexShrink: 0 }} aria-hidden>
      <path d="M12.04 16.7812C16.4362 16.7812 20 13.2484 20 8.89059C20 4.53274 16.4362 1 12.04 1C7.64375 1 4.07991 4.53274 4.07991 8.89059C4.07991 13.2484 7.64375 16.7812 12.04 16.7812Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" />
      <path d="M0.591998 17.6095C-0.192466 18.3872 -0.198015 19.6535 0.579603 20.4379C1.35722 21.2224 2.62354 21.228 3.408 20.4503L2 19.0299L0.591998 17.6095ZM6.27569 14.7916L4.86769 13.3712L0.591998 17.6095L2 19.0299L3.408 20.4503L7.68369 16.212L6.27569 14.7916Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Wiederverwendbares Such-Eingabefeld (Pill + Vorschlags-Dropdown). Die Pill ist
 * absolut in einem festen-Höhe-Wrapper → das Dropdown overlayt nach unten (kein
 * Layout-Shift) und liegt IM Pill, sodass die Glas-/Blur-Fläche durchgehend ist.
 * Genutzt auf der Suchseite (SearchHero) und auf der Landing (LandingIntro).
 */
export default function SearchPill({ initialQuery = "" }: { initialQuery?: string }) {
  const { navigate } = useTransitionRouter();
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { matches, setIsOpen, highlight, setHighlight, showDropdown, listWrapRef } =
    useSearchSuggestions(value, wrapperRef);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setIsOpen(false);
    navigate(`/suche?q=${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlight >= 0 && matches[highlight]) {
      submitSearch(matches[highlight].title);
      return;
    }
    submitSearch(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="search-pill-wrap field-wrap field-wrap--dark">
      <FieldOutline radius={19} />
      <form onSubmit={onSubmit} className={`search-pill ${showDropdown ? "is-open" : ""}`}>
        <div className="search-pill__row">
          <span className="search-pill__icon" aria-hidden>
            <SearchIcon size={18} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Suchbegriff eingeben"
            className="search-pill__input search-input"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="search-pill__btn">Suchen</button>
        </div>

        <div ref={listWrapRef} className="search-pill__list-wrap" aria-hidden={!showDropdown}>
          <ul className="search-pill__list" role="listbox">
            {matches.map((s, i) => {
              const [head, tail] = s.parts;
              return (
                <li
                  key={`${s.url}-${i}`}
                  role="option"
                  aria-selected={highlight === i}
                  className={`search-pill__option ${highlight === i ? "is-active" : ""}`}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => { e.preventDefault(); submitSearch(s.title); }}
                >
                  <span className="search-pill__option-icon" aria-hidden>
                    <SearchIcon size={14} />
                  </span>
                  <span className="search-pill__option-text">
                    <span>{head}</span>
                    <strong>{tail}</strong>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </form>

      <style>{`
        .search-pill-wrap {
          position: relative;
          width: 100%;
          height: 52px;
          z-index: 30;
        }
        .search-pill {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--color-pill-bg);
          backdrop-filter: blur(16px) brightness(1.15);
          -webkit-backdrop-filter: blur(16px) brightness(1.15);
          border-radius: 19px;
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }
        .search-pill__row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 6px 6px 6px 20px;
        }
        .search-pill__icon { color: var(--color-text-medium); display: flex; align-items: center; }
        .search-pill__input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: var(--font-body);
          font-size: 17px;
          color: var(--color-text-primary);
          outline: none;
          line-height: 40px;
          padding: 0;
          min-width: 0;
        }
        .search-pill__btn {
          border-radius: 15px;
          padding: 0 20px;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 16px;
          color: #ffffff;
          line-height: 40px;
          white-space: nowrap;
          flex-shrink: 0;
          background-color: var(--color-brand);
          transition: filter 0.15s ease;
        }
        .search-pill__btn:hover { filter: brightness(0.95); }
        .search-pill__list-wrap {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
        }
        .search-pill.is-open .search-pill__list-wrap { opacity: 1; }
        .search-pill__list { list-style: none; margin: 0; padding: 8px 0 13px; }
        .search-pill.is-open .search-pill__list { border-top: 1px solid rgba(0, 0, 0, 0.06); }
        .search-pill__option {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 8px 20px;
          cursor: pointer;
          font-family: var(--font-body);
          font-size: 16px;
          color: var(--color-text-primary);
          line-height: 1.4;
        }
        .search-pill__option.is-active,
        .search-pill__option:hover { background-color: rgba(0, 0, 0, 0.04); }
        .search-pill__option-icon { color: var(--color-text-medium); display: flex; align-items: center; }
        .search-pill__option-text {
          display: inline-flex;
          gap: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .search-pill__option-text > span { font-weight: 400; }
        .search-pill__option-text > strong { font-weight: 700; }
        @media (max-width: 480px) {
          .search-pill__btn { padding: 0 14px; font-size: 14px; }
          .search-pill__row { padding: 6px 6px 6px 14px; }
        }
      `}</style>
    </div>
  );
}
