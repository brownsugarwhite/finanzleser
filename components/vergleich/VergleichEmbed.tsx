"use client";

import { useState, useEffect, useRef } from "react";

interface ScriptConfig {
  slotId: string;
  siteKey: string;
  designId: string;
  productId: string;
  scriptSrc: string;
}

interface VergleichEmbedProps {
  slug: string;
  formHeader?: React.ReactNode;
}

export default function VergleichEmbed({ slug, formHeader }: VergleichEmbedProps) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [scriptConfig, setScriptConfig] = useState<ScriptConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/vergleich-data/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.iframeUrl) {
          setIframeUrl(data.iframeUrl);
        } else if (data.scriptConfig) {
          setScriptConfig(data.scriptConfig);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // FinanceAds postMessage für auto-Höhe (Format: "rechnerid|height")
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      const parts = event.data.split("|");
      if (parts.length === 2) {
        const height = parseInt(parts[1], 10);
        if (!isNaN(height) && height > 100) {
          setIframeHeight(height);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // JS-Widget laden (finanzen.de etc.)
  useEffect(() => {
    if (!scriptConfig || !scriptContainerRef.current) return;

    const container = scriptContainerRef.current;
    const slotDiv = document.createElement("div");
    slotDiv.id = `fde-slot-am-${scriptConfig.slotId}`;
    container.appendChild(slotDiv);

    // fde Array initialisieren und Script laden
    (window as Record<string, unknown>).fde = (window as Record<string, unknown>).fde || [];
    const fde = (window as Record<string, unknown>).fde as Array<Record<string, string>[]>;
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

    return () => {
      container.innerHTML = "";
    };
  }, [scriptConfig]);

  return (
    <div className="vergleich-embed">
      {formHeader}

      {loading && (
        <div style={{ padding: 48, textAlign: "center", color: "#999" }}>
          Vergleich wird geladen...
        </div>
      )}

      {error && (
        <div style={{ padding: 48, textAlign: "center", color: "#999" }}>
          Vergleich konnte nicht geladen werden.
        </div>
      )}

      {iframeUrl && !loading && (
        <div className="vergleich-iframe-container">
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

      {scriptConfig && !loading && (
        <div className="vergleich-iframe-container" ref={scriptContainerRef} />
      )}
    </div>
  );
}
