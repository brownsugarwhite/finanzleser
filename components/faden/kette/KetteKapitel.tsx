/**
 * Ein Ratgeber als Kette im Faden (Server-Komponente).
 *
 * Alles Lesbare steht im SSR-HTML: Krumen, Titel, Untertitel (erste h2, wie die alte
 * Seite), Vorspann, Autor, Bild, Inhaltsverzeichnis, Fachabschnitte mit
 * Spielboxen und Werkzeugen, Leo-Fragen mit Antworten, FAQ, Fazit, Dazu passt.
 * Client-Inseln: Weiterlesen (Fragen aufklappen), Aktionen, Wochenbrief.
 */
import type { Post } from "@/lib/types";
import type { ArticleToolData } from "@/lib/articleToolData";
import { baueKette, werkzeugId, type Abschnitt, type Teil } from "@/lib/faden/kette";
import { verweiseAufloesen } from "@/lib/faden/titel";
import { zeitungKlassen } from "@/lib/faden/zeitung";
import { cn } from "@/lib/cn";
import { medienUrl } from "@/lib/faden/medien";
import { getGlossarIndex, loeseBegriffe } from "@/lib/faden/glossar";
import { alsText, neuerKontext, verlinke } from "@/lib/faden/verlinken";
import GlossarDaten from "@/components/faden/glossar/GlossarDaten";
import InhaltAktiv from "./InhaltAktiv";
import Einschub from "@/components/faden/Einschub";
import StatistikKarte from "@/components/statistik/StatistikKarte";
import Statistik from "@/components/statistik/Statistik";
import Insel from "./Insel";
import { Fragment } from "react";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import GamificationEmbed from "@/components/gamification/GamificationEmbed";
import KapitelKopf from "@/components/faden/KapitelKopf";
import FazitHeading from "@/components/ui/FazitHeading";
import Weiterlesen from "./Weiterlesen";
import Aktionen from "./Aktionen";
import WerkzeugKarte, { toolTitel, werkzeugTitel } from "./WerkzeugKarte";
import AbschnittTeilen from "./AbschnittTeilen";
import WochenbriefKasten from "./WochenbriefKasten";
import KassensturzTeaser from "@/components/faden/kassensturz/KassensturzTeaser";

const EINWURF_ZIEL: Record<string, string> = { rechner: "Zum Rechner", checkliste: "Zur Checkliste", vergleich: "Zum Vergleich", dokumente: "Zu den Dokumenten" };

/** Zahlwörter für die Kopfzeile des Verzeichnisses („Inhalt · sechs Abschnitte“, Handoff 572). */
const ZAHLWORT = ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
function zahlwort(n: number): string {
  return ZAHLWORT[n] ?? String(n);
}

/** Drei Textzeilen — das Zeichen für „Leseabschnitt“ rechts im Inhaltsverzeichnis. */
const LESEZEICHEN = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M1 2.5h10M1 6h10M1 9.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

function Teile({ teile, toolData, auftakt }: { teile: Teil[]; toolData?: ArticleToolData; auftakt?: boolean }) {
  // Zweispaltig und mit Initiale wird nur der ERSTE Fließtext-Block des ersten Abschnitts —
  // so steht es im Handoff (Zeile 403 gegen 585). Alles danach läuft über die volle Breite.
  let erstesHtml = true;
  return (
    <>
      {teile.map((t, i) => {
        if (t.art === "html") {
          const zuerst = erstesHtml;
          erstesHtml = false;
          return <div key={i} className={cn("prose fliess__html", zeitungKlassen(t.html, { spalten: auftakt && zuerst, initiale: auftakt && zuerst }))} dangerouslySetInnerHTML={{ __html: t.html }} />;
        }
        if (t.art === "spiel") return <div key={i} className="spiel-inline"><Insel typ="spiel" werte={{ typ: t.typ, felder: t.felder }}><GamificationEmbed gamType={t.typ} fields={t.felder} /></Insel></div>;
        if (t.art === "einwurf") return <a key={i} className="einwurf einwurf--zeiger" href={`#${t.ziel}`}>Leo wirft ein: {t.grund} <span>{EINWURF_ZIEL[t.typ]} unten im Beitrag ↓</span></a>;
        // Statistik aus einem Gutenberg-Block: steht genau dort, wo die Redaktion sie gesetzt hat —
        // anders als die Bestandsstatistiken, die der Abschnitt ans Ende hängt.
        if (t.art === "statistik") return <Insel key={i} typ="statistik-block" werte={t.werte}><Statistik st={t.werte} /></Insel>;
        return <WerkzeugKarte key={i} teil={t} toolData={toolData} />;
      })}
    </>
  );
}

function AbschnittBlock({ a, i, n, toolData, url }: { a: Abschnitt; i: number; n: number; toolData?: ArticleToolData; url: string }) {
  return (
    <section className="abschnitt" id={a.id} data-toc-titel={a.titel}>
      <Insel typ="abschnitt-teilen" werte={{ titel: a.titel, url, id: a.id }}><AbschnittTeilen titel={a.titel} url={url} id={a.id} /></Insel>
      <span className="kicker">Abschnitt {i + 1} von {n}</span>
      <h2 className="abschnitt__titel" dangerouslySetInnerHTML={{ __html: a.titelHtml || a.titel }} />
      <div className="fliess"><Teile teile={a.teile} toolData={toolData} auftakt={i === 0} /></div>
      {a.statistiken.map((st, j) => <Insel key={j} typ="statistik" werte={st}><StatistikKarte st={st} /></Insel>)}
      {a.fragen.length > 0 && <Insel typ="weiterlesen" werte={a.fragen}><Weiterlesen fragen={a.fragen} /></Insel>}
    </section>
  );
}

export default async function KetteKapitel({ post, toolData }: { post: Post; toolData?: ArticleToolData }) {
  const k = baueKette(post);

  // Glossar: redaktionell vorbelegte Begriffe zuerst (glossar_begriffe), dann auffüllen —
  // erste Fundstelle je Begriff, kettenweit begrenzt, Sperrkontexte in lib/faden/verlinken.
  const glossar = await getGlossarIndex();
  const ctx = neuerKontext(glossar, { bevorzugt: k.faden.glossarBegriffe });
  // Abschnittstitel sind Klartext (data-toc-titel liest sie weiter so). Für den Linker
  // brauchen sie eine HTML-Fassung; `titel` selbst bleibt unangetastet, sonst stünden
  // Auszeichnungen im Inhaltsverzeichnis und in „Abschnitt teilen“.
  for (const a of k.abschnitte) a.titelHtml = alsText(a.titel);
  for (const nurBevorzugt of [true, false]) {
    // Reihenfolge = Lesereihenfolge: erst der Titel des Abschnitts, dann sein Text.
    for (const a of k.abschnitte) {
      a.titelHtml = verlinke(a.titelHtml || alsText(a.titel), ctx, { nurBevorzugt });
      for (const t of a.teile) if (t.art === "html") t.html = verlinke(t.html, ctx, { nurBevorzugt });
    }
    k.faq = k.faq.map((f) => ({ q: f.q, a: verlinke(f.a, ctx, { nurBevorzugt }) }));
    if (k.fazitHtml) k.fazitHtml = verlinke(k.fazitHtml, ctx, { nurBevorzugt });
  }
  const begriffe = await loeseBegriffe([...ctx.gesehen].map((sl) => glossar.get(sl)).filter((e): e is NonNullable<typeof e> => !!e));
  const dazu = await verweiseAufloesen(k.faden.dazuPasst, toolTitel.alle(toolData));
  // „PDF zum Beitrag“ (frueher PdfPreview der alten Seite): kommt aus demselben Preload,
  // Medien-Host des Klons umschreiben wie bei allen anderen Dateien.
  const beitragPdf = toolData?.beitragPdf ? { ...toolData.beitragPdf, pdfUrl: medienUrl(toolData.beitragPdf.pdfUrl) } : null;
  const pfad = k.krumen.map((x) => x.name);
  // Ein Eintrag je Finanztool im Inhaltsverzeichnis (Titel aus dem Preload, sonst gecachter Getter).
  const toc = await Promise.all(k.toc.map(async (t) => (t.art === "werkzeug" && t.typ && t.slug ? { ...t, titel: await werkzeugTitel(t.typ, t.slug, toolData) } : t)));
  // Vorschläge unter der Eingabe (Prototyp FOLGE_CHIPS): Kurzfassung · zweimal „Dazu passt“ · erstes Werkzeug · Kassensturz.
  const erstesWerkzeug = toc.find((t) => t.art === "werkzeug");
  const chips = [
    ...(k.faden.kurzfassung ? [{ text: "Kurzfassung von Leo", ereignis: "faden:kurzfassung" }] : []),
    ...dazu.slice(0, 2).map((d) => ({ text: d.titel, href: d.href })),
    ...(erstesWerkzeug ? [{ text: erstesWerkzeug.titel, anker: erstesWerkzeug.id }] : []),
    { text: "Kassensturz: Wie gut bin ich aufgestellt?", href: "/kassensturz" },
  ];

  return (
    <section className="kapitel kapitel--live" id="kapitel-live" data-key={`post:${k.slug}`} data-titel={k.titel} data-pfad={pfad.join(" › ")}>
      <KapitelKopf pfad={pfad} />
      <div className="kapitel__inhalt">
        <article className="artikel" id={`artikel-${k.slug}`}>
          <nav className="krumen" aria-label="Sie lesen">
            {k.krumen.map((x, i) => (
              <span key={x.href}>{i > 0 && <span className="krumen__trenner">›</span>}<a href={x.href}>{x.name}</a></span>
            ))}
          </nav>
          <h1 className="artikel__titel">{k.titel}</h1>
          {k.kicker && <h2 className="artikel__untertitel" data-toc-exclude>{k.kicker}</h2>}
          {k.vorspann && <p className="vorspann">{k.vorspann}</p>}
          <div className="autor">
            <span className="autor-ring"><img src={k.autor.imageUrl} alt="" /></span>
            <span>Erstellt von der <b>{k.autor.name}</b>{k.stand ? ` · aktualisiert ${k.stand}` : ""}</span>
            <span className="lesedauer"><img className="uhr" src="/icons/time_icon.svg" alt="" />{k.lesezeit}</span>
          </div>
          <figure>
            <div className={"bild" + (k.bild ? " bild--foto" : "")}>
              <img src={k.bild ? k.bild.src : CATEGORY_ICONS[k.rubrik] || CATEGORY_ICONS.finanzen} alt={k.bild ? k.bild.alt : ""} />
            </div>
            <figcaption>Bild: Redaktion</figcaption>
          </figure>
          {toc.length > 0 && (
            <nav className="inhalt" aria-label="Inhalt">
              <span className="kicker">Inhalt · {zahlwort(k.abschnitte.length)} Abschnitte</span>
              <ol className="inhalt__liste">
                {toc.map((t) => (
                  <li key={t.id} className={"inhalt__zeile inhalt__zeile--" + t.art}>
                    <a href={`#${t.id}`}>
                      {/* Nur Leseabschnitte tragen eine Nummer — sie ist dieselbe wie in
                          „Abschnitt n von N“. FAQ, Fazit und Werkzeuge lassen die Spalte leer;
                          `min-width` hält trotzdem die Flucht. */}
                      <i className="inhalt__nr">{t.art === "abschnitt" ? k.abschnitte.findIndex((a) => a.id === t.id) + 1 : ""}</i>
                      <span className="inhalt__titel">{t.titel}</span>
                      <i className="inhalt__linie" aria-hidden="true" />
                      <span className="inhalt__art" title={t.art === "werkzeug" ? "Finanztool" : "Leseabschnitt"}>{t.art === "werkzeug" ? <b className={`dot dot--${t.typ}`} /> : LESEZEICHEN}<span className="nur-vorlesen">{t.art === "werkzeug" ? "Finanztool" : "Leseabschnitt"}</span></span>
                    </a>
                  </li>
                ))}
              </ol>
              <InhaltAktiv />
            </nav>
          )}
          {k.abschnitte.map((a, i) => (
            <Fragment key={a.id}>
              <AbschnittBlock a={a} i={i} n={k.abschnitte.length} toolData={toolData} url={k.url} />
              {i === 1 && <Einschub format="leaderboard" variante="artikel" nr={1} />}
            </Fragment>
          ))}
          {k.faq.length > 0 && (
            <section className="abschnitt abschnitt--faq" id={k.faqId} data-toc-titel="Häufige Fragen">
              <div className="faq-kopf"><i>???</i>Häufige Fragen<i>???</i></div>
              <Einschub format="rectangle" variante="umflossen" nr={1} />
              <dl className="faq">
                {k.faq.map((f, i) => (
                  <div key={i} className="faq__paar">
                    <dt>{f.q}</dt>
                    <dd className="prose" dangerouslySetInnerHTML={{ __html: f.a }} />
                  </div>
                ))}
              </dl>
            </section>
          )}
          {k.fazitHtml && (
            <section className="abschnitt abschnitt--fazit" id={k.fazitId} data-toc-titel="Fazit">
              <FazitHeading />
              <div className={cn("fazit prose", zeitungKlassen(k.fazitHtml, { initiale: true }))} dangerouslySetInnerHTML={{ __html: k.fazitHtml }} />
            </section>
          )}
          {/* Statistiken, die außerhalb eines Fachabschnitts gesetzt wurden (FAQ, Fazit,
              vor der ersten Zwischenüberschrift). Sie stehen hier, statt zu verschwinden. */}
          {k.nachzuegler.map((t, i) => (
            <Insel key={`nachzuegler-${i}`} typ="statistik-block" werte={t.werte}><Statistik st={t.werte} /></Insel>
          ))}
          {k.werkzeuge.length > 0 && (
            <section className="abschnitt abschnitt--werkzeuge" id="werkzeuge">
              <span className="kicker">Finanztools zum Beitrag</span>
              <h2 className="abschnitt__titel">Rechnen, prüfen, vergleichen</h2>
              <div className="werkzeuge-liste">
                {k.werkzeuge.map((w) => <WerkzeugKarte key={werkzeugId(w.typ, w.slug)} teil={w} toolData={toolData} imInhalt />)}
              </div>
            </section>
          )}
          <KassensturzTeaser />
          <Insel typ="aktionen" werte={{ titel: k.titel, url: k.url, kurzfassung: k.faden.kurzfassung, artikelId: `artikel-${k.slug}`, pdf: beitragPdf }}><Aktionen titel={k.titel} url={k.url} kurzfassung={k.faden.kurzfassung} artikelId={`artikel-${k.slug}`} pdf={beitragPdf} /></Insel>
          {dazu.length > 0 && (
            <div className="dazu">
              <span className="kicker">Dazu passt</span>
              {dazu.map((d) => (
                <a key={d.href} href={d.href} className="dazu__eintrag">{d.titel}</a>
              ))}
            </div>
          )}
          <Insel typ="wochenbrief"><WochenbriefKasten /></Insel>
          <GlossarDaten daten={begriffe} />
        </article>
      </div>
      <script type="application/json" data-eingabe-chips="" dangerouslySetInnerHTML={{ __html: JSON.stringify(chips).replace(/</g, "\\u003c") }} />
    </section>
  );
}
