"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";
import { startMorphNavigation, type MorphItemSource } from "@/lib/morphTransition";
import { captureTextItem, captureVisualItem, hideSourceEls } from "@/lib/morphCapture";

type Props = {
  post: Post;
};

export default function SearchResultCard({ post }: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const boldRef = useRef<HTMLParagraphElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();

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

  const prefetchArticle = () => {
    try { router.prefetch(postLink); } catch { /* noop */ }
  };

  const startMorph = () => {
    const items: MorphItemSource[] = [];
    const visual = captureVisualItem(imageRef.current, post.featuredImage?.node?.sourceUrl);
    if (visual) items.push(visual);
    if (sublineText) {
      const bold = captureTextItem(boldRef.current, "bold");
      if (bold) items.push(bold);
      const italic = captureTextItem(sublineRef.current, "italic");
      if (italic) items.push(italic);
    } else {
      const italic = captureTextItem(boldRef.current, "italic");
      if (italic) items.push(italic);
    }
    hideSourceEls(imageRef.current, boldRef.current, sublineRef.current);
    startMorphNavigation({ href: postLink, items }, (h) => router.push(h));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    prefetchArticle();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy > 36) return; // > 6px → treat as drag, ignore
    const target = e.target as HTMLElement;
    if (target.closest(".article-read-link")) return; // let the link handle nav
    startMorph();
  };

  return (
    <article
      ref={cardRef}
      data-morph-card={post.slug}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onMouseEnter={prefetchArticle}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Visual */}
      <div
        ref={imageRef}
        data-morph-role="visual"
        style={{
          position: "relative",
          width: "100%",
          height: 210,
          flexShrink: 0,
        }}
      >
        <div
          style={{ position: "absolute", inset: 0, overflow: "hidden", background: post.featuredImage?.node?.sourceUrl ? "transparent" : "var(--color-placeholder-bg)" }}
        >
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
        </div>

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

      {/* Text */}
      <div
        style={{
          padding: "13px 0 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {sublineText && (
          <p
            ref={sublineRef}
            data-morph-role="italic"
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
          ref={boldRef}
          data-morph-role={sublineText ? "bold" : "italic"}
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
      </div>
    </article>
  );
}
