/**
 * Prüft die recherchierten Statistik-Datensätze (docs/inhalte/statistik-v2-*.json),
 * bevor sie ins CMS gehen.
 *
 * Nutzt die ECHTEN Regeln aus lib/statistik/schema.ts — Node führt TypeScript direkt aus
 * (Typen werden abgestreift). So gibt es keine dritte Kopie der Prüfregeln neben
 * schema.ts und blocks.js.
 *
 *   node tools/statistik-v2-pruefen.mjs                 # alle Dateien
 *   node tools/statistik-v2-pruefen.mjs pflegeversicherung
 */
import fs from "node:fs";
import path from "node:path";
import { pruefeStatistik, FORM_NAME, packeStatistik, parseStatistik } from "../lib/statistik/schema.ts";

const ORDNER = "docs/inhalte";
const filter = process.argv[2];
const dateien = fs.readdirSync(ORDNER)
  .filter((f) => /^statistik-v2-.*\.json$/.test(f))
  .filter((f) => !filter || f.includes(filter));

if (!dateien.length) { console.error("Keine Datei gefunden."); process.exit(1); }

const liste = JSON.parse(fs.readFileSync(path.join(ORDNER, "beitraege-liste.json"), "utf8"));
let fehler = 0, gesamt = 0;
const formZaehler = {};

for (const datei of dateien) {
  const d = JSON.parse(fs.readFileSync(path.join(ORDNER, datei), "utf8"));
  const beitrag = liste.find((p) => p.slug === d.slug);
  console.log(`\n━━ ${datei}  →  ${d.slug} → ${d.kopie}`);
  if (!beitrag) { console.log("  ✗ Quellbeitrag steht nicht in beitraege-liste.json"); fehler++; continue; }
  const h2 = beitrag.h2 || [];

  d.bloecke.forEach((b, i) => {
    gesamt++;
    const st = b.statistik;
    formZaehler[st.art] = (formZaehler[st.art] || 0) + 1;
    const befunde = pruefeStatistik(st);

    // Zielabschnitt muss es geben und ein Fachabschnitt sein (ab heading-2, nicht Fazit/FAQ).
    if (b.nach !== "ende") {
      const m = /^heading-(\d+)$/.exec(b.nach || "");
      if (!m) befunde.push(`„nach“ ist weder „ende“ noch heading-<n>: ${b.nach}`);
      else {
        const n = Number(m[1]);
        if (n >= h2.length) befunde.push(`heading-${n} gibt es nicht — der Beitrag hat ${h2.length} Zwischentitel.`);
        else if (n < 2) befunde.push(`heading-${n} ist Kicker oder Einleitung, kein Fachabschnitt.`);
        else if (/^fazit\b/i.test(h2[n]) || /h[äa]ufig|faq/i.test(h2[n])) befunde.push(`heading-${n} ist „${h2[n]}“ — Fazit und FAQ tragen keine Statistik im Abschnitt.`);
      }
    }

    // Rundlauf: was ins CMS geht, muss auch wieder herauskommen.
    const zurueck = parseStatistik(packeStatistik(st));
    if (!zurueck) befunde.push("Rundlauf über base64 schlägt fehl.");

    const marke = befunde.length ? "✗" : "✓";
    const wo = b.nach === "ende" ? "ende" : `${b.nach} (${h2[Number(/\d+/.exec(b.nach)[0])] || "?"})`;
    console.log(`  ${marke} ${String(i + 1).padStart(2)}. ${FORM_NAME[st.art].padEnd(18)} ${st.titel}`);
    console.log(`       ${wo}`);
    for (const f of befunde) { console.log(`       → ${f}`); fehler++; }
  });
}

console.log("\n━━ Abdeckung der Formen");
for (const art of Object.keys(FORM_NAME)) {
  const n = formZaehler[art] || 0;
  // Zwei Formen teilen sich denselben Anzeigenamen („Statistik", „Vergleich"), deshalb
  // steht der Schlüssel daneben.
  console.log(`  ${n ? " " : "✗"} ${art.padEnd(20)} ${FORM_NAME[art].padEnd(20)} ${n}×`);
}
console.log(`\n${gesamt} Blöcke, ${fehler} Beanstandungen.`);
process.exit(fehler ? 1 : 0);
