"use client";

/**
 * Gereihte Balken als Gutenberg-Block.
 *
 * Dünne Hülle um `Balkenliste`, die den Bestandspfad bedient: sie hält den Überfahr-Zustand
 * selbst und übersetzt die Blockdaten in dieselben Segmente. So gibt es die Form nur einmal.
 */
import { useState } from "react";
import type { StatBalken } from "@/lib/statistik/schema";
import { PALETTE } from "@/lib/statistik/schema";
import Balkenliste from "./Balkenliste";
import type { Segment } from "../StatistikKarte";

export default function BalkenBlock({ st }: { st: StatBalken }) {
  const [hover, setHover] = useState<string | null>(null);
  const segmente: Segment[] = st.werte.map((w) => ({
    ...w,
    farbe: w.farbe || (st.hervor && w.label === st.hervor ? "var(--green)" : PALETTE[0]),
    aus: false,
    hervor: hover === w.label || (!hover && !!st.hervor && w.label === st.hervor),
  }));
  return <Balkenliste segmente={segmente} einheit={st.einheit} onHover={setHover} />;
}
