/**
 * Listenkarte: Gruppen von Einträgen in der Optik des alten Megamenüs — kleine
 * Titelzeile mit Werkzeugpunkten, darunter fett der Untertitel. Für Rubrik-, Themen-
 * und Übersichtsseiten (Finanztools, Anbieter, Dokumente).
 */
import ToolDots, { type ToolType } from "@/components/ui/ToolDots";
import { boldYears } from "@/components/ui/MegaPostContent";

export interface ListenEintrag { titel: string; untertitel?: string; href: string; tools?: ToolType[]; meta?: string; dot?: ToolType }
export interface ListenGruppe { titel?: string; href?: string; zahl?: number; eintraege: ListenEintrag[] }

export default function ListenKarte({ gruppen, kicker }: { gruppen: ListenGruppe[]; kicker?: string }) {
  return (
    <div className="kasten kasten--still kasten--liste">
      {kicker && <span className="kicker kicker--gruen">{kicker}</span>}
      {gruppen.map((g, i) => (
        <section key={(g.titel || "") + i} className="liste__gruppe">
          {g.titel && (
            <h3 className="liste__titel">
              {g.href ? <a href={g.href}>{g.titel}</a> : g.titel}
              {typeof g.zahl === "number" && <small> · {g.zahl}</small>}
            </h3>
          )}
          <ul className="eintraege">
            {g.eintraege.map((e) => (
              <li key={e.href}>
                <a className="eintrag" href={e.href}>
                  {e.untertitel ? (
                    <>
                      <span className="eintrag__klein">{e.dot && <i className={`dot dot--${e.dot}`} />}<span>{e.titel}</span><ToolDots tools={e.tools} size={8} style={{ marginLeft: 0 }} /></span>
                      <b>{boldYears(e.untertitel)}</b>
                    </>
                  ) : (
                    <b className="eintrag__einzeilig">{e.dot && <i className={`dot dot--${e.dot}`} />}{boldYears(e.titel)}<ToolDots tools={e.tools} size={8} /></b>
                  )}
                  {e.meta && <small>{e.meta}</small>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
