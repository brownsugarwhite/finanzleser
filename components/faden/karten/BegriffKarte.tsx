/**
 * Begriffskarte für /glossar/<slug>: Erklärung (andere Begriffe darin verlinkt, höchstens
 * drei), Quelle, Schreibweisen, Ratgeber und Werkzeug, die vorbereitete Leo-Frage mit
 * Antwort. Alles im SSR-HTML.
 */
import type { GlossarEintrag } from "@/lib/types";
import { getGlossarIndex, loeseBegriff, loeseBegriffe } from "@/lib/faden/glossar";
import { neuerKontext, verlinke } from "@/lib/faden/verlinken";
import { medienHtml } from "@/lib/faden/medien";
import GlossarDaten from "@/components/faden/glossar/GlossarDaten";
import BegriffMerken from "@/components/faden/glossar/BegriffMerken";
import { FrageBlase, LeoBlase } from "@/components/faden/leo/Blase";

export default async function BegriffKarte({ eintrag }: { eintrag: GlossarEintrag }) {
  const index = await getGlossarIndex();
  const daten = await loeseBegriff(eintrag);
  const ctx = neuerKontext(index, { max: 3 });
  ctx.gesehen.add(eintrag.slug); // sich selbst nicht verlinken
  const html = verlinke(medienHtml(eintrag.content || ""), ctx);
  // 🚨 Die Erklärung verlinkt bis zu drei weitere Begriffe. Fehlen die in der Nutzlast,
  // holt das Klickmenü sie beim Antippen einzeln über /api/faden/glossar/<slug> — also
  // eine CMS-Abfrage mitten in der Geste. Sie gehören mit auf die Seite.
  const weitere = await loeseBegriffe(
    [...ctx.gesehen].filter((sl) => sl !== eintrag.slug).map((sl) => index.get(sl)).filter((e): e is NonNullable<typeof e> => !!e),
  );
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
          <div className="wort wort--frage"><span className="kicker">Dazu wird oft gefragt</span><FrageBlase><p>{daten.frage}</p></FrageBlase></div>
          {daten.antwort && (
            <div className="wort wort--leo">
              <span className="kicker kicker--gruen">Leo</span>
              <LeoBlase>
                <p>{daten.antwort}</p>
                {daten.quelle && <div className="quellen"><b>Quelle</b><span>› {daten.quelle}</span></div>}
              </LeoBlase>
            </div>
          )}
        </div>
      )}
      <GlossarDaten daten={[daten, ...weitere]} />
    </article>
  );
}
