"use client";

/**
 * Register im Zeitungskopf: Ratgeber · Finanztools · Service · Finanzleser Plus.
 * Die dunkle Pille mit Lupe und den zwei Linien kommt aus lib/hooks/useNavPill
 * (dieselbe Choreografie wie die alte TopNav). Ein Tipp öffnet das Registerblatt.
 */
import { Fragment, useEffect, useRef } from "react";
import gsap from "@/lib/gsapConfig";
import { useNavPill } from "@/lib/hooks/useNavPill";
import Spark from "@/components/ui/Spark";
import { useFaden, type BlattZustand } from "@/components/faden/FadenProvider";
import Pfad from "./Pfad";

const EINTRAEGE: { key: BlattZustand["key"]; label: string; href: string }[] = [
  { key: "ratgeber", label: "Ratgeber", href: "/" },
  { key: "finanztools", label: "Finanztools", href: "/finanztools" },
  { key: "service", label: "Service", href: "/anbieter" },
  { key: "plus", label: "Finanzleser Plus", href: "/plus" },
];

export default function Register() {
  const { blatt, blattOeffnen, blattZu, punkte } = useFaden();
  const blattRef = useRef(blatt); blattRef.current = blatt;
  const pill = useNavPill({
    items: EINTRAEGE.map((e) => ({ label: e.label, href: e.href })),
    hasLens: true,
    onActivate: (label) => {
      const e = EINTRAEGE.find((x) => x.label === label);
      if (!e) return;
      // Von außen geöffnet (Kategorie-Route): Rubrik/Thema nicht zurücksetzen.
      if (blattRef.current?.key === e.key) return;
      blattOeffnen(e.key);
    },
    onDeactivate: () => blattZu(),
  });

  // Linse gegen die Pille verschieben, damit unter der Pille der richtige Eintrag steht
  // (wie in TopNav.tsx; Layout-Writes nur bei Änderung).
  useEffect(() => {
    let lastPx = NaN, lastPw = NaN;
    const sync = () => {
      if (!pill.pillRef.current || !pill.lensRef.current) return;
      const px = gsap.getProperty(pill.pillRef.current, "x") as number;
      const pw = gsap.getProperty(pill.pillRef.current, "width") as number;
      if (px === lastPx && pw === lastPw) return;
      lastPx = px; lastPw = pw;
      gsap.set(pill.lensRef.current, { x: -px });
      pill.lensRef.current.style.transformOrigin = `${px + pw / 2}px center`;
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, [pill.pillRef, pill.lensRef]);

  // Blatt von außen geschlossen (Escape, Klick daneben, Navigation) → Pille zurücknehmen;
  // von außen geöffnet (Kategorie-Route) → Pille auf den Eintrag setzen.
  useEffect(() => {
    if (!blatt) { if (pill.menuOpen.current) pill.closeMenu(); return; }
    const e = EINTRAEGE.find((x) => x.key === blatt.key);
    if (e && pill.activeLabel.current !== e.label) pill.activateItem(e.label);
  }, [blatt, pill]);

  return (
    <nav className="register" id="register" aria-label="Register">
      <div className="register__reihe" {...pill.containerProps}>
        {pill.renderPill()}
        <Spark />
        {EINTRAEGE.map((e, i) => (
          <Fragment key={e.key}>
            {i > 0 && <Spark />}
            <button type="button" data-key={e.key} className={blatt?.key === e.key ? "offen" : ""} {...pill.getButtonProps(i)}>{e.label}{e.key === "plus" && punkte > 0 && <small className="punkte-zahl">· {punkte} P.</small>}</button>
          </Fragment>
        ))}
        <Spark />
      </div>
      <Pfad />
    </nav>
  );
}
