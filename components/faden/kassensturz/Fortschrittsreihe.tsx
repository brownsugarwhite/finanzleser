/**
 * Fortschritt des Kassensturzes als Segmentreihe, 1:1 aus Design A v2 (Übergabe
 * Zeile 829–831): erledigte Segmente grün, das laufende in Tinte und einmal von links
 * aufgezogen, offene fast durchsichtig.
 *
 * Eigene Datei, damit der Teaser unter jedem Ratgeber sie benutzen kann, ohne den
 * ganzen Kassensturz in sein Bundle zu ziehen.
 */
export default function Fortschrittsreihe({ nr, gesamt }: { nr: number; gesamt: number }) {
  return (
    <div className="ks__fortschritt" aria-hidden="true">
      {Array.from({ length: Math.max(1, gesamt) }, (_, i) => (
        <i key={i} className={i < nr - 1 ? "ist-erledigt" : i === nr - 1 ? "ist-jetzt" : ""} />
      ))}
    </div>
  );
}
