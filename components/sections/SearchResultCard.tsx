"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";
import VisualLottie from "@/components/ui/VisualLottie";
import InlineSVG from "@/components/ui/InlineSVG";
import { useArticlePreview } from "@/components/sections/ArticlePreviewProvider";

export default function SearchResultCard({ post }: { post: Post }) {
  const [infoHovered, setInfoHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { openPreview, prefetchExtras } = useArticlePreview();

  const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
  const category =
    post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) ||
    post.categories?.nodes?.[0];
  const postLink = `/${mainCategory?.slug || "beitraege"}/${
    category?.slug || "allgemein"
  }/${post.slug}`;

  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const titleText = untertitel || post.title;
  const sublineText = untertitel ? post.title : null;
  const excerpt = (post.excerpt || "").replace(/<[^>]*>/g, "").trim();
  const truncatedExcerpt =
    excerpt.length > 200
      ? excerpt.slice(0, 200).replace(/\s+\S*$/, "") + " …"
      : excerpt;

  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cardRef.current) openPreview({ post, cardEl: cardRef.current });
  };

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => prefetchExtras(post.slug)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      {/* Visual */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 210,
          overflow: "hidden",
        }}
      >
        <VisualLottie seed={post.slug} />
        {post.featuredImage?.node?.sourceUrl && (
          <img
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || ""}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              zIndex: 1,
            }}
          />
        )}

        {/* Category top-left */}
        {category && (
          <span
            style={{
              position: "absolute",
              top: 13,
              left: 13,
              zIndex: 2,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: "var(--color-text-primary)",
              background: "rgba(255, 255, 255, 0.85)",
              padding: "5px 10px",
              borderRadius: 4,
            }}
          >
            {category.name}
          </span>
        )}
      </div>

      {/* Info-i bottom-right of visual (sits across visual/text boundary, like SlideArticleCard) */}
      <div
        onMouseEnter={() => setInfoHovered(true)}
        onMouseLeave={() => setInfoHovered(false)}
        onClick={handleInfoClick}
        role="button"
        aria-label="Vorschau öffnen"
        style={{
          position: "absolute",
          top: 161,
          right: 13,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: infoHovered ? "none" : "1px solid var(--color-text-primary)",
          background: infoHovered ? "var(--color-text-primary)" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 3,
          transition: "background 0.15s, border 0.15s",
          ["--fill-0" as string]: infoHovered
            ? "#ffffff"
            : "var(--color-text-primary)",
        }}
      >
        <InlineSVG src="/icons/info_i.svg" alt="Info" style={{ width: 9, height: 17 }} />
      </div>

      {/* Text */}
      <div style={{ padding: "13px 0 0", display: "flex", flexDirection: "column" }}>
        {sublineText && (
          <p
            lang="de"
            style={{
              fontFamily: "Merriweather, serif",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1.3,
              color: "var(--color-text-medium)",
              margin: "0 0 6px",
            }}
          >
            {sublineText}
          </p>
        )}
        <p
          lang="de"
          style={{
            fontFamily: "Merriweather, serif",
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1.3,
            color: "var(--color-text-primary)",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {titleText}
        </p>
        {truncatedExcerpt && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--color-text-medium)",
              margin: "10px 0 0",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {truncatedExcerpt}
          </p>
        )}
      </div>

      {/* Footer: Ratgeber lesen → */}
      <div style={{ padding: "12px 0 0", display: "flex" }}>
        <Link href={postLink} className="article-read-link">
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Ratgeber lesen
          </span>
          <span
            className="article-read-line"
            style={{ height: 0, borderTop: "1px solid currentColor", flexShrink: 0 }}
          />
          <svg
            width="8"
            height="8"
            viewBox="0 0 17.45 15.77"
            fill="none"
            aria-hidden
            style={{ flexShrink: 0, transform: "rotate(180deg)", marginLeft: "-12px" }}
          >
            <polyline
              points="16.95 15.27 8.27 8.11 16.95 .5"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </Link>
      </div>
    </article>
  );
}
