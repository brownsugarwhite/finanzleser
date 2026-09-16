"use client";

/**
 * Die Rassenwahl — 579 Hunde- und 50 Katzenrassen, wie der Vergleichsrechner des Partners
 * sie führt.
 *
 * 🚨 Die API kennt keinen Parameter „Rasse". Sie kennt drei Risikogruppen, und welche
 * Rasse in welcher liegt, steht in einer eigenen Liste des Partners
 * (`list/pethealthinsurance/animalbreeds`, hier als `listen.generated.json`). Diese
 * Komponente ist deshalb genau die Übersetzung: der Leser wählt eine Rasse, gesetzt wird
 * die Gruppe. Gemessen: 160 Hunderassen in Gruppe 1, 321 in Gruppe 2, 98 in Gruppe 3 —
 * die Einteilung folgt der Größe, nicht den Listenhunden. **Alle 50 Katzenrassen liegen
 * in Gruppe 1**, dort ändert die Wahl also nichts; sie steht trotzdem da, damit niemand
 * rätselt, ob seine Rasse dabei ist.
 *
 * 🚨 Ein Register mit 579 Einträgen wäre unbedienbar, und in `DefLite` hätte die Liste
 * 39 KB in jede Seite getragen. Deshalb ein Eingabefeld mit `<datalist>`: Tippen filtert,
 * der Browser bringt die Bedienung mit, und die Liste wird erst geladen, wenn dieses Feld
 * wirklich steht.
 */
import { useEffect, useMemo, useState } from "react";
import { SPARK_PFAD } from "@/components/ui/Spark";

export interface Rasse { wert: string; label: string; anzeige?: string; gruppe?: string }

export interface RassenwahlProps {
  label: string;
  /** Welche Liste — „hunderassen" oder „katzenrassen". */
  liste: string;
  /** Die aktuell gesetzte Gruppe (RG1/RG2/RG3). */
  gruppe: string;
  onGruppe: (gruppe: string) => void;
  werkzeug?: "tuerkis" | "magenta";
}

const FARBE = { tuerkis: "var(--kb-tuerkis)", magenta: "var(--kb-magenta)" };

export default function Rassenwahl({ label, liste, gruppe, onGruppe, werkzeug = "tuerkis" }: RassenwahlProps) {
  const [rassen, setRassen] = useState<Rasse[] | null>(null);
  const [text, setText] = useState("");
  // 🚨 Kein useId für das Listen-Id: im Faden weichen Server und Client voneinander ab
  // (gemessen). Der Listenname ist ohnehin eindeutig genug.
  const listenId = `kb-rassen-${liste}`;

  useEffect(() => {
    let aktiv = true;
    import("@/lib/financeads/listen.generated.json")
      .then((m) => { if (aktiv) setRassen(((m.default ?? m) as unknown as Record<string, Rasse[]>)[liste] ?? []); })
      .catch(() => { /* ohne Liste bleibt die Gruppe direkt wählbar */ });
    return () => { aktiv = false; };
  }, [liste]);

  /**
   * 🚨 Beim Wechsel von Hund auf Katze muss die Gruppe zurück.
   * Sonst bleibt „Deutsche Dogge, Gruppe 3" stehen und die Katzenliste zeigt einen
   * einzigen Tarif — alle Katzenrassen liegen in Gruppe 1.
   */
  const [letzteListe, setLetzteListe] = useState(liste);
  useEffect(() => {
    if (liste === letzteListe) return;
    setLetzteListe(liste);
    setText("");
    onGruppe("RG1");
  }, [liste, letzteListe, onGruppe]);

  /**
   * 🚨 Gesucht wird über BEIDE Schreibweisen. Der Partner führt „Bulldogge, Englische";
   * getippt wird „Englische Bulldogge". Ohne das findet niemand seinen Hund.
   */
  const nachName = useMemo(() => {
    const m = new Map<string, Rasse>();
    for (const r of rassen ?? []) {
      m.set(r.label.toLowerCase(), r);
      if (r.anzeige) m.set(r.anzeige.toLowerCase(), r);
    }
    return m;
  }, [rassen]);

  const finde = (roh: string): Rasse | undefined => {
    const t = roh.trim().toLowerCase();
    if (!t) return undefined;
    const genau = nachName.get(t);
    if (genau) return genau;
    if (t.length < 3) return undefined;
    // Nur übernehmen, wenn die Eingabe eindeutig ist — sonst springt die Gruppe beim Tippen.
    const treffer = (rassen ?? []).filter((r) => r.label.toLowerCase().includes(t) || (r.anzeige ?? "").toLowerCase().includes(t));
    return treffer.length === 1 ? treffer[0] : undefined;
  };

  const uebernehmen = (roh: string) => {
    const treffer = finde(roh);
    if (treffer?.gruppe) onGruppe(treffer.gruppe);
  };

  const erkannt = finde(text);
  const nummer = gruppe.replace(/\D/g, "");

  return (
    <div className="kb-register kb-rassenwahl" style={{ "--kb-feld-farbe": FARBE[werkzeug] } as React.CSSProperties}>
      <span className="kb-register__label">{label}</span>

      <div className="kb-rassenwahl__zeile">
        <input
          className="kb-rassenwahl__feld"
          list={listenId}
          value={text}
          placeholder={rassen ? "Rasse eintippen …" : "Rassen werden geladen …"}
          aria-label={label}
          onChange={(e) => { setText(e.target.value); uebernehmen(e.target.value); }}
          onBlur={(e) => uebernehmen(e.target.value)}
        />
        <span className="kb-rassenwahl__gruppe">
          {erkannt ? `Gruppe ${nummer}` : `Gruppe ${nummer} · Rasse eintippen`}
          <svg width="14" height="14" viewBox="0 0 12 12.0005" className="kb-register__spark" aria-hidden="true">
            <path d={SPARK_PFAD} fill="currentColor" />
          </svg>
        </span>
      </div>

      <div className="kb-feldlinien" aria-hidden="true">
        <i className="kb-feldlinien__grund" />
        <i className="kb-feldlinien__doppel kb-feldlinien__doppel--stark" />
        <i className="kb-feldlinien__doppel kb-feldlinien__doppel--fein" />
      </div>

      <datalist id={listenId}>
        {(rassen ?? []).map((r) => <option key={r.wert} value={r.anzeige ?? r.label} />)}
      </datalist>
    </div>
  );
}
