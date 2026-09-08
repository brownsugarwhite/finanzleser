"use client";

/**
 * „Das sieht Google“ / „Was Suchmaschinen sehen“ (Port aus dem Prototyp, 02-body.html #seite
 * und 04-js-inhalt.html kulissen()/kulissenFuer()): Vollbild mit dem HTML, das der Server
 * unter der Adresse wirklich schickt — das lebende Kapitel ohne Leo, ohne Verlauf, ohne
 * Anzeigen — und daneben die Prüfliste (Titel, Beschreibung, Canonical, JSON-LD, h1, Bilder).
 * Öffnen per `kulissenOeffnen(url, titel)`; Escape oder der Knopf schließen.
 */
import { useEffect, useState } from "react";

interface Befund { title: string; description: string; canonical: string; h1: string[]; jsonld: string[]; h2: number; woerter: number; bilder: number; bilderOhneAlt: number; begriffe: number; html: string }

export function kulissenOeffnen(url: string, titel?: string): void {
  document.dispatchEvent(new CustomEvent("faden:kulissen", { detail: { url, titel } }));
}

function auswerten(html: string): Befund {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const live = doc.getElementById("kapitel-live");
  const artikel = live?.querySelector("article") || live;
  const jsonld: string[] = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try { const j = JSON.parse(s.textContent || "null"); const liste = Array.isArray(j) ? j : j?.["@graph"] ? j["@graph"] : [j]; for (const e of liste) if (e?.["@type"]) jsonld.push(String(e["@type"])); } catch { /* egal */ }
  });
  const bilder = artikel ? Array.from(artikel.querySelectorAll("img")) : [];
  const klon = artikel ? (artikel.cloneNode(true) as HTMLElement) : null;
  klon?.querySelectorAll("script, style, .einschub, .leo-strom, .aktionen, .kasten__fuss, .weiterlesen, .inhalt, .krumen").forEach((e) => e.remove());
  klon?.querySelectorAll("[id]").forEach((e) => e.setAttribute("id", "kulissen-" + e.id));
  return {
    title: doc.title,
    description: doc.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    h1: Array.from(doc.querySelectorAll("h1")).map((h) => h.textContent?.trim() || ""),
    jsonld,
    h2: artikel ? artikel.querySelectorAll("h2").length : 0,
    woerter: artikel ? (artikel.textContent || "").split(/\s+/).filter(Boolean).length : 0,
    bilder: bilder.length,
    bilderOhneAlt: bilder.filter((i) => !i.getAttribute("alt")).length,
    begriffe: artikel ? artikel.querySelectorAll("a.begriff").length : 0,
    html: klon?.innerHTML || "",
  };
}

export default function Kulissen() {
  const [stand, setStand] = useState<{ url: string; titel?: string; befund?: Befund; fehler?: string } | null>(null);

  useEffect(() => {
    const h = async (ev: Event) => {
      const { url, titel } = (ev as CustomEvent<{ url: string; titel?: string }>).detail;
      setStand({ url, titel });
      try {
        const r = await fetch(url, { headers: { accept: "text/html" } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setStand({ url, titel, befund: auswerten(await r.text()) });
      } catch (e) {
        setStand({ url, titel, fehler: e instanceof Error ? e.message : "Nicht abrufbar" });
      }
    };
    document.addEventListener("faden:kulissen", h);
    return () => document.removeEventListener("faden:kulissen", h);
  }, []);

  useEffect(() => {
    if (!stand) return;
    document.body.style.overflow = "hidden";
    const taste = (ev: KeyboardEvent) => { if (ev.key === "Escape") setStand(null); };
    document.addEventListener("keydown", taste);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", taste); };
  }, [stand]);

  if (!stand) return null;
  const b = stand.befund;
  const ok = (x: boolean) => (x ? "✓" : "✗");
  return (
    <div className="seite offen" role="dialog" aria-modal="true" aria-label="Was Suchmaschinen sehen">
      <div className="seite__leiste">
        <button type="button" className="btn btn--klein" onClick={() => setStand(null)}>‹ Zurück in den Faden</button>
        <div className="url">www.finanzleser.de<b>{stand.url}</b></div>
        <span className="seite__hinweis">Blick hinter die Kulissen</span>
      </div>
      <div className="seite__innen">
        <article className="artikel seite__artikel">
          {!b && !stand.fehler && <p className="hinweis">Der Server schickt die Seite …</p>}
          {stand.fehler && <p className="hinweis">Die Adresse ließ sich nicht abrufen: {stand.fehler}</p>}
          {b && (
            <>
              <span className="kicker kicker--gruen">So kommt die Seite vom Server · {b.woerter.toLocaleString("de-DE")} Wörter</span>
              <div className="prose" inert dangerouslySetInnerHTML={{ __html: b.html }} />
              <p className="quelle">Keine Leo-Begrüßung, keine Einwürfe, keine Kapitelliste, keine Anzeigen: Das kommt erst im Browser dazu. Der Inhalt ist derselbe, die Glossar-Begriffe sind hier echte Links auf /glossar/….</p>
            </>
          )}
        </article>
        <aside className="seo">
          <span className="kicker">Was der Server schickt</span>
          {b ? (
            <ul>
              <li>{ok(!!b.title)} Titel: <small>{b.title || "fehlt"}</small></li>
              <li>{ok(!!b.description)} Beschreibung: <small>{b.description ? b.description.slice(0, 120) + (b.description.length > 120 ? "…" : "") : "fehlt"}</small></li>
              <li>{ok(!!b.canonical)} Canonical-Adresse: <small>{b.canonical || "fehlt"}</small></li>
              <li>{ok(b.jsonld.length > 0)} Strukturierte Daten: <small>{b.jsonld.length ? b.jsonld.join(", ") : "keine"}</small></li>
              <li>{ok(b.h1.length === 1)} Genau eine h1: <small>{b.h1.length ? b.h1.join(" · ") : "keine"}</small></li>
              <li>{ok(b.h2 > 0)} Abschnitte im HTML: <small>{b.h2} Zwischenüberschriften</small></li>
              <li>{ok(b.bilderOhneAlt === 0)} Bilder mit Alternativtext: <small>{b.bilder - b.bilderOhneAlt} von {b.bilder}</small></li>
              <li>{ok(b.begriffe > 0)} Glossar-Begriffe als Links: <small>{b.begriffe}</small></li>
            </ul>
          ) : <ul><li>…</li></ul>}
          <p className="hinweis">Genau das bekommen Google, Bing und KI-Suchmaschinen unter dieser Adresse: den Faden mit der vollständigen Kette, nur ohne Leo. Ein Mensch sieht diese Ansicht nie; sein Browser zeigt sofort den Faden mit Leo.</p>
        </aside>
      </div>
    </div>
  );
}
