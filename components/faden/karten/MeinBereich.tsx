"use client";

/**
 * „Mein Bereich“ (Port des Plus-Blatts aus dem Prototyp, 03-js-core.html plusBlatt(), ohne
 * Anmeldung): Level-Ring mit Punkten und Serie, Wappen-Album (05-js-neu.html wappenKarte()),
 * Aktenkoffer- und Wächter-Stand mit Links, Belohnungen je Level.
 */
import type { WaechterRegel } from "@/lib/faden/optionen";
import { levelZu } from "@/lib/faden/optionen";
import { WAPPEN, WAPPEN_FARBEN } from "@/lib/faden/wappen";
import { useWaechter } from "@/lib/faden/waechter";
import { useFaden } from "@/components/faden/FadenProvider";
import FadenIkon from "@/components/faden/FadenIkon";

export default function MeinBereich({ regeln }: { regeln: WaechterRegel[] }) {
  const { punkte, serie, wappen, level, koffer, toast } = useFaden();
  const [stand] = useWaechter();
  const { aktuell, naechstes } = levelZu(punkte, level);
  const stufe = [...level].sort((a, b) => a.ab - b.ab).findIndex((l) => l.name === aktuell.name) + 1;
  const anteil = naechstes ? Math.min(1, (punkte - aktuell.ab) / Math.max(1, naechstes.ab - aktuell.ab)) : 1;
  const U = 2 * Math.PI * 34;
  const aktiveWaechter = regeln.filter((r) => stand[r.key]).length;
  return (
    <div className="bereich">
      <div className="level level--karte">
        <div className="level__innen">
          <div className="level__ring">
            <svg viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--rule)" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--pink)" strokeWidth="6" strokeLinecap="round" strokeDasharray={U} strokeDashoffset={U * (1 - anteil)} transform="rotate(-90 40 40)" />
            </svg>
            <b>{stufe}</b>
          </div>
          <div>
            <span className="level__stempel">{aktuell.name}</span>
            <p><b>{punkte} Punkte</b> · Finanzwort-Serie {serie} {serie === 1 ? "Tag" : "Tage"}.{naechstes ? ` Bis „${naechstes.name}“ fehlen ${naechstes.ab - punkte} Punkte.` : " Höchstes Level erreicht."}</p>
          </div>
        </div>
      </div>

      <div className="bereich__spalten">
        <div>
          <span className="kicker kicker--gruen">Aktenkoffer · {koffer.length} {koffer.length === 1 ? "Beleg" : "Belege"}</span>
          <span className="hinweis">Ergebnisse · Checklisten · Vergleiche · Gespräche</span>
          {koffer.slice(0, 3).map((t) => <div key={t} className="beleg"><b>{t}</b><small>ungesichert · in diesem Browser</small></div>)}
          <a className="textlink" href="/plus/aktenkoffer">Aktenkoffer öffnen</a>
        </div>
        <div>
          <span className="kicker kicker--gruen">Wächter · {aktiveWaechter} von {regeln.length} aktiv</span>
          {regeln.slice(0, 3).map((r) => <div key={r.key} className="regel"><b>{r.titel}</b><span>{r.regel}</span><i className={"toggle" + (stand[r.key] ? " an" : "")} aria-hidden="true" /></div>)}
          <a className="textlink" href="/plus/waechter">Wächter einstellen</a>
        </div>
        <div>
          <span className="kicker kicker--gruen">Profil</span>
          <div className="profil">
            <span className="profil-ring"><FadenIkon name="person" /></span>
            <span><b>Gast</b> · ohne Anmeldung</span>
            <span>Aktenkoffer, Wächter und Punkte bleiben in diesem Browser.</span>
            <span>Wochenbrief: donnerstags · über die linke Randspalte</span>
          </div>
          <span className="kicker kicker--pink">Belohnungen</span>
          <ul className="belohnungen">
            {[...level].sort((a, b) => a.ab - b.ab).map((l) => <li key={l.name}>{punkte >= l.ab ? "✓" : "○"} {l.belohnung || l.name} · {l.name}{punkte < l.ab ? `, noch ${l.ab - punkte} Punkte` : ""}</li>)}
          </ul>
          <button type="button" className="textlink textlink--still" onClick={() => toast("Anmelden, Sichern und Konto kommen mit Finanzleser Plus (Stufe 3).")}>Anmelden · Finanzleser Plus</button>
        </div>
      </div>

      <div className="album">
        <span className="kicker kicker--pink">Sammelalbum · Ihre Wappen</span>
        <div className="album__raster">
          {WAPPEN.map((w, i) => {
            const offen = wappen.includes(w.key);
            return (
              <div key={w.key} className={"wappen" + (offen ? "" : " zu")} data-k={w.key} style={{ animationDelay: `${i * 50}ms` }} title={w.name}>
                <svg viewBox="0 0 24 24" className="wappen__schild" aria-hidden="true"><path d="M12 2l9 3.5v6.5c0 5.5-4 9-9 10-5-1-9-4.5-9-10V5.5z" fill={WAPPEN_FARBEN[i % WAPPEN_FARBEN.length]} /></svg>
                <FadenIkon name={w.ikon} />
                <span>{w.name}</span>
              </div>
            );
          })}
        </div>
        <p className="album__stand"><b>{wappen.length} von {WAPPEN.length}</b> Wappen. Jedes Thema, das Sie zu Ende lesen oder rechnen, bringt eines; zwölf öffnen den Versicherungs-Check bei Finconext.</p>
      </div>
    </div>
  );
}
