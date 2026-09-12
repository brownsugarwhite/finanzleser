#!/usr/bin/env node
// Prüft und importiert einen handgeschriebenen Inhalts-Stapel, danach Export und Prototyp-Build.
//   node tools/faden-stapel.mjs 01        → docs/inhalte/glossar-batch-01.json + felder-batch-01.json
// Prüfungen: Abschnitts-IDs gegen die h2-Liste (Titel werden angeglichen, Fachabschnitte ab heading-2, nie Fazit/FAQ),
// Glossar-Slugs, Tool-Slugs (rechner/checkliste/vergleich) und Beitrags-Slugs gegen den Bestand. Fehler stoppen den Import.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const nr = process.argv[2]; if (!nr) { console.error('Aufruf: faden-stapel.mjs <nr>'); process.exit(1); }
const J = p => JSON.parse(fs.readFileSync(path.join(wurzel, p), 'utf8'));
const liste = J('docs/inhalte/beitraege-liste.json'); const by = Object.fromEntries(liste.map(b => [b.slug, b]));
const dec = s => s.replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&#8220;|&#8222;/g, '„').replace(/&#8221;/g, '“').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = s => dec(s).toLowerCase().replace(/[^a-zäöüß0-9]/g, '');
const gDatei = `docs/inhalte/glossar-batch-${nr}.json`, fDatei = `docs/inhalte/felder-batch-${nr}.json`;
const glossarNeu = fs.existsSync(path.join(wurzel, gDatei)) ? J(gDatei) : []; const felder = J(fDatei);
const glossarAlle = new Set([...J('docs/inhalte/glossar-prototyp.json'), ...J('docs/inhalte/glossar-pilot.json'), ...glossarNeu].map(g => g.slug));
for (const f of fs.readdirSync(path.join(wurzel, 'docs/inhalte')).filter(f => /^glossar-batch-\d+\.json$/.test(f))) J('docs/inhalte/' + f).forEach(g => glossarAlle.add(g.slug));
async function alle(feld) { let out = [], after = null; for (let i = 0; i < 10; i++) { const r = await fetch('https://cms-dev.finanzleser.de/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: `query($a:String){ ${feld}(first:100, after:$a){ pageInfo{hasNextPage endCursor} nodes{ slug } } }`, variables: { a: after } }) }); const d = (await r.json()).data[feld]; out.push(...d.nodes.map(n => n.slug)); if (!d.pageInfo.hasNextPage) break; after = d.pageInfo.endCursor; } return new Set(out); }
const tools = { rechner: await alle('allRechner'), checkliste: await alle('checklisten'), vergleich: await alle('vergleiche') };
const fehler = [], hinweise = [];
// Glossar-Stapel
for (const g of glossarNeu) {
  if (g.ratgeber && !by[g.ratgeber]) { fehler.push(`Glossar ${g.slug}: Ratgeber ${g.ratgeber} fehlt`); }
  if (g.tool) { const [t, s] = g.tool.split('/'); if (!tools[t] || !tools[t].has(s)) fehler.push(`Glossar ${g.slug}: Tool ${g.tool} fehlt`); }
  if (!g.antwort || !g.quelle || !g.erklaerung) fehler.push(`Glossar ${g.slug}: Antwort/Quelle/Erklärung unvollständig`);
}
// Felder-Stapel
for (const e of felder) {
  const b = by[e.slug]; if (!b) { fehler.push(`Beitrag ${e.slug} unbekannt`); continue; } const h2 = b.h2.map(dec); const fl = e.felder;
  for (const q of fl.leo_fragen || []) {
    let i = h2.findIndex(h => norm(h) === norm(q.abschnitt_titel)); if (i < 0) i = h2.findIndex(h => norm(h).startsWith(norm(q.abschnitt_titel).slice(0, 18)));
    if (i < 0) { fehler.push(`${e.slug}: Abschnitt „${q.abschnitt_titel}“ nicht gefunden`); continue; }
    if (i < 2 || /^fazit\b/i.test(h2[i]) || /häufig gestellte fragen/i.test(h2[i])) fehler.push(`${e.slug}: Frage in Nicht-Fachabschnitt heading-${i}`);
    if (q.abschnitt !== 'heading-' + i) hinweise.push(`${e.slug}: ${q.abschnitt} → heading-${i} (${h2[i].slice(0, 40)})`);
    q.abschnitt = 'heading-' + i; q.abschnitt_titel = h2[i];
    if (!q.antwort || !(q.quellen || []).length) fehler.push(`${e.slug}: Frage ohne Antwort/Quelle: ${q.frage}`);
  }
  for (const g of fl.glossar_begriffe || []) if (!glossarAlle.has(g)) fehler.push(`${e.slug}: Glossar ${g} fehlt`);
  for (const d of fl.dazu_passt || []) if (d.typ === 'post' && !by[d.slug]) fehler.push(`${e.slug}: Dazu passt ${d.slug} fehlt`);
  for (const w of fl.leo_einwuerfe || []) if (tools[w.typ] && !tools[w.typ].has(w.slug)) fehler.push(`${e.slug}: Einwurf ${w.typ}/${w.slug} fehlt`);
  if (fl.kurzfassung && (!(fl.kurzfassung.saetze || []).length || !(fl.kurzfassung.quellen || []).length)) fehler.push(`${e.slug}: Kurzfassung ohne Sätze/Quellen`);
}
fs.writeFileSync(path.join(wurzel, fDatei), JSON.stringify(felder, null, 2) + '\n');
if (hinweise.length) console.log('Angeglichen:\n  ' + hinweise.join('\n  '));
if (fehler.length) { console.error('FEHLER:\n  ' + fehler.join('\n  ')); process.exit(1); }
console.log(`Stapel ${nr}: ${felder.length} Beiträge, ${felder.reduce((s, e) => s + (e.felder.leo_fragen || []).length, 0)} Fragen, ${glossarNeu.length} Glossar neu – geprüft.`);
const lauf = cmd => { console.log('> ' + cmd); execSync(cmd, { cwd: wurzel, stdio: 'inherit' }); };
if (glossarNeu.length) lauf(`node tools/faden-import.mjs glossar ${gDatei}`);
lauf(`node tools/faden-import.mjs felder ${fDatei}`);
if (!process.argv.includes('--ohne-build')) { lauf('node tools/faden-export.mjs'); lauf('python3 docs/prototype/build.py'); }
