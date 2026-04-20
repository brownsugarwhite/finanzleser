"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { gsap, Flip, initGSAP } from "@/lib/gsapConfig";
import type { Post } from "@/lib/types";
import { isMainCategory } from "@/lib/categories";
import type { PreviewExtras, PreviewTool } from "./ArticlePreviewProvider";

initGSAP();

const TOOL_META: Record<PreviewTool, { label: string; color: string }> = {
  rechner: { label: "Rechner", color: "var(--color-tool-rechner)" },
  vergleich: { label: "Vergleich", color: "var(--color-tool-vergleiche)" },
  checkliste: { label: "Checkliste", color: "var(--color-tool-checklisten)" },
};

const MORPH_DURATION = 0.5;
const MORPH_EASE = "power2.inOut";
const TEXT_FADE_DURATION = 0.15;
const PREVIEW_BORDER_RADIUS = 56;
const IMAGE_RADIUS_TOP = `${PREVIEW_BORDER_RADIUS}px ${PREVIEW_BORDER_RADIUS}px 0 0`;
const PREVIEW_SHADOW = "0 40px 80px rgba(0,0,0,0.18)";

interface Props {
  post: Post;
  sourceCardEl: HTMLElement;
  onClose: () => void;
}

export default function ArticlePreviewOverlay({ post, sourceCardEl, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const isExitingRef = useRef(false);
  const savedCardRectRef = useRef<DOMRect | null>(null);
  const savedImageRectRef = useRef<DOMRect | null>(null);
  const [extras, setExtras] = useState<PreviewExtras | null>(null);

  const untertitel = post.beitragFelder?.beitragUntertitel?.trim();
  const mainCategory = post.categories?.nodes?.find((cat) => isMainCategory(cat.slug));
  const subCategory = post.categories?.nodes?.find((cat) => !isMainCategory(cat.slug)) || post.categories?.nodes?.[0];
  const postLink = `/${mainCategory?.slug || "beitraege"}/${subCategory?.slug || "allgemein"}/${post.slug}`;
  const imageUrl = post.featuredImage?.node.sourceUrl;

  // Side effects + cleanup
  useEffect(() => {
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    let cancelled = false;
    fetch(`/api/article-preview?slug=${encodeURIComponent(post.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PreviewExtras | null) => {
        if (cancelled) return;
        if (data) setExtras(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadRight;
      window.dispatchEvent(new CustomEvent("menu-closed"));
      if (sourceCardEl) {
        sourceCardEl.style.visibility = "";
        const textEl = sourceCardEl.querySelector<HTMLElement>("[data-card-text]");
        if (textEl) textEl.style.opacity = "";
      }
    };
  }, [post.slug, sourceCardEl]);

  // IN morph — GSAP Flip (nested + scale: true) + saved rects für close
  useLayoutEffect(() => {
    const root = rootRef.current;
    const box = boxRef.current;
    const image = imageRef.current;
    if (!root || !box || !image || !sourceCardEl) return;

    const sourceFlipEls: HTMLElement[] = [
      sourceCardEl,
      ...Array.from(sourceCardEl.querySelectorAll<HTMLElement>("[data-flip-id]")),
    ];
    const targetFlipEls: HTMLElement[] = [
      box,
      ...Array.from(box.querySelectorAll<HTMLElement>("[data-flip-id]")),
    ];
    const srcImageEl = sourceCardEl.querySelector<HTMLElement>(
      `[data-flip-id="preview-${post.slug}-image"]`
    );

    // Save pre-scale rects für close
    savedCardRectRef.current = sourceCardEl.getBoundingClientRect();
    savedImageRectRef.current = srcImageEl ? srcImageEl.getBoundingClientRect() : savedCardRectRef.current;

    // Separate Flip States für Box und Image — keine nested-Magie, keine impliziten position:absolute
    const boxState = Flip.getState(sourceCardEl, {
      props: "borderRadius,backgroundColor,boxShadow",
    });
    const imageState = srcImageEl ? Flip.getState(srcImageEl, { props: "borderRadius" }) : null;

    // Source card verstecken (bevor menu-opened)
    sourceCardEl.style.visibility = "hidden";

    // Card-Text fade-out
    const cardTextEl = sourceCardEl.querySelector<HTMLElement>("[data-card-text]");
    if (cardTextEl) {
      gsap.to(cardTextEl, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    }

    // Background blur — parallel
    window.dispatchEvent(new CustomEvent("menu-opened"));

    // Backdrop fade
    if (backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
    }

    // Box flip (nur Box, ohne nested)
    const flipBoxTween = Flip.from(boxState, {
      targets: box,
      scale: true,
      duration: MORPH_DURATION,
      ease: MORPH_EASE,
    });

    // Image flip separat (reines transform, sitzt innerhalb der Box aber per eigenem Transform animiert)
    const flipImageTween = imageState
      ? Flip.from(imageState, {
          targets: image,
          scale: true,
          duration: MORPH_DURATION,
          ease: MORPH_EASE,
        })
      : null;

    // Text/Secondary/X fade-in nach morph
    const fadeTimer = window.setTimeout(() => {
      const fadeEls: HTMLElement[] = [];
      if (sublineRef.current) fadeEls.push(sublineRef.current);
      if (titleRef.current) fadeEls.push(titleRef.current);
      if (secondaryRef.current) fadeEls.push(secondaryRef.current);
      if (closeBtnRef.current) fadeEls.push(closeBtnRef.current);
      if (fadeEls.length > 0) {
        gsap.fromTo(fadeEls, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.04 });
      }
    }, MORPH_DURATION * 1000);

    return () => {
      flipBoxTween?.kill();
      flipImageTween?.kill();
      window.clearTimeout(fadeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // OUT morph — Flip.fit box & image back to card rects
  const requestClose = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    const box = boxRef.current;
    const image = imageRef.current;
    if (!box || !image || !sourceCardEl) {
      onClose();
      return;
    }

    // Fade preview text + secondary + X + backdrop
    const fadeOutEls: HTMLElement[] = [];
    if (sublineRef.current) fadeOutEls.push(sublineRef.current);
    if (titleRef.current) fadeOutEls.push(titleRef.current);
    if (secondaryRef.current) fadeOutEls.push(secondaryRef.current);
    if (closeBtnRef.current) fadeOutEls.push(closeBtnRef.current);
    if (fadeOutEls.length > 0) {
      gsap.to(fadeOutEls, { opacity: 0, duration: TEXT_FADE_DURATION, ease: "power2.in" });
    }
    if (backdropRef.current) gsap.to(backdropRef.current, { opacity: 0, duration: MORPH_DURATION, ease: MORPH_EASE });

    // Background un-blur
    window.dispatchEvent(new CustomEvent("menu-closed"));

    // Fade card text back in
    const cardTextEl = sourceCardEl.querySelector<HTMLElement>("[data-card-text]");
    if (cardTextEl) {
      gsap.to(cardTextEl, { opacity: 1, duration: 0.3, delay: MORPH_DURATION * 0.5, ease: "power2.out" });
    }

    // Use saved pre-scale rects — accurate target regardless of current .scalable-content scale
    const savedBoxRect = savedCardRectRef.current;
    const savedImageRect = savedImageRectRef.current;
    if (!savedBoxRect || !savedImageRect) {
      window.setTimeout(() => onClose(), MORPH_DURATION * 1000);
      return;
    }

    // Measure current overlay rects
    const curBoxRect = box.getBoundingClientRect();
    const curImageRect = image.getBoundingClientRect();

    // Read card's natural computed styles for border-radius / bg to tween toward
    const srcBoxStyle = getComputedStyle(sourceCardEl);
    const srcImageElForStyle = sourceCardEl.querySelector<HTMLElement>(
      `[data-flip-id="preview-${post.slug}-image"]`
    );
    const srcImageStyle = srcImageElForStyle ? getComputedStyle(srcImageElForStyle) : null;

    // Pin overlay box at current position/size, animate to saved card rect + card styles
    gsap.set(box, {
      position: "fixed",
      top: curBoxRect.top,
      left: curBoxRect.left,
      width: curBoxRect.width,
      height: curBoxRect.height,
      margin: 0,
      maxWidth: "none",
      maxHeight: "none",
      overflow: "hidden",
      zIndex: 1,
    });
    gsap.to(box, {
      top: savedBoxRect.top,
      left: savedBoxRect.left,
      width: savedBoxRect.width,
      height: savedBoxRect.height,
      borderRadius: srcBoxStyle.borderRadius,
      backgroundColor: srcBoxStyle.backgroundColor,
      boxShadow: "0 0 0 rgba(0,0,0,0)",
      duration: MORPH_DURATION,
      ease: MORPH_EASE,
    });

    gsap.set(image, {
      position: "fixed",
      top: curImageRect.top,
      left: curImageRect.left,
      width: curImageRect.width,
      height: curImageRect.height,
      zIndex: 2,
    });
    gsap.to(image, {
      top: savedImageRect.top,
      left: savedImageRect.left,
      width: savedImageRect.width,
      height: savedImageRect.height,
      borderRadius: srcImageStyle ? srcImageStyle.borderRadius : 0,
      duration: MORPH_DURATION,
      ease: MORPH_EASE,
    });

    window.setTimeout(() => {
      if (sourceCardEl) sourceCardEl.style.visibility = "";
      onClose();
    }, MORPH_DURATION * 1000);
  }, [onClose, sourceCardEl, post.slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  if (typeof document === "undefined") return null;

  const toolsToShow = (extras?.tools ?? []).slice(0, 3);

  const overlay = (
    <div
      ref={rootRef}
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        pointerEvents: "auto",
      }}
    >
      <div
        ref={backdropRef}
        onClick={requestClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          cursor: "pointer",
          opacity: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1000,
          height: "min(900px, calc(100vh - 40px))",
        }}
      >
        <div
          ref={boxRef}
          data-flip-id={`preview-${post.slug}-box`}
          style={{
            position: "absolute",
            inset: 0,
            overflowY: "auto",
            overflowX: "hidden",
            background: "#ffffff",
            borderRadius: PREVIEW_BORDER_RADIUS,
            boxShadow: PREVIEW_SHADOW,
          }}
        >
          <button
            ref={closeBtnRef}
            onClick={requestClose}
            aria-label="Schließen"
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid var(--color-text-primary)",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: 0,
              zIndex: 3,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M1 1 L15 15 M15 1 L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Spacer where the image sits visually — image itself is a sibling (absolute-positioned over this) */}
          <div style={{ width: "100%", height: 480 }} aria-hidden />

          <div style={{ padding: "40px 64px 48px 64px", display: "flex", flexDirection: "column" }}>
          <p
            ref={sublineRef}
            lang="de"
            style={{
              fontFamily: "Merriweather, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "23px",
              lineHeight: 1.3,
              color: "var(--color-brand-secondary)",
              margin: 0,
              opacity: 0,
              hyphens: "auto",
              overflowWrap: "break-word",
              marginBottom: 12,
            }}
          >
            {post.title}
          </p>

          {untertitel && (
            <p
              ref={titleRef}
              lang="de"
              style={{
                fontFamily: "Merriweather, serif",
                fontWeight: 700,
                fontSize: "42px",
                lineHeight: 1.3,
                color: "var(--color-text-primary)",
                margin: 0,
                opacity: 0,
                hyphens: "auto",
                overflowWrap: "break-word",
              }}
            >
              {untertitel}
            </p>
          )}

          <div
            ref={secondaryRef}
            style={{
              opacity: 0,
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {extras?.firstParagraph ? (
              <p
                lang="de"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "18px",
                  lineHeight: 1.6,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {extras.firstParagraph}
              </p>
            ) : null}

            {toolsToShow.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {toolsToShow.map((t) => (
                  <span
                    key={t}
                    style={{
                      backgroundColor: TOOL_META[t].color,
                      color: "#ffffff",
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: 14,
                      padding: "6px 14px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {TOOL_META[t].label}
                  </span>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  color: "var(--color-text-medium)",
                }}
              >
                {extras && extras.readingTime > 0 ? `Lesedauer: ${extras.readingTime} Min.` : "\u00A0"}
              </span>
              <Link href={postLink} onClick={requestClose} style={{ textDecoration: "none" }}>
                <PreviewReadButton label="Ratgeber lesen" />
              </Link>
            </div>
          </div>
          </div>
        </div>

        {/* Image as sibling of box — absolute-positioned over box's top area */}
        <div
          ref={imageRef}
          data-flip-id={`preview-${post.slug}-image`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 480,
            background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : "rgba(0,0,0,0.08)",
            borderRadius: IMAGE_RADIUS_TOP,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function PreviewReadButton({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 13,
        height: 48,
        paddingLeft: 20,
        paddingRight: 3,
        paddingTop: 3,
        paddingBottom: 3,
        borderRadius: 21,
        border: "2px solid var(--color-text-primary)",
        outline: "1px solid var(--color-text-primary)",
        outlineOffset: 2,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontFamily: "Open Sans, sans-serif",
          fontSize: 17,
          fontWeight: 500,
          color: "#1a1a1a",
          lineHeight: "30px",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "var(--color-brand)",
            borderRadius: 17,
          }}
        />
        <svg
          width="11"
          height="15"
          viewBox="0 0 11 15"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: -4.5,
            marginTop: -7.5,
          }}
          aria-hidden
        >
          <path
            d="M1.5 1.50009L9.5 7.50009L1.5 13.5001"
            stroke="white"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
    </span>
  );
}
