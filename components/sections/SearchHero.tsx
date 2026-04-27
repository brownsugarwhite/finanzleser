"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 22"
      fill="none"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path
        d="M12.04 16.7812C16.4362 16.7812 20 13.2484 20 8.89059C20 4.53274 16.4362 1 12.04 1C7.64375 1 4.07991 4.53274 4.07991 8.89059C4.07991 13.2484 7.64375 16.7812 12.04 16.7812Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
      />
      <path
        d="M0.591998 17.6095C-0.192466 18.3872 -0.198015 19.6535 0.579603 20.4379C1.35722 21.2224 2.62354 21.228 3.408 20.4503L2 19.0299L0.591998 17.6095ZM6.27569 14.7916L4.86769 13.3712L0.591998 17.6095L2 19.0299L3.408 20.4503L7.68369 16.212L6.27569 14.7916Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SearchHero({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    matches,
    setIsOpen,
    highlight,
    setHighlight,
    showDropdown,
    listWrapRef,
  } = useSearchSuggestions(value, wrapperRef);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setIsOpen(false);
    router.push(`/suche?q=${encodeURIComponent(trimmed)}`);
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
    <div className="search-hero">
      {/* Logo-Platzhalter + Suche Heading */}
      <div className="search-hero__heading">
        <div className="search-hero__logo" aria-hidden="true" title="Visual-Platzhalter" />
        <h1 className="search-hero__title">Suche</h1>
      </div>

      {/* Pill + Suggestions */}
      <div ref={wrapperRef} className="search-hero__wrap">
        <form
          onSubmit={onSubmit}
          className={`search-hero__pill ${showDropdown ? "is-open" : ""}`}
        >
          <div className="search-hero__row">
            <span className="search-hero__icon" aria-hidden>
              <SearchIcon size={18} />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Suchbegriff eingeben"
              className="search-hero__input search-input"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="search-hero__btn">
              Suchen
            </button>
          </div>

          <div ref={listWrapRef} className="search-hero__list-wrap" aria-hidden={!showDropdown}>
            <ul className="search-hero__list" role="listbox">
              {matches.map((s, i) => {
                const [head, tail] = s.parts;
                return (
                  <li
                    key={`${s.url}-${i}`}
                    role="option"
                    aria-selected={highlight === i}
                    className={`search-hero__option ${highlight === i ? "is-active" : ""}`}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      submitSearch(s.title);
                    }}
                  >
                    <span className="search-hero__option-icon" aria-hidden>
                      <SearchIcon size={14} />
                    </span>
                    <span className="search-hero__option-text">
                      <span>{head}</span>
                      <strong>{tail}</strong>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </form>
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
          height: 150px;
          background: var(--color-placeholder-bg);
          flex-shrink: 0;
        }
        .search-hero__title {
          font-family: var(--font-heading, "Merriweather", serif);
          font-weight: 900;
          font-size: 50px;
          line-height: 1;
          color: var(--color-text-primary);
          margin: 0;
        }
        .search-hero__wrap {
          width: 100%;
          max-width: 680px;
          position: relative;
          height: 52px;
          z-index: 30;
        }
        .search-hero__pill {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          background-color: var(--color-pill-bg);
          backdrop-filter: blur(16px) brightness(1.15);
          -webkit-backdrop-filter: blur(16px) brightness(1.15);
          border-radius: 19px;
          box-shadow: 0 3px 23px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }
        .search-hero__row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 6px 6px 6px 20px;
        }
        .search-hero__icon {
          color: var(--color-text-medium);
          display: flex;
          align-items: center;
        }
        .search-hero__input {
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
        .search-hero__btn {
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
        .search-hero__btn:hover { filter: brightness(0.95); }

        .search-hero__list-wrap {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
        }
        .search-hero__pill.is-open .search-hero__list-wrap {
          opacity: 1;
        }
        .search-hero__list {
          list-style: none;
          margin: 0;
          padding: 8px 0 13px;
        }
        .search-hero__pill.is-open .search-hero__list {
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .search-hero__option {
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
        .search-hero__option.is-active,
        .search-hero__option:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
        .search-hero__option-icon {
          color: var(--color-text-medium);
          display: flex;
          align-items: center;
        }
        .search-hero__option-text {
          display: inline-flex;
          gap: 0;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .search-hero__option-text > span { font-weight: 400; }
        .search-hero__option-text > strong { font-weight: 700; }

        @media (max-width: 480px) {
          .search-hero__btn {
            padding: 0 14px;
            font-size: 14px;
          }
          .search-hero__row {
            padding: 6px 6px 6px 14px;
          }
        }
      `}</style>
    </div>
  );
}
