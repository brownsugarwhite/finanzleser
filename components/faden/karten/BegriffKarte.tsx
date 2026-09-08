/**
 * Begriffskarte für /glossar/<slug>: Erklärung (andere Begriffe darin verlinkt, höchstens
 * drei), Quelle, Schreibweisen, Ratgeber und Werkzeug, die vorbereitete Leo-Frage mit
 * Antwort. Alles im SSR-HTML.
 */
import type { GlossarEintrag } from "@/lib/types";
import { getGlossarIndex, loeseBegriff } from "@/lib/faden/glossar";
import { neuerKontext, verlinke } from "@/lib/faden/verlinken";
import { medienHtml } from "@/lib/faden/medien";
import GlossarDaten from "@/components/faden/glossar/GlossarDaten";
import BegriffMerken from "@/components/faden/glossar/BegriffMerken";

export default async function BegriffKarte({ eintrag }: { eintrag: GlossarEintrag }) {
  const index = await getGlossarIndex();
  const daten = await loeseBegriff(eintrag);
  const ctx = neuerKontext(index, { max: 3 });
  ctx.gesehen.add(eintrag.slug); // sich selbst nicht verlinken
  const html = verlinke(medienHtml(eintrag.content || ""), ctx);
  const varianten = (eintrag.varianten || []).filter((v) => v.trim().toLowerCase() !== daten.titel.toLowerCase());
  return (
    <article className="kasten kasten--still kasten--begriff">
      <span className="kicker kicker--gruen">Begriffserklärung</span>
      <div className="prose begriff-k__text" dangerouslySetInnerHTML={{ __html: html }} />
      {daten.quelle && <p className="quelle">Quelle: {daten.quelle}</p>}
      {varianten.length > 0 && <p className="begriff-k__auch"><b>Auch:</b> {varianten.join(" · ")}</p>}
      <div className="begriff-k__reihe">
        {daten.ratgeber && <a className="chip" href={daten.ratgeber.href}>📰 Ratgeber „{daten.ratgeber.titel}“</a>}
        {daten.tool && <a className="chip" href={daten.tool.href}><i className={`dot dot--${daten.tool.typ}`} /> {daten.tool.titel}</a>}
        <BegriffMerken slug={daten.slug} />
      </div>
      {daten.frage && (
        <div className="begriff-k__leo">
          <div className="wort wort--frage"><span className="kicker">Dazu wird oft gefragt</span><p>{daten.frage}</p></div>
          {daten.antwort && (
            <div className="wort wort--leo">
              <img src="/assets/leo.svg" alt="Leo" />
              <div>
                <span className="kicker kicker--gruen">Leo</span>
                <p>{daten.antwort}</p>
                {daten.quelle && <div className="quellen"><b>Quelle</b><span>› {daten.quelle}</span></div>}
              </div>
            </div>
          )}
        </div>
      )}
      <GlossarDaten daten={[daten]} />
    </article>
  );
}
