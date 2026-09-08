"use client";

/** „Abschnitt teilen“ oben rechts in jedem Abschnitt (Prototyp 04-js-inhalt.html:321): Teilen-Dialog mit Anker-Adresse. */
import { teilenOeffnen } from "@/components/faden/TeilenDialog";

export default function AbschnittTeilen({ titel, url, id }: { titel: string; url: string; id: string }) {
  return <button type="button" className="textlink textlink--still teilen" onClick={(e) => teilenOeffnen(titel, `https://www.finanzleser.de${url}#${id}`, e.currentTarget)}>Abschnitt teilen</button>;
}
