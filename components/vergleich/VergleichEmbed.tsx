"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import { refreshScrollTriggers } from "@/lib/refreshScrollTriggers";

interface ScriptConfig {
  type: string;
  scriptSrc: string;
  [key: string]: string;
}

interface VergleichEmbedProps {
  slug: string;
}

const MIN_LOAD_MS = 1000;      // Loader mindestens 1s sichtbar
const STABLE_MS = 800;         // Höhe gilt als „final", wenn 800ms keine Änderung mehr
const LOAD_FALLBACK_MS = 8000; // Notbremse: spätestens dann aufdecken
const PLACEHOLDER_H = 180;     // Lade-Box-Höhe während des Ladens

export default function VergleichEmbed({ slug }: VergleichEmbedProps) {
  const [inView, setInView] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [scriptConfig, setScriptConfig] = useState<ScriptConfig | null>(null);
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [revealed, setRevealed] = useState(false);
  // Loader bleibt gemountet, bis der Crossfade fertig ist (während des Wachsens laufen
  // die Balken weiter) — erst danach aus dem DOM.
  const [loaderGone, setLoaderGone] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const rawContainerRef = useRef<HTMLDivElement>(null);
  const fetched = useRef(false);
  const inViewAt = useRef<number | null>(null);
  const stableTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastH = useRef(0);
  const revealedRef = useRef(false);

  // Config vorhanden → Inhalt darf montieren (lädt versteckt unter der Ladebox)
  const ready = !!(iframeUrl || scriptConfig || rawHtml);

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

  // Höhe messen + Stabilität erkennen: Der Embed wächst nach der internen Suche oft
  // nach. Erst aufdecken, wenn die (volle) Höhe STABIL ist (STABLE_MS ohne Änderung)
  // — bzw. spätestens nach LOAD_FALLBACK_MS. So „springt" der Vergleich nicht nach.
  useEffect(() => {
    if (!ready) return;
    const content = contentRef.current;
    if (!content) return;

    const doReveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      const start = inViewAt.current ?? Date.now();
      const remaining = Math.max(0, MIN_LOAD_MS - (Date.now() - start));
      window.setTimeout(() => setRevealed(true), remaining);
    };

    const measure = () => {
      const h = content.scrollHeight;
      if (h !== lastH.current) {
        lastH.current = h;
        if (stableTimer.current) clearTimeout(stableTimer.current);
        stableTimer.current = setTimeout(doReveal, STABLE_MS);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(content);
    if (content.firstElementChild) ro.observe(content.firstElementChild);
    const fallback = setTimeout(doReveal, LOAD_FALLBACK_MS);
    return () => {
      ro.disconnect();
      clearTimeout(fallback);
      if (stableTimer.current) clearTimeout(stableTimer.current);
    };
  }, [ready]);

  // Reveal: Lade-Box auf die volle (finale) Vergleichshöhe skalieren + Inhalt NUR per
  // opacity einfaden (kein y-Slide). Loader fadet weg. Danach trägt der Inhalt im Flow.
  useEffect(() => {
    if (!revealed || !stageRef.current || !contentRef.current) return;
    const stage = stageRef.current;
    const content = contentRef.current;
    const finalH = content.scrollHeight || 600;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const settle = () => {
      // Inhalt in den Flow nehmen → Stage-Höhe folgt ab jetzt automatisch (kein Scroll,
      // keine feste Höhe). Höhen sind deckungsgleich (finalH) → kein Sprung.
      content.style.position = "static";
      content.style.opacity = "1";
      stage.style.height = "auto";
      stage.style.overflow = "visible";
      setLoaderGone(true); // Loader erst JETZT aus dem DOM nehmen
      refreshScrollTriggers();
    };

    if (reduce) {
      settle();
      return;
    }

    // Phase 1: Lade-Box wächst auf die volle Vergleichshöhe — die Streifen + der
    // Schriftzug laufen die GANZE Zeit weiter (Loader bleibt gemountet & sichtbar).
    // Phase 2 (onComplete): erst JETZT Crossfade Loader↔Vergleich (gleichzeitig).
    gsap.to(stage, {
      height: finalH,
      duration: 0.75,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.fromTo(content, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: "power2.out" });
        if (loadingRef.current) {
          gsap.to(loadingRef.current, {
            autoAlpha: 0,
            duration: 0.55,
            ease: "power2.out",
            onComplete: settle,
          });
        } else {
          settle();
        }
      },
    });
  }, [revealed]);

  // postMessage-Höhe (FinanceAds u. a.) → treibt die iframe-Höhe; die Mess-Logik oben
  // erkennt die Stabilität daraus.
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
      if (height && !isNaN(height) && height > 100) setIframeHeight(height);
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
      <div className="vergleich-stage" ref={stageRef} style={{ height: PLACEHOLDER_H }}>
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
                />
              </div>
            )}
            {scriptConfig && <div className="vergleich-iframe-container" ref={scriptContainerRef} />}
            {rawHtml && <div className="vergleich-iframe-container" ref={rawContainerRef} />}
          </div>
        )}

        {!loaderGone && !error && (
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
