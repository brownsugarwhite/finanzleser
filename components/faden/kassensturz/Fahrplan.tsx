/**
 * Der Fahrplan auf dem Deckblatt des Kassensturzes — Baustein 3 der Übergabe
 * „Finanzleser Heute“: drei Stationen auf einer Linie, jede mit Kreis, Ziffer, Titel und
 * einem kursiven Halbsatz darunter.
 *
 * Er beantwortet die Frage, die vor jedem Fragebogen steht: Wie lange dauert das, und was
 * bekomme ich am Ende? Deshalb steht er VOR dem Knopf, nicht daneben.
 *
 * 🚨 Die Linie läuft nur zwischen den Kreisen, nicht über die ganze Breite — sie beginnt
 * und endet auf dem ersten und letzten Kreis (`left/right: 16.6%`, also je eine halbe
 * Spalte). Über die volle Breite gezogen sähe sie aus wie ein Trennstrich.
 */
const STATIONEN = [
  { titel: "Fragen antippen", text: "ohne Tastatur, eine Schätzung" },
  { titel: "Beleg druckt mit", text: "jede Antwort eine Zeile" },
  { titel: "Ergebnis sofort", text: "Profil, Ampel, drei Lücken" },
];

export default function Fahrplan({ fragen }: { fragen?: number }) {
  return (
    <ol className="ks-fahrplan">
      <i className="ks-fahrplan__linie" aria-hidden="true" />
      {STATIONEN.map((s, i) => (
        <li key={s.titel} style={{ animationDelay: `calc(.15s + ${i} * .12s)` }}>
          <span className="ks-fahrplan__kreis">{i + 1}</span>
          <b>{i === 0 && fragen ? `${fragen} ${s.titel}` : s.titel}</b>
          <small>{s.text}</small>
        </li>
      ))}
    </ol>
  );
}
