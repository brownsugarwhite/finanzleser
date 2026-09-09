/**
 * Die Hülle des Fadens (Stufe 1): Kopf mit Register, Randspalten, Strom mit der Seite
 * als lebendem Kapitel, Eingabe.
 *
 * Gegenstück zu components/layout/SeitenHuelle.tsx — beide werden in app/layout.tsx über
 * next/dynamic geladen, damit nur die tatsächlich gerenderte im Bundle landet (siehe
 * Kommentar dort). Megamenü, Preview-Slider, Morph-Übergänge und das Leo-Dock bleiben
 * ausschließlich in der alten Hülle.
 */
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { NavProvider } from "@/lib/NavContext";
import type { NavItem } from "@/lib/NavContext";
import type { MegamenuPreload } from "@/lib/wordpress";
import type { Level } from "@/lib/faden/optionen";
import FadenShell from "./FadenShell";

export default function FadenHuelle({
  children, navItems, megamenuPreload, level,
}: {
  children: ReactNode;
  navItems: NavItem[];
  megamenuPreload: MegamenuPreload;
  level?: Level[];
}) {
  return (
    <Providers>
      <NavProvider items={navItems}>
        <FadenShell nav={navItems} preload={megamenuPreload} level={level}>{children}</FadenShell>
      </NavProvider>
    </Providers>
  );
}
