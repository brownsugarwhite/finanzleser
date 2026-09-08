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
import { baueKette, type Abschnitt, type Teil } from "@/lib/faden/kette";
import { verweiseAufloesen } from "@/lib/faden/titel";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import GamificationEmbed from "@/components/gamification/GamificationEmbed";
import KapitelKopf from "@/components/faden/KapitelKopf";
import Weiterlesen from "./Weiterlesen";
import Aktionen from "./Aktionen";
import WerkzeugKarte, { toolTitel } from "./WerkzeugKarte";
import WochenbriefKasten from "./WochenbriefKasten";

function Teile({ teile, toolData }: { teile: Teil[]; toolData?: ArticleToolData }) {
  return (
    <>
      {teile.map((t, i) => {
        if (t.art === "html") return <div key={i} className="prose fliess__html" dangerouslySetInnerHTML={{ __html: t.html }} />;
        if (t.art === "spiel") return <div key={i} className="kasten kasten--pink kasten--inline spiel-inline"><span className="kicker kicker--pink">Spiel · in der Kette</span><GamificationEmbed gamType={t.typ} fields={t.felder} /></div>;
        return <WerkzeugKarte key={i} teil={t} toolData={toolData} />;
      })}
    </>
  );
}

function AbschnittBlock({ a, i, n, toolData }: { a: Abschnitt; i: number; n: number; toolData?: ArticleToolData }) {
  return (
    <section className="abschnitt" id={a.id} data-toc-titel={a.titel}>
      <span className="kicker">Abschnitt {i + 1} von {n}</span>
      <h2 className="abschnitt__titel">{a.titel}</h2>
      <div className="fliess"><Teile teile={a.teile} toolData={toolData} /></div>
      {a.fragen.length > 0 && <Weiterlesen fragen={a.fragen} />}
    </section>
  );
}

export default async function KetteKapitel({ post, toolData }: { post: Post; toolData?: ArticleToolData }) {
  const k = baueKette(post);
  const dazu = await verweiseAufloesen(k.faden.dazuPasst, toolTitel.alle(toolData));
  const pfad = k.krumen.map((x) => x.name);

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
              <div className="prose fliess__html" dangerouslySetInnerHTML={{ __html: k.einleitung.html }} />
            </div>
          )}
          {k.toc.length > 0 && (
            <nav className="inhalt" aria-label="Inhalt">
              <span className="kicker">Inhalt</span>
              <ol className="inhalt__liste">
                {k.toc.map((t, i) => (
                  <li key={t.id} className={"inhalt__zeile inhalt__zeile--" + t.art}>
                    <a href={`#${t.id}`}>
                      <i className="inhalt__nr">{t.art === "abschnitt" ? i + 1 : t.art === "faq" ? "?" : "★"}</i>
                      <span className="inhalt__linie" aria-hidden="true" />
                      <span className="inhalt__titel">{t.titel}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {k.abschnitte.map((a, i) => (
            <AbschnittBlock key={a.id} a={a} i={i} n={k.abschnitte.length} toolData={toolData} />
          ))}
          {k.faq.length > 0 && (
            <section className="abschnitt abschnitt--faq" id={k.faqId} data-toc-titel="Häufige Fragen">
              <div className="faq-kopf"><i>???</i>Häufige Fragen<i>???</i></div>
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
              <div className="fazit-kopf"><span><img src="/icons/fazit-starburst.svg" alt="" />Fazit</span></div>
              <div className="fazit prose" dangerouslySetInnerHTML={{ __html: k.fazitHtml }} />
            </section>
          )}
          <Aktionen titel={k.titel} url={k.url} kurzfassung={k.faden.kurzfassung} artikelId={`artikel-${k.slug}`} />
          {dazu.length > 0 && (
            <div className="dazu">
              <span className="kicker">Dazu passt</span>
              {dazu.map((d) => (
                <a key={d.href} href={d.href} className="dazu__eintrag">{d.titel}</a>
              ))}
            </div>
          )}
          <WochenbriefKasten />
        </article>
      </div>
    </section>
  );
}
