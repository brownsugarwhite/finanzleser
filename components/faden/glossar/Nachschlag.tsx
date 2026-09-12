"use client";

/**
 * Nachschlagewerk im Registerblatt (Service · Glossar): Suche, A–Z, Liste mit
 * Buchstabenköpfen links, Detail rechts (Erklärung, Quelle, Ratgeber, Werkzeug, Merken).
 * Die Zeilen kommen aus /api/faden/glossar (ISR), das Detail aus dem Begriffs-Cache des Fadens.
 */
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useFaden } from "@/components/faden/FadenProvider";
import type { BegriffDaten, BegriffZeile } from "@/lib/faden/glossar";

const LABEL: Record<string, string> = { rechner: "Rechner", checkliste: "Checkliste", vergleich: "Vergleich", dokumente: "Dokument" };
const ABC = ["Alle", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
let zeilenCache: BegriffZeile[] | null = null;

export default function Nachschlag({ buchstabe, oeffnen }: { buchstabe: string; oeffnen: (l: string) => void }) {
  const { begriffHolen, begriffMerken, toast, fragen, blattZu } = useFaden();
  const [zeilen, setZeilen] = useState<BegriffZeile[] | null>(zeilenCache);
  const [q, setQ] = useState("");
  const [aktiv, setAktiv] = useState("");
  const [detail, setDetail] = useState<BegriffDaten | null>(null);

  useEffect(() => {
    if (zeilenCache) return;
    let lebt = true;
    fetch("/api/faden/glossar").then((r) => r.json()).then((j: { items: BegriffZeile[] }) => { zeilenCache = j.items || []; if (lebt) setZeilen(zeilenCache); }).catch(() => { if (lebt) setZeilen([]); });
    return () => { lebt = false; };
  }, []);
  useEffect(() => {
    if (!aktiv) return;
    let lebt = true;
    setDetail(null);
    begriffHolen(aktiv).then((d) => { if (lebt) setDetail(d); });
    return () => { lebt = false; };
  }, [aktiv, begriffHolen]);

  const vorhanden = new Set((zeilen || []).map((z) => z.titel.charAt(0).toUpperCase()));
  const qq = q.trim().toLowerCase();
  const treffer = (zeilen || []).filter((z) => (buchstabe === "Alle" || z.titel.charAt(0).toUpperCase() === buchstabe) && (!qq || z.titel.toLowerCase().includes(qq) || z.kurz.toLowerCase().includes(qq)));
  let letzter = "";
  return (
    <div className="blatt__spalte blatt__spalte--breit">
      <span className="kicker">Glossar · {zeilen ? `${zeilen.length} Begriffe` : "lädt …"}</span>
      <div className="nachschlag">
        <div className="nachschlag__links">
          <input type="search" placeholder="Begriff suchen …" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Glossar durchsuchen" />
          <div className="abc">
            {ABC.map((l) => <button key={l} type="button" className={l === buchstabe ? "aktiv" : ""} disabled={l !== "Alle" && !vorhanden.has(l)} onClick={() => oeffnen(l)}>{l}</button>)}
          </div>
          <span className="nachschlag__zahl">{zeilen ? `${treffer.length} von ${zeilen.length} Begriffen${qq ? ` zu „${q.trim()}“` : ""}` : "Lädt …"}</span>
          <div className="nachschlag__liste">
            {treffer.slice(0, 250).map((z) => {
              const b0 = z.titel.charAt(0).toUpperCase();
              const kopf = buchstabe === "Alle" && !qq && b0 !== letzter ? <div className="buchstabe">{b0}</div> : null;
              letzter = b0;
              return (
                <Fragment key={z.slug}>
                  {kopf}
                  <button type="button" className={z.slug === aktiv ? "aktiv" : ""} onClick={() => setAktiv(z.slug)}>
                    <span>{z.titel}</span><small>{[z.ratgeber ? "Ratgeber" : "", z.tool ? LABEL[z.tool] : ""].filter(Boolean).join(" · ")}</small>
                  </button>
                </Fragment>
              );
            })}
            {zeilen && !treffer.length && <div className="rand__leer">Kein Begriff gefunden.</div>}
            {treffer.length > 250 && <div className="rand__leer">… und {treffer.length - 250} weitere. Suche eingrenzen.</div>}
          </div>
        </div>
        <div className="nachschlag__detail">
          {!aktiv && (
            <>
              <span className="kicker">Nachschlagewerk</span>
              <p>Begriff links wählen: Erklärung, Quelle, Ratgeber und Werkzeug erscheinen hier. Grüne Begriffe im Text öffnen dieselbe Erklärung an Ort und Stelle.</p>
              <Link className="textlink textlink--still" href="/glossar">Glossar als Seite öffnen</Link>
            </>
          )}
          {aktiv && !detail && <span className="hinweis">Lädt …</span>}
          {detail && (
            <>
              <span className="kicker">Begriff{detail.rubrik ? ` · ${detail.rubrik}` : ""}</span>
              <h4>{detail.titel}</h4>
              <p>{detail.erkl}</p>
              {detail.quelle && <p className="quelle">Quelle: {detail.quelle}</p>}
              <div className="reihe">
                {detail.ratgeber && <a className="textlink" href={detail.ratgeber.href}>Ratgeber „{detail.ratgeber.titel}“</a>}
                {detail.tool && <a className="textlink" href={detail.tool.href}>{detail.tool.titel}</a>}
                <a className="textlink textlink--still" href={detail.url}>Eigene Seite</a>
                <button type="button" className="textlink textlink--still" onClick={() => { blattZu(); fragen(detail.frage || `Was bedeutet „${detail.titel}“?`); }}>Leo fragen</button>
                <button type="button" className="textlink textlink--still" onClick={() => { begriffMerken(detail.slug, true); toast("Rechts in der Sitzung gemerkt"); }}>Merken</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
