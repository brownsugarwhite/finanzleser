"use client";

/**
 * Fußzeile eines Kastens wie im Prototyp (03-js-core.html kasten()): Teilen · In den
 * Aktenkoffer · Wächter setzen · Vorlesen · Das sieht Google, dazu „Eigene Seite öffnen“.
 */
import { useFaden } from "@/components/faden/FadenProvider";
import { teilenOeffnen } from "@/components/faden/TeilenDialog";
import { kulissenOeffnen } from "@/components/faden/Kulissen";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars --
   `kastenId` trug nur das Vorlesen. Der Prop bleibt im Vertrag, weil das Vorlesen nur
   pausiert ist und die Aufrufer die Kennung weiter mitgeben. */
export default function KastenFuss({ titel, url, kastenId, eigeneSeite }: { titel: string; url: string; kastenId: string; eigeneSeite?: boolean }) {
  const { inDenKoffer, toast } = useFaden();
  const voll = `https://www.finanzleser.de${url}`;
  return (
    <div className="kasten__fuss">
      <button type="button" className="textlink" onClick={(e) => teilenOeffnen(titel, voll, e.currentTarget)}>Teilen</button>
      <button type="button" className="textlink textlink--still" onClick={(e) => inDenKoffer(titel, e.currentTarget)}>In den Aktenkoffer</button>
      <button type="button" className="textlink textlink--still" onClick={() => toast("Wächter kommen mit Finanzleser Plus: Leo meldet sich, wenn sich ein Wert ändert.")}>Wächter setzen</button>
      <button type="button" className="textlink textlink--still" onClick={() => kulissenOeffnen(url, titel)}>Das sieht Google</button>
      {eigeneSeite && <a className="textlink textlink--still" href={url}>Eigene Seite öffnen</a>}
    </div>
  );
}
