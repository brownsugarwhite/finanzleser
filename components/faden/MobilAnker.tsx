"use client";

/**
 * Mobile Anker-Anzeige (Port aus dem Prototyp, 05-js-neu.html): 320 × 100 am unteren Rand
 * ab 900 px Breite abwärts, erscheint nach 400 px Scrollweg, weicht der Eingabe (Fokus im
 * Feld blendet sie aus), schließbar für die Sitzung. Adblocker-neutral benannt.
 */
import { useEffect, useState } from "react";
import { useFaden } from "./FadenProvider";

export default function MobilAnker() {
  const { toast } = useFaden();
  const [da, setDa] = useState(false);
  const [zu, setZu] = useState(false);
  useEffect(() => {
    let sichtbar = false;
    const pruefe = () => {
      const eingabeAktiv = document.activeElement?.id === "frage";
      const neu = !zu && window.innerWidth <= 900 && window.scrollY > 400 && !eingabeAktiv && !document.body.classList.contains("faden-hero-sichtbar");
      if (neu !== sichtbar) { sichtbar = neu; setDa(neu); document.body.classList.toggle("mit-anker", neu); }
    };
    const spaeter = () => setTimeout(pruefe, 50);
    pruefe();
    window.addEventListener("scroll", pruefe, { passive: true });
    window.addEventListener("resize", pruefe);
    document.addEventListener("focusin", pruefe);
    document.addEventListener("focusout", spaeter);
    return () => {
      window.removeEventListener("scroll", pruefe); window.removeEventListener("resize", pruefe);
      document.removeEventListener("focusin", pruefe); document.removeEventListener("focusout", spaeter);
      document.body.classList.remove("mit-anker");
    };
  }, [zu]);
  if (!da) return null;
  return (
    <div className="anker" role="complementary" aria-label="Anzeige (Beispiel)">
      <span className="einschub__label">Anzeige</span>
      <a href="#" onClick={(e) => { e.preventDefault(); toast("Anzeige (Beispiel, fiktive Marke)"); }} data-faden-aus=""><img src="/assets/einschub/mo-pfotenschutz.svg" width={320} height={100} alt="Anzeige (Beispiel, fiktive Marke)" /></a>
      <button type="button" className="anker__zu" aria-label="Anzeige schließen" onClick={() => setZu(true)}>✕</button>
    </div>
  );
}
