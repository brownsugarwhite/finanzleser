"use client";

/**
 * Das Registerblatt unter dem Kopf: drei Spalten je Register.
 *   Ratgeber:    Rubriken · Themen · Liste (kleine Titelzeile + Punkte, fette Zweitzeile
 *                wie das alte Megamenü) + Werkzeuge zum Thema
 *   Finanztools: Reiter Rechner · Vergleiche · Checklisten · Liste mit Filter
 *   Service:     Anbieter (A–Z, Suche) · Dokumente · Glossar (M4) · Finconext
 * Die ersten drei Beiträge je Thema kommen aus dem Preload des Layouts, „Alle“ und die
 * Werkzeuglisten laden lazy über die bestehenden, CDN-gecachten API-Routen.
 * Jeder Eintrag ist ein echter Link; Klicks laufen über den Faden (Kapitel anhängen).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/navItems";
import type { MegamenuPreload } from "@/lib/wordpress";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import { TYP_LABELS } from "@/lib/rechnerCategories";
import MegaPostContent from "@/components/ui/MegaPostContent";
import { buildRechnerUrl, buildChecklisteUrl, buildVergleichUrl, buildDokumentUrl, buildAnbieterUrl, buildPostUrl } from "@/lib/urls";
import { splitAnbieterTitle } from "@/lib/anbieter-utils";
import { useFaden, type BlattZustand } from "@/components/faden/FadenProvider";
import type { Post } from "@/lib/types";

type Eintrag = { title: string; slug: string };
type Reiter = "rechner" | "vergleich" | "checkliste";
const REITER: { key: Reiter; label: string }[] = [{ key: "rechner", label: "Rechner" }, { key: "vergleich", label: "Vergleiche" }, { key: "checkliste", label: "Checklisten" }];
const SERVICE: { key: string; label: string }[] = [{ key: "anbieter", label: "Anbieter" }, { key: "dokumente", label: "Dokumente" }, { key: "glossar", label: "Glossar" }, { key: "finconext", label: "Finconext" }];

const cache = new Map<string, unknown>();
async function hole<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T;
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  const j = (await r.json()) as T;
  cache.set(url, j);
  return j;
}

function toolHref(typ: Reiter | "dokumente", slug: string): string {
  if (typ === "rechner") return buildRechnerUrl(slug);
  if (typ === "vergleich") return buildVergleichUrl(slug);
  if (typ === "checkliste") return buildChecklisteUrl(slug);
  return buildDokumentUrl(slug);
}

export default function Blatt({ nav, preload }: { nav: NavItem[]; preload: MegamenuPreload }) {
  const { blatt, blattOeffnen, blattZu } = useFaden();
  if (!blatt) return <div className="blatt" id="blatt" aria-label="Registerblatt" />;
  return (
    <div className="blatt offen" id="blatt" aria-label="Registerblatt">
      <div className="blatt__innen">
        <button type="button" className="schliessen" onClick={blattZu}>Esc · schließen ✕</button>
        {blatt.key === "ratgeber" && <BlattRatgeber nav={nav} preload={preload} z={blatt} oeffnen={blattOeffnen} />}
        {blatt.key === "finanztools" && <BlattFinanztools z={blatt} oeffnen={blattOeffnen} />}
        {blatt.key === "service" && <BlattService z={blatt} oeffnen={blattOeffnen} />}
      </div>
    </div>
  );
}

function Themenliste({ items, aktiv, klick }: { items: { key: string; name: string; icon?: string; zahl?: number }[]; aktiv?: string; klick: (k: string) => void }) {
  return (
    <ul className="themen">
      {items.map((it) => (
        <li key={it.key}>
          <button type="button" className={"thema" + (it.key === aktiv ? " aktiv" : "")} onClick={() => klick(it.key)}>
            {it.icon && <img src={it.icon} alt="" />}{it.name}{it.zahl ? <small>{it.zahl}</small> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function BlattRatgeber({ nav, preload, z, oeffnen }: { nav: NavItem[]; preload: MegamenuPreload; z: BlattZustand; oeffnen: (k: BlattZustand["key"], a?: string, b?: string) => void }) {
  const rubriken = nav.filter((n) => n.submenu && n.submenu.length);
  const rub = rubriken.find((r) => r.href.replace(/^\//, "") === z.a) || rubriken[0];
  const rk = rub.href.replace(/^\//, "");
  const themen = rub.submenu || [];
  const th = themen.find((t) => t.href.split("/").pop() === z.b) || themen[0];
  const tk = th.href.split("/").pop() || "";
  const vor = preload[th.href];
  const [alle, setAlle] = useState<Post[] | null>(null);
  const [laden, setLaden] = useState(false);
  useEffect(() => { setAlle(null); }, [tk]);
  const mehrLaden = async () => {
    setLaden(true);
    try { const j = await hole<{ posts: Post[] }>(`/api/megamenu/posts?category=${encodeURIComponent(tk)}&limit=20`); setAlle(j.posts); } catch { /* Liste bleibt */ } finally { setLaden(false); }
  };
  const liste = alle || vor?.posts || [];
  const pfadHref = (p: Post) => (p.categories?.nodes?.length ? buildPostUrl(p) : `${th.href}/${p.slug}`);
  return (
    <>
      <div className="blatt__spalte">
        <span className="kicker">Rubrik</span>
        <Themenliste items={rubriken.map((r) => ({ key: r.href.replace(/^\//, ""), name: r.label, icon: CATEGORY_ICONS[r.href.replace(/^\//, "")] }))} aktiv={rk} klick={(k) => oeffnen("ratgeber", k)} />
      </div>
      <div className="blatt__spalte">
        <span className="kicker">{rub.label} · Themen</span>
        <Themenliste items={themen.map((t) => ({ key: t.href.split("/").pop() || "", name: t.label }))} aktiv={tk} klick={(k) => oeffnen("ratgeber", rk, k)} />
        <a className="textlink textlink--still" href={rub.href}>Alle Ratgeber in {rub.label}</a>
      </div>
      <div className="blatt__spalte">
        <span className="kicker">{th.label} · Ratgeber</span>
        <ul className="eintraege">
          {liste.map((p) => (
            <li key={p.slug}><a className="eintrag" href={pfadHref(p)}><MegaPostContent post={p} /></a></li>
          ))}
          {liste.length === 0 && <li className="hinweis">Noch keine Beiträge in diesem Thema.</li>}
        </ul>
        {!alle && (vor?.hasMore ?? true) && liste.length > 0 && (
          <button type="button" className="textlink" onClick={mehrLaden} disabled={laden}>{laden ? "Lädt …" : "Alle Ratgeber im Thema anzeigen"}</button>
        )}
        <a className="textlink textlink--still" href={th.href}>Thema als Seite öffnen</a>
        {vor?.tools && vor.tools.length > 0 && (
          <>
            <span className="kicker">Finanztools zum Thema</span>
            {vor.tools.map((t) => (
              <a key={t.type + t.slug} className="werkzeug" href={toolHref(t.type, t.slug)}><i className={`dot dot--${t.type}`} />{t.title}</a>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function BlattFinanztools({ z, oeffnen }: { z: BlattZustand; oeffnen: (k: BlattZustand["key"], a?: string, b?: string) => void }) {
  const reiter = (REITER.find((r) => r.key === z.a) || REITER[0]).key;
  const [gruppen, setGruppen] = useState<{ label: string; items: Eintrag[] }[] | null>(null);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    let aktiv = true;
    setGruppen(null);
    (async () => {
      try {
        if (reiter === "rechner") { const j = await hole<{ groups: { typ: string; items: Eintrag[] }[] }>("/api/megamenu/rechner-grouped"); if (aktiv) setGruppen(j.groups.map((g) => ({ label: TYP_LABELS[g.typ] || g.typ, items: g.items }))); }
        else if (reiter === "checkliste") { const j = await hole<{ items?: Eintrag[]; checklisten?: Eintrag[] }>("/api/megamenu/checklisten"); if (aktiv) setGruppen([{ label: "Alle Checklisten", items: j.items || j.checklisten || [] }]); }
        else { const j = await hole<{ items: Eintrag[] }>("/api/faden/vergleiche"); if (aktiv) setGruppen([{ label: "Alle Vergleiche", items: j.items }]); }
      } catch { if (aktiv) setGruppen([]); }
    })();
    return () => { aktiv = false; };
  }, [reiter]);
  const q = filter.trim().toLowerCase();
  const gesamt = useMemo(() => (gruppen || []).reduce((n, g) => n + g.items.length, 0), [gruppen]);
  return (
    <>
      <div className="blatt__spalte">
        <span className="kicker">Finanztools</span>
        <Themenliste items={REITER.map((r) => ({ key: r.key, name: r.label }))} aktiv={reiter} klick={(k) => oeffnen("finanztools", k)} />
        <span className="hinweis">Rechner, Vergleiche und Checklisten öffnen als Karte im Faden und rechnen dort.</span>
        <Link className="textlink textlink--still" href="/finanztools">Alle Finanztools</Link>
      </div>
      <div className="blatt__spalte blatt__spalte--breit">
        <span className="kicker">{REITER.find((r) => r.key === reiter)?.label}{gesamt ? ` · ${gesamt}` : ""}</span>
        <input type="search" placeholder="Filtern: z. B. „Unterhalt“" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Finanztools filtern" />
        {gruppen === null && <span className="hinweis">Lädt …</span>}
        {gruppen && gruppen.map((g) => {
          const items = g.items.filter((it) => !q || it.title.toLowerCase().includes(q));
          if (!items.length) return null;
          return (
            <div key={g.label} className="blatt__gruppe">
              {gruppen.length > 1 && <span className="kicker kicker--gruen">{g.label}</span>}
              <ul className="eintraege eintraege--kompakt">
                {items.map((it) => (
                  <li key={it.slug}><a className="werkzeug" href={toolHref(reiter, it.slug)}><i className={`dot dot--${reiter}`} />{it.title}</a></li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BlattService({ z, oeffnen }: { z: BlattZustand; oeffnen: (k: BlattZustand["key"], a?: string, b?: string) => void }) {
  const teil = SERVICE.find((s) => s.key === z.a)?.key || "anbieter";
  const [liste, setListe] = useState<Eintrag[] | null>(null);
  const [filter, setFilter] = useState("");
  const buchstabe = z.b || "Alle";
  const geladenFuer = useRef("");
  useEffect(() => {
    if (teil !== "anbieter" && teil !== "dokumente") return;
    if (geladenFuer.current === teil && liste) return;
    let aktiv = true; setListe(null);
    (async () => {
      try { const j = await hole<{ items?: Eintrag[]; anbieter?: Eintrag[] }>(teil === "anbieter" ? "/api/megamenu/anbieter" : "/api/faden/dokumente"); if (aktiv) { setListe(j.items || j.anbieter || []); geladenFuer.current = teil; } } catch { if (aktiv) setListe([]); }
    })();
    return () => { aktiv = false; };
  }, [teil, liste]);
  const q = filter.trim().toLowerCase();
  const gefiltert = (liste || []).filter((it) => (buchstabe === "Alle" || it.title.charAt(0).toUpperCase() === buchstabe) && (!q || it.title.toLowerCase().includes(q)));
  const vorhanden = new Set((liste || []).map((it) => it.title.charAt(0).toUpperCase()));
  return (
    <>
      <div className="blatt__spalte">
        <span className="kicker">Service</span>
        <Themenliste items={SERVICE.map((s) => ({ key: s.key, name: s.label }))} aktiv={teil} klick={(k) => oeffnen("service", k)} />
      </div>
      {(teil === "anbieter" || teil === "dokumente") && (
        <div className="blatt__spalte blatt__spalte--breit">
          <span className="kicker">{teil === "anbieter" ? "Anbieter · Kontakt, Kündigung, Schaden" : "Dokumente · Vorlagen und Formulare"}{liste ? ` · ${liste.length}` : ""}</span>
          <div className="abc">
            {["Alle", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => (
              <button key={l} type="button" className={l === buchstabe ? "aktiv" : ""} disabled={l !== "Alle" && !vorhanden.has(l)} onClick={() => oeffnen("service", teil, l)}>{l}</button>
            ))}
          </div>
          <input type="search" placeholder={teil === "anbieter" ? "Name oder Sparte …" : "Filtern …"} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtern" />
          {liste === null && <span className="hinweis">Lädt …</span>}
          <ul className="eintraege eintraege--kompakt">
            {gefiltert.slice(0, 60).map((it) => {
              const t = teil === "anbieter" ? splitAnbieterTitle(it.title) : { name: it.title, kicker: "" };
              return <li key={it.slug}><a className="werkzeug" href={teil === "anbieter" ? buildAnbieterUrl(it.slug) : buildDokumentUrl(it.slug)}><i className={`dot dot--${teil === "anbieter" ? "vergleich" : "dokumente"}`} />{t.name}{t.kicker ? <small> · {t.kicker}</small> : null}</a></li>;
            })}
            {liste && gefiltert.length > 60 && <li className="hinweis">… und {gefiltert.length - 60} weitere. Filter eingrenzen.</li>}
          </ul>
          <a className="textlink textlink--still" href={teil === "anbieter" ? "/anbieter" : "/dokumente"}>Übersicht als Seite öffnen</a>
        </div>
      )}
      {teil === "glossar" && (
        <div className="blatt__spalte blatt__spalte--breit">
          <span className="kicker">Glossar · 587 Begriffe</span>
          <span className="hinweis">Grüne Begriffe im Text öffnen die Erklärung an Ort und Stelle; das Nachschlagewerk mit Suche kommt mit dem nächsten Schritt.</span>
        </div>
      )}
      {teil === "finconext" && (
        <div className="blatt__spalte blatt__spalte--breit">
          <img src="/icons/finconext_logo.svg" alt="Finconext" style={{ height: 34, width: "auto", justifySelf: "start" }} />
          <span>Finconext ist der Versicherungsmakler hinter finanzleser.de: unabhängig, mit zehn Spezialversicherern für Haftpflicht, Hausrat, Unfall, Tier, Fahrrad und Wohngebäude.</span>
          <span className="hinweis">Finconext GmbH · Frankfurt am Main · Makler nach § 34d GewO</span>
          <a className="btn btn--primary btn--klein" href="https://www.finconext.de/" target="_blank" rel="noopener noreferrer" data-faden-aus="">finconext.de öffnen ↗</a>
        </div>
      )}
    </>
  );
}
