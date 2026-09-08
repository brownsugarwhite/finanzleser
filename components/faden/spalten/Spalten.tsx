"use client";

/**
 * Die Spalten: vier Rubriken als Zeitungsspalten mit ihren Themen. Ein Thema klappt die
 * Spalte auf (die anderen werden zum Buchrücken), zeigt die Ratgeber des Themas in
 * Zeilen wie das alte Megamenü (kleine Titelzeile mit Werkzeugpunkten, fetter
 * Untertitel) und die Werkzeuge zum Thema. Port von spaltenwahl() aus dem Prototyp.
 */
import { useState } from "react";
import ToolDots from "@/components/ui/ToolDots";
import { boldYears } from "@/components/ui/MegaPostContent";
import type { SpaltenRubrik } from "@/lib/faden/spalten";

export default function Spalten({ rubriken }: { rubriken: SpaltenRubrik[] }) {
  const [offen, setOffen] = useState<{ rk: string; tk: string } | null>(null);
  const n = rubriken.length || 1;
  const vorlage = offen
    ? rubriken.map((r) => (r.key === offen.rk ? `calc(100% - ${(n - 1) * 9}px - ${(n - 1) * 40}px)` : "40px")).join(" 9px ")
    : rubriken.map(() => `calc((100% - ${(n - 1) * 9}px) / ${n})`).join(" 9px ");
  const gesamt = rubriken.reduce((s, r) => s + r.zahl, 0);
  return (
    <article className="kasten kasten--still spalten-kasten" id="rubriken">
      <div className="spalten__kopf"><span className="kicker">Ratgeber · vier Rubriken · {gesamt} Ratgeber · ein Thema öffnet die Spalte</span></div>
      <div className={"spalten" + (offen ? " offen" : "")} style={{ gridTemplateColumns: vorlage }}>
        {rubriken.map((r, i) => {
          const istOffen = offen?.rk === r.key;
          const istRuecken = !!offen && !istOffen;
          const tk = istOffen ? offen.tk : r.themen[0]?.key;
          const th = r.themen.find((t) => t.key === tk) || r.themen[0];
          return (
            <Spalte key={r.key} erste={i === 0}>
              <div className={"spalte" + (istOffen ? " ist-offen" : "") + (istRuecken ? " ist-ruecken" : "")} data-key={r.key}>
                <div className="spalte__inhalt">
                  {r.icon && <img src={r.icon} alt="" />}
                  <b className="spalte__titel">{r.titel}</b>
                  <small>{r.zahl} Ratgeber · {r.themen.length} Themen</small>
                  <ul className="spalte__themen">
                    {r.themen.map((t) => (
                      <li key={t.key}><button type="button" onClick={() => setOffen({ rk: r.key, tk: t.key })}><span>{t.name}</span><small>{t.zahl}</small></button></li>
                    ))}
                  </ul>
                </div>
                <button type="button" className="spalte__ruecken" onClick={() => setOffen({ rk: r.key, tk: r.themen[0]?.key || "" })}>
                  {r.icon && <img src={r.icon} alt="" />}<span>{r.titel}</span>
                </button>
                {istOffen && th && (
                  <div className="spalte__offen">
                    <div className="spalte__kopfzeile">
                      {r.icon && <img src={r.icon} alt="" />}<b>{r.titel}</b><small>{r.zahl} Ratgeber · {r.themen.length} Themen</small>
                      <button type="button" className="textlink textlink--still" onClick={() => setOffen(null)}>Alle Rubriken ✕</button>
                    </div>
                    <div className="spalte__tabs">
                      {r.themen.map((t) => (
                        <button key={t.key} type="button" className={"chip" + (t.key === th.key ? " chip--aktiv" : "")} onClick={() => setOffen({ rk: r.key, tk: t.key })}>{t.name}</button>
                      ))}
                    </div>
                    <div className="spalte__liste">
                      {th.liste.map((e, j) => (
                        <a key={e.slug} className="spalte__artikel" href={e.href} style={{ animationDelay: `${60 + j * 55}ms` }}>
                          <span className="spalte__kleine"><span>{e.titel}</span><ToolDots tools={e.tools} size={8} style={{ marginLeft: 0 }} /></span>
                          <b>{e.untertitel ? boldYears(e.untertitel) : boldYears(e.titel)}</b>
                          <span className="pfeil-link">Ratgeber lesen<i /></span>
                        </a>
                      ))}
                    </div>
                    <div className="spalte__fuss">
                      {th.werkzeuge.length > 0 && <span className="kicker">Finanztools zum Thema</span>}
                      {th.werkzeuge.map((w) => (
                        <a key={w.typ + w.slug} className="chip chip--still" href={w.href}><i className={`dot dot--${w.typ}`} /> {w.titel}</a>
                      ))}
                      <a className="pfeil-link spalte__alle" href={th.zahl > th.liste.length ? th.href : r.href}>{th.zahl > th.liste.length ? `Alle ${th.zahl} Ratgeber in ${th.name}` : `Alle ${r.zahl} Ratgeber in ${r.titel}`}<i /></a>
                    </div>
                  </div>
                )}
              </div>
            </Spalte>
          );
        })}
      </div>
    </article>
  );
}

function Spalte({ children, erste }: { children: React.ReactNode; erste: boolean }) {
  return (
    <>
      {!erste && <div className="trenner"><svg className="spark" viewBox="0 0 12 12.0005" aria-hidden="true"><path d="M12 6.00047C10.3384 5.64978 8.28716 5.41362 7.24241 3.91374C6.47491 2.81169 6.27276 1.28871 6.00024 0.000471365C5.61861 1.71435 5.40087 3.79684 3.79407 4.83384C2.69548 5.54325 1.25351 5.72142 0 6.01226C1.28705 6.29225 2.79561 6.48692 3.89751 7.25194C5.4174 8.30686 5.61672 10.3366 6.00024 12.0005C6.17594 11.1204 6.33322 10.2272 6.62463 9.37638C7.27878 7.46453 8.37832 6.85223 10.2643 6.37379L12 6.00047Z" fill="currentColor" /></svg></div>}
      {children}
    </>
  );
}
