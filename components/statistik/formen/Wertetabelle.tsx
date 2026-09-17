/**
 * Die Werte einer Form als echte Tabelle — unsichtbar, aber lesbar.
 *
 * 🚨 Warum es das gibt: Säulen und Linien setzen Zahlen und Beschriftungen aus
 * Layoutgründen in zwei getrennte Reihen. Im Textauszug steht deshalb erst „3,3 2,6 8,6 …"
 * und danach „unter 20 20–65 65–70 …" — die Zuordnung geht verloren. Suchmaschinen,
 * Sprachmodelle und Vorleseprogramme lesen genau diesen Auszug.
 *
 * Die Tabelle steht direkt hinter der Grafik und stellt die Paare wieder her. Die Grafik
 * selbst trägt dann `aria-hidden`, damit nichts zweimal vorgelesen wird.
 */
export default function Wertetabelle({ titel, spalte, reihen, zeilen }: {
  titel: string;
  /** Kopf der ersten Spalte, etwa „Jahr" oder „Altersgruppe". */
  spalte: string;
  /** Namen der Wertespalten — eine je Reihe der Grafik. */
  reihen: string[];
  zeilen: { name: string; werte: string[] }[];
}) {
  // Die Hülle trägt die Klasse, nicht die Tabelle selbst: eine Tabelle wächst auf ihre
  // Inhaltsbreite und ignoriert width:1px — sie stünde dann als unsichtbarer, aber
  // mehrere hundert Pixel breiter Kasten im Layout.
  return (
    <div className="nur-vorlesen">
      <table>
        <caption>{titel}</caption>
        <thead>
        <tr>
          <th scope="col">{spalte}</th>
          {reihen.map((r) => <th key={r} scope="col">{r}</th>)}
        </tr>
        </thead>
        <tbody>
        {zeilen.map((z) => (
          <tr key={z.name}>
            <th scope="row">{z.name}</th>
            {z.werte.map((w, i) => <td key={i}>{w}</td>)}
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}
