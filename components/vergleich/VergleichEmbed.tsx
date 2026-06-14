"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "@/lib/gsapConfig";
import { refreshScrollTriggers } from "@/lib/refreshScrollTriggers";

const SB_PILL_H = 36;

interface ScriptConfig {
  type: string;
  scriptSrc: string;
  [key: string]: string;
}

interface VergleichEmbedProps {
  slug: string;
}

const MIN_LOAD_MS = 1000; // Loader mindestens 1s sichtbar
const LOAD_FALLBACK_MS = 2500; // Spätestens dann gilt der Inhalt als geladen

export default function VergleichEmbed({ slug }: VergleichEmbedProps) {
  const [inView, setInView] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [scriptConfig, setScriptConfig] = useState<ScriptConfig | null>(null);
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const rawContainerRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);
  const inViewAt = useRef<number | null>(null);
  const sbTrackRef = useRef<HTMLDivElement>(null);
  const sbThumbRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Config vorhanden → Inhalt darf montieren (lädt versteckt unter der Ladebox)
  const ready = !!(iframeUrl || scriptConfig || rawHtml);

  // Eigene Overlay-Scrollbar (dotted line + feste 36px-Pill); native ist ausgeblendet.
  const updateScrollbar = useCallback(() => {
    const c = contentRef.current, thumb = sbThumbRef.current, track = sbTrackRef.current;
    if (!c) return;
    const max = c.scrollHeight - c.clientHeight;
    const overflow = max > 2;
    setHasOverflow(overflow);
    if (!overflow || !thumb || !track) return;
    const range = track.clientHeight - SB_PILL_H;
    const top = range > 0 ? (c.scrollTop / max) * range : 0;
    thumb.style.top = `${Math.max(0, Math.min(range, top))}px`;
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const c = contentRef.current;
    if (!c) return;
    updateScrollbar();
    c.addEventListener("scroll", updateScrollbar, { passive: true });
    const ro = new ResizeObserver(updateScrollbar);
    ro.observe(c);
    if (c.firstElementChild) ro.observe(c.firstElementChild);
    const t = setTimeout(updateScrollbar, 800);
    return () => { c.removeEventListener("scroll", updateScrollbar); ro.disconnect(); clearTimeout(t); };
  }, [revealed, hasOverflow, updateScrollbar, iframeHeight]);

  const onThumbDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const c = contentRef.current, track = sbTrackRef.current, thumb = sbThumbRef.current;
    if (!c || !track || !thumb) return;
    const startY = e.clientY;
    const startTop = parseFloat(thumb.style.top || "0");
    const max = c.scrollHeight - c.clientHeight;
    const range = track.clientHeight - SB_PILL_H;
    const move = (ev: PointerEvent) => {
      const ny = Math.max(0, Math.min(range, startTop + (ev.clientY - startY)));
      c.scrollTop = range > 0 ? (ny / range) * max : 0;
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Lazy: erst laden, wenn der Embed in den Viewport scrollt
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { inViewAt.current = Date.now(); setInView(true); io.disconnect(); return; }
      }
    }, { rootMargin: "200px 0px", threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Daten holen, sobald sichtbar
  useEffect(() => {
    if (!inView || fetched.current) return;
    fetched.current = true;
    fetch(`/api/vergleich-data/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.iframeUrl) setIframeUrl(data.iframeUrl);
        else if (data.scriptConfig) setScriptConfig(data.scriptConfig);
        else if (data.rawHtml) setRawHtml(data.rawHtml);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [inView, slug]);

  // Inhalt gilt als geladen: iframe onLoad / erster postMessage / spätestens Fallback.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setContentLoaded(true), LOAD_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [ready]);

  // Reveal erst wenn Inhalt geladen UND Loader mind. 1s sichtbar war.
  useEffect(() => {
    if (!contentLoaded || revealed) return;
    const start = inViewAt.current ?? Date.now();
    const remaining = Math.max(0, MIN_LOAD_MS - (Date.now() - start));
    const t = setTimeout(() => setRevealed(true), remaining);
    return () => clearTimeout(t);
  }, [contentLoaded, revealed]);

  // Box auf feste 600px öffnen + Vergleich einfaden, Ladebox ausblenden.
  useEffect(() => {
    if (!revealed || !stageRef.current) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = stageRef.current;
    if (reduce) {
      gsap.set(stage, { height: 600 });
      if (contentRef.current) gsap.set(contentRef.current, { opacity: 1 });
      if (loadingRef.current) gsap.set(loadingRef.current, { autoAlpha: 0 });
      refreshScrollTriggers();
      return;
    }
    gsap.fromTo(stage, { height: 180 }, {
      height: 600, duration: 0.75, ease: "power3.inOut",
      onComplete: refreshScrollTriggers,
    });
    if (loadingRef.current) gsap.to(loadingRef.current, { autoAlpha: 0, duration: 0.45, ease: "power2.out" });
    // Vergleich fadet sanft + leicht von unten ein (unter dem 70px-Bottom-Gradient).
    if (contentRef.current) gsap.fromTo(contentRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.3 });
  }, [revealed]);

  // postMessage-Höhe (FinanceAds u. a.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let height: number | null = null;
      if (typeof event.data === "string") {
        const parts = event.data.split("|");
        if (parts.length === 2) height = parseInt(parts[1], 10);
      }
      if (typeof event.data === "object" && event.data !== null) {
        const h = event.data.height || event.data.frameHeight || event.data.scrollHeight;
        if (h) height = parseInt(h, 10);
      }
      if (typeof event.data === "string" && event.data.startsWith("{")) {
        try {
          const parsed = JSON.parse(event.data);
          const h = parsed.height || parsed.frameHeight || parsed.scrollHeight;
          if (h) height = parseInt(h, 10);
        } catch { /* not JSON */ }
      }
      if (height && !isNaN(height) && height > 100) { setIframeHeight(height); setContentLoaded(true); }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => { if (ready) refreshScrollTriggers(); }, [ready, iframeHeight]);

  // JS-Widget laden
  useEffect(() => {
    if (!scriptConfig || !scriptContainerRef.current) return;
    const container = scriptContainerRef.current;
    if (container.childElementCount > 0) return;

    if (scriptConfig.type === "finanzen-de") {
      const slotDiv = document.createElement("div");
      slotDiv.id = `fde-slot-am-${scriptConfig.slotId}`;
      container.appendChild(slotDiv);
      (window as unknown as Record<string, unknown>).fde = [];
      const fde = (window as unknown as Record<string, unknown>).fde as Array<Record<string, string>[]>;
      fde.push([
        { slotId: scriptConfig.slotId },
        { siteKey: scriptConfig.siteKey },
        { designId: scriptConfig.designId },
        { contentType: "singlepageVue" },
        { startedAt: String(performance.now()) },
        { productId: scriptConfig.productId },
        { affiliateCampaignCode: "" },
      ]);
      const script = document.createElement("script");
      script.async = true;
      script.type = "module";
      script.src = scriptConfig.scriptSrc;
      container.appendChild(script);
    } else if (scriptConfig.type === "covomo") {
      const widgetDiv = document.createElement("div");
      widgetDiv.id = "covomo-iframe-widget";
      widgetDiv.setAttribute("data-embed-type", scriptConfig.embedType || "iframe");
      widgetDiv.setAttribute("data-type", scriptConfig.dataType || "");
      widgetDiv.setAttribute("data-affiliate", scriptConfig.affiliate || "");
      container.appendChild(widgetDiv);
      const script = document.createElement("script");
      script.src = scriptConfig.scriptSrc;
      script.defer = true;
      container.appendChild(script);
    } else if (scriptConfig.type === "bussgeld") {
      const el = document.createElement("bussgeld-rechner");
      el.className = "bussgeldrechner";
      el.setAttribute("data-type", "abbiegen");
      el.setAttribute("data-background-color", "#ffffff");
      el.setAttribute("data-font-color", "#313c45");
      el.setAttribute("data-button-background-color", "#3889cf");
      el.setAttribute("data-button-font-color", "#ffffff");
      el.setAttribute("data-border-color", "#e0e0e0");
      el.setAttribute("data-show-dropdown", "1");
      el.setAttribute("data-publisher-id", scriptConfig.publisherId || "");
      container.appendChild(el);
      const script = document.createElement("script");
      script.src = scriptConfig.scriptSrc;
      script.async = true;
      container.appendChild(script);
    }
    return () => { container.innerHTML = ""; };
  }, [scriptConfig]);

  // Roh-Embed laden (Scripts neu erzeugen → werden ausgeführt)
  useEffect(() => {
    if (!rawHtml || !rawContainerRef.current) return;
    const container = rawContainerRef.current;
    if (container.childElementCount > 0) return;
    const template = document.createElement("template");
    template.innerHTML = rawHtml;
    template.content.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      for (const attr of old.attributes) s.setAttribute(attr.name, attr.value);
      if (old.textContent) s.textContent = old.textContent;
      old.replaceWith(s);
    });
    container.appendChild(template.content);
    return () => { container.innerHTML = ""; };
  }, [rawHtml]);

  return (
    <div className="vergleich-embed" ref={rootRef}>
      <div className="vergleich-stage" ref={stageRef}>
        {/* Inhalt montiert sobald Config da ist (lädt versteckt), Reveal später. */}
        {ready && (
          <div className="vergleich-content" ref={contentRef}>
            {iframeUrl && (
              <div className={`vergleich-iframe-container${iframeUrl.includes("financeads.net") ? " financeads-embed" : ""}`}>
                <iframe
                  ref={iframeRef}
                  src={iframeUrl}
                  style={{ height: `${iframeHeight}px` }}
                  title={`Vergleich: ${slug}`}
                  loading="lazy"
                  allow="clipboard-write"
                  onLoad={() => setContentLoaded(true)}
                />
              </div>
            )}
            {scriptConfig && <div className="vergleich-iframe-container" ref={scriptContainerRef} />}
            {rawHtml && <div className="vergleich-iframe-container" ref={rawContainerRef} />}
          </div>
        )}

        {revealed && hasOverflow && (
          <div className="vergleich-scrollbar" ref={sbTrackRef}>
            <div className="vergleich-scrollbar-thumb" ref={sbThumbRef} onPointerDown={onThumbDown} />
          </div>
        )}

        {!revealed && !error && (
          <div className="vergleich-loading" ref={loadingRef}>
            <div className="vergleich-loading-text">Vergleich wird geladen…</div>
          </div>
        )}

        {error && (
          <div style={{ padding: 48, textAlign: "center", color: "#999" }}>
            Vergleich konnte nicht geladen werden.
          </div>
        )}
      </div>
    </div>
  );
}
