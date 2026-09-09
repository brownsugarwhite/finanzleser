/**
 * Ein Ratgeber als Kette im Faden (Server-Komponente).
 *
 * Alles Lesbare steht im SSR-HTML: Krumen, Titel, Untertitel (erste h2, wie die alte
 * Seite), Vorspann, Autor, Bild, Einleitung, Inhaltsverzeichnis, Fachabschnitte mit
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

function Teile({ teile, toolData }: { teile: Teil[]; toolData?: ArticleToolData }) {
  return (
    <>
      {teile.map((t, i) => {
        if (t.art === "html") return <div key={i} className={cn("prose fliess__html", zeitungKlassen(t.html))} dangerouslySetInnerHTML={{ __html: t.html }} />;
        if (t.art === "spiel") return <div key={i} className="spiel-inline"><Insel typ="spiel" werte={{ typ: t.typ, felder: t.felder }}><GamificationEmbed gamType={t.typ} fields={t.felder} /></Insel></div>;
        if (t.art === "einwurf") return <a key={i} className="einwurf einwurf--zeiger" href={`#${t.ziel}`}>Leo wirft ein: {t.grund} <span>{EINWURF_ZIEL[t.typ]} unten im Beitrag ↓</span></a>;
        return <WerkzeugKarte key={i} teil={t} toolData={toolData} />;
      })}
    </>
  );
}

function AbschnittBlock({ a, i, n, toolData, url }: { a: Abschnitt; i: number; n: number; toolData?: ArticleToolData; url: string }) {
  return (
    <section className="abschnitt" id={a.id} data-toc-titel={a.titel} data-erscheint="herz">
      <Insel typ="abschnitt-teilen" werte={{ titel: a.titel, url, id: a.id }}><AbschnittTeilen titel={a.titel} url={url} id={a.id} /></Insel>
      <span className="kicker">Abschnitt {i + 1} von {n}</span>
      <h2 className="abschnitt__titel" dangerouslySetInnerHTML={{ __html: a.titelHtml || a.titel }} />
      <div className="fliess">{i === 0 && <Einschub format="rectangle" variante="umflossen" nr={0} />}<Teile teile={a.teile} toolData={toolData} /></div>
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
    if (k.einleitung) k.einleitung.html = verlinke(k.einleitung.html, ctx, { nurBevorzugt });
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
  // 🚨 Die Lesedauer je Abschnitt steht nur da, wenn sie etwas unterscheidet. Bei einem
  // Beitrag mit gleichmäßigen Abschnitten liest jeder rund eine Minute — eine Spalte aus
  // lauter „1 Min." ist keine Information, sondern Rauschen. Die Punktführung trägt den
  // Zeitungssatz auch allein.
  const dauern = toc.filter((t) => t.minuten).map((t) => t.minuten);
  const zeigeDauer = new Set(dauern).size > 1;

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
            <img className="uhr" src="/icons/time_icon.svg" alt="" />
            <span>{k.lesezeit}</span>
          </div>
          <figure>
            <div className={"bild" + (k.bild ? " bild--foto" : "")}>
              <img src={k.bild ? k.bild.src : CATEGORY_ICONS[k.rubrik] || CATEGORY_ICONS.finanzen} alt={k.bild ? k.bild.alt : ""} />
            </div>
            <figcaption>Bild: Redaktion</figcaption>
          </figure>
          {k.einleitung && (
            <div className="einleitung" id="heading-1">
              <h2 className="einleitung__titel">{k.einleitung.titel}</h2>
              <div className={cn("prose fliess__html", zeitungKlassen(k.einleitung.html, { initiale: true }))} dangerouslySetInnerHTML={{ __html: k.einleitung.html }} />
            </div>
          )}
          {toc.length > 0 && (
            <nav className="inhalt" aria-label="Inhalt" data-erscheint="herz">
              <span className="kicker">Inhalt</span>
              <ol className="inhalt__liste">
                {toc.map((t, i) => (
                  <li key={t.id} className={"inhalt__zeile inhalt__zeile--" + t.art} style={{ "--i": i } as React.CSSProperties}>
                    <a href={`#${t.id}`}>
                      <i className="inhalt__nr">{t.art === "abschnitt" ? String(i + 1).padStart(2, "0") : t.art === "faq" ? "?" : t.art === "fazit" ? "★" : <b className={`dot dot--${t.typ}`} />}</i>
                      <span className="inhalt__titel">{t.titel}</span>
                      {/* Punktführung: die Linie, die im Zeitungsinhalt Titel und Seitenzahl verbindet. */}
                      <i className="fuehrung" aria-hidden="true" />
                      {zeigeDauer && <span className="inhalt__zahl ziffern">{t.minuten ? `${t.minuten} Min.` : ""}</span>}
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
            <section className="abschnitt abschnitt--faq" id={k.faqId} data-toc-titel="Häufige Fragen" data-erscheint="herz">
              <div className="faq-kopf"><i>???</i>Häufige Fragen<i>???</i></div>
              <Einschub format="rectangle" variante="umflossen" nr={1} />
              {/* 🚨 `<details>` statt eines eigenen Akkordeons: Auf- und Zuklappen,
                  Tastaturbedienung und Vorlesbarkeit bringt der Browser mit, es braucht
                  kein Client-JavaScript — und im eingefrorenen Kapitel funktioniert es
                  weiter, wo eine React-Komponente erst wieder eingehängt werden müsste. */}
              <div className="faq">
                {k.faq.map((f, i) => (
                  <details key={i} className="faq__paar" name="faq">
                    <summary>
                      <i className="faq__nr" aria-hidden="true">{String(i + 1).padStart(2, "0")}</i>
                      <span>{f.q}</span>
                      <i className="faq__pfeil" aria-hidden="true" />
                    </summary>
                    <div className="faq__antwort prose" dangerouslySetInnerHTML={{ __html: f.a }} />
                  </details>
                ))}
              </div>
            </section>
          )}
          {k.fazitHtml && (
            <section className="abschnitt abschnitt--fazit" id={k.fazitId} data-toc-titel="Fazit" data-erscheint="herz">
              <FazitHeading />
              <div className={cn("fazit prose", zeitungKlassen(k.fazitHtml, { initiale: true }))} dangerouslySetInnerHTML={{ __html: k.fazitHtml }} />
            </section>
          )}
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
