#!/usr/bin/env node
/**
 * Holt die Wertelisten von financeads und legt sie als Datei im Repo ab.
 *
 *   node tools/financeads-listen.mjs [--prüfen]
 *
 * 🚨 Diese Endpunkte sind der Grund, warum unsere Vergleiche Auswahlmöglichkeiten
 * vermissen ließen. Sie stehen in der OpenAPI-Spezifikation
 * (`api.financeads.net/documentation/v1/affiliate.yaml`, nur mit eingeloggter Browser-
 * Sitzung lesbar) und veröffentlichen, welche Werte ein Parameter überhaupt annimmt —
 * Kreditkartenanbieter, Zielgruppen, Börsenplätze, Verwendungszwecke und, für die
 * Tierversicherung, **579 Rassen mit ihrer Risikogruppe**.
 *
 * Ohne sie war der Weg zu den gültigen Werten Raten: ein gültiger Parameter mit
 * ungültigem Wert wird namentlich gerügt, ein unbekannter stillschweigend ignoriert.
 * Dabei ist mir `coverage` bei der Tierversicherung durchgerutscht — die Doku führt ihn,
 * meine Messung hielt ihn für erfunden.
 *
 * Die Listen ändern sich selten (Rassen, Anbieter, Börsenplätze). Sie liegen deshalb als
 * generierte Datei im Repo, nicht als Abruf zur Laufzeit — dieselbe Überlegung wie beim
 * Registry-Zwilling. Wer die Datei neu baut, committet sie mit.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pruefen = process.argv.includes("--prüfen") || process.argv.includes("--pruefen");
const wurzel = fileURLToPath(new globalThis.URL("..", import.meta.url));
const env = readFileSync(`${wurzel}.env.local`, "utf8");
const cfg = {};
for (const z of env.split("\n")) { const m = z.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) cfg[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const { FINANCEADS_API_KEY: key, FINANCEADS_ADSPACE: ads } = cfg;
if (!key || !ads) { console.error("FINANCEADS_API_KEY / FINANCEADS_ADSPACE fehlen in .env.local"); process.exit(1); }

/** Name im Repo → Pfad bei financeads (+ Pflichtparameter). */
const LISTEN = {
  hunderassen: ["list/pethealthinsurance/animalbreeds", { animal_type: "dog" }],
  katzenrassen: ["list/pethealthinsurance/animalbreeds", { animal_type: "cat" }],
  tierarten: ["list/pethealthinsurance/animals", {}],
  kreditverwendung: ["list/loans/usage", {}],
  kartenanbieter: ["list/creditcards/providers", {}],
  bankkartenanbieter: ["list/bankingcards/providers", {}],
  kontozielgruppen: ["list/currentaccounts/targetgroups", {}],
  kontowege: ["list/currentaccounts/bankingmethods", {}],
  kontosicherheit: ["list/currentaccounts/securityprocedures", {}],
  geschaeftszielgruppen: ["list/businessaccounts/targetgroups", {}],
  boersenplaetze: ["list/brokerageaccounts/stockexchanges", {}],
  boersenplaetzeVerfuegbar: ["list/brokerageaccounts/availablestockexchanges", {}],
  depotzielgruppen: ["list/brokerageaccounts/targetgroups", {}],
  kryptowaehrungen: ["list/crypto/currencies", {}],
  crowdorte: ["list/crowdinvesting/locations", {}],
  regionen: ["list/regions", {}],
  kautionsverwendung: ["list/rentaldepositinsurance/usage", {}],
  steuerplattformen: ["list/taxsoftware/availableplatforms", {}],
  steuerzielgruppen: ["list/taxsoftware/targetgroups", {}],
  reiseversicherte: ["list/travelhealth/insuredpersons", {}],
};

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const aus = {};
let fehler = 0;
for (const [name, [pfad, extra]] of Object.entries(LISTEN)) {
  const q = new URLSearchParams({ api_key: key, adspace: ads, country_iso2: "de", ...extra });
  let j;
  try { j = await (await fetch(`https://api.financeads.net/api/v1/affiliate/${pfad}?${q}`)).json(); }
  catch (e) { console.error(`✗ ${name}: ${e.message}`); fehler++; continue; }
  const d = j?.data;
  if (!j?.success || !Array.isArray(d)) { console.error(`✗ ${name}: keine Liste (${JSON.stringify(j?.message ?? "")})`); fehler++; continue; }
  // Nur, was wir brauchen: Schlüssel, deutscher Name und — bei Rassen — die Risikogruppe.
  aus[name] = d.map((e) => {
    const label = e.languages?.de ?? e.languages?.en ?? String(e.key);
    const z = { wert: String(e.key), label };
    // 🚨 Der Partner führt Rassen umgedreht: „Bulldogge, Englische", „Dogge, Deutsche".
    // So sucht niemand. Die natürliche Schreibweise kommt als `anzeige` dazu, gesucht
    // wird später über beide.
    const m = /^(.+?),\s*(.+)$/.exec(label);
    if (m) z.anzeige = `${m[2]} ${m[1]}`;
    if (e.risk_group) z.gruppe = e.risk_group;
    return z;
  });
  console.log(`${name.padEnd(26)} ${String(aus[name].length).padStart(4)} Einträge   ${aus[name].slice(0, 3).map((x) => x.label).join(", ")}${aus[name].length > 3 ? " …" : ""}`);
  await pause(350);
}

const datei = `${wurzel}lib/financeads/listen.generated.json`;
const neu = JSON.stringify({ _hinweis: "Erzeugt von tools/financeads-listen.mjs — nicht von Hand ändern.", _stand: new Date().toISOString().slice(0, 10), ...aus }, null, 1) + "\n";
if (pruefen) {
  const alt = readFileSync(datei, "utf8");
  // Der Stand darf sich unterscheiden, der Inhalt nicht.
  const ohneStand = (s) => s.replace(/"_stand": "[^"]*",?/, "");
  if (ohneStand(alt) === ohneStand(neu)) { console.log("\n✓ listen.generated.json ist aktuell."); process.exit(0); }
  console.error("\n✗ listen.generated.json weicht ab — `node tools/financeads-listen.mjs` laufen lassen und mitcommitten.");
  process.exit(1);
}
writeFileSync(datei, neu);
console.log(`\n${Object.keys(aus).length} Listen geschrieben (${(neu.length / 1024).toFixed(0)} KB), ${fehler} Fehler.`);
process.exit(fehler ? 1 : 0);
