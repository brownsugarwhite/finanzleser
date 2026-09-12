#!/usr/bin/env node
// Statistik-Stapel prüfen und importieren: node tools/statistik-stapel.mjs NN [--ohne-import]
// Quelle: docs/inhalte/statistik-batch-NN.json = [{ slug, statistiken: [{ abschnitt_titel, art, titel, einheit, quelle, reihen, regler?, hinweis? }] }]
// Prüfungen: Slug in beitraege-liste.json; abschnitt_titel exakt gegen die h2-Liste (Fachabschnitt ab heading-2, nie Fazit/FAQ);
// art torte|saeulen|balken; endliche Zahlen; Torte 3–6 Stücke, bei „%“ Summe 100 ± 0,5; Säulen/Balken ≤ 8; quelle name/url(https)/stand;
// Reihen mit gleichen Labels; Regler mit Formel: rechner in lib/statistik/formeln.ts, eingabe/ausgabe in den Params/Result-Interfaces.
// Danach Import über tools/faden-import.mjs felder (idempotent), es sei denn --ohne-import.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const wurzel = path.resolve(new URL('..', import.meta.url).pathname);
const nr = process.argv[2]; const ohneImport = process.argv.includes('--ohne-import');
if (!nr) { console.error('Aufruf: node tools/statistik-stapel.mjs NN [--ohne-import]'); process.exit(1); }
const datei = `docs/inhalte/statistik-batch-${nr}.json`;
const stapel = JSON.parse(fs.readFileSync(path.join(wurzel, datei), 'utf8'));
const liste = JSON.parse(fs.readFileSync(path.join(wurzel, 'docs/inhalte/beitraege-liste.json'), 'utf8'));
const by = Object.fromEntries(liste.map(b => [b.slug, b]));
const dec = s => String(s).replace(/&#8217;|&#x27;|&rsquo;/g, '’').replace(/&#8211;|&ndash;/g, '–').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#8222;/g, '„').replace(/&#8220;/g, '“');
const norm = s => dec(s).toLowerCase().replace(/[’'"„“”]/g, '').replace(/\s+/g, ' ').trim();
const formelnTs = fs.readFileSync(path.join(wurzel, 'lib/statistik/formeln.ts'), 'utf8');
const rechnerErlaubt = [...formelnTs.matchAll(/^\s{2}"?([a-z-]+)"?: \{ berechne/gm)].map(m => m[1]);
function felderVon(rechner, art) {
  const ts = fs.readFileSync(path.join(wurzel, `lib/calculators/${rechner}.ts`), 'utf8');
  const m = ts.match(new RegExp(`export interface \\w+${art} \\{([\\s\\S]*?)\\n\\}`));
  return m ? [...m[1].matchAll(/^\s+(\w+)\??:/gm)].map(x => x[1]) : [];
}
const fehler = [], hinweise = []; let zahl = 0;
for (const e of stapel) {
  const b = by[e.slug]; if (!b) { fehler.push(`Beitrag ${e.slug} unbekannt`); continue; }
  const h2 = b.h2.map(dec);
  if (!Array.isArray(e.statistiken)) { fehler.push(`${e.slug}: statistiken fehlt`); continue; }
  for (const st of e.statistiken) {
    zahl++;
    const wo = `${e.slug} „${st.titel || '?'}“`;
    let i = h2.findIndex(h => norm(h) === norm(st.abschnitt_titel || '')); if (i < 0 && st.abschnitt_titel) i = h2.findIndex(h => norm(h).startsWith(norm(st.abschnitt_titel).slice(0, 18)));
    if (i < 0) { fehler.push(`${wo}: Abschnitt „${st.abschnitt_titel}“ nicht gefunden`); continue; }
    if (i < 2 || /^fazit\b/i.test(h2[i]) || /häufig gestellte fragen|^faq/i.test(h2[i])) fehler.push(`${wo}: Statistik in Nicht-Fachabschnitt heading-${i}`);
    if (st.abschnitt !== 'heading-' + i) hinweise.push(`${wo}: ${st.abschnitt || '—'} → heading-${i} (${h2[i].slice(0, 40)})`);
    st.abschnitt = 'heading-' + i; st.abschnitt_titel = h2[i];
    if (!['torte', 'saeulen', 'balken'].includes(st.art)) fehler.push(`${wo}: art „${st.art}“ unbekannt`);
    if (!st.titel) fehler.push(`${wo}: titel fehlt`);
    if (typeof st.einheit !== 'string') fehler.push(`${wo}: einheit fehlt (leerer String erlaubt)`);
    const q = st.quelle || {};
    if (!q.name || !q.stand) fehler.push(`${wo}: quelle.name/stand fehlt`);
    if (!/^https:\/\//.test(q.url || '')) fehler.push(`${wo}: quelle.url muss https sein`);
    if (!Array.isArray(st.reihen) || !st.reihen.length) { fehler.push(`${wo}: reihen fehlt`); continue; }
    const labels0 = (st.reihen[0].werte || []).map(w => w.label).join('|');
    st.reihen.forEach((r, ri) => {
      if (!r.key || !r.label || !Array.isArray(r.werte) || !r.werte.length) { fehler.push(`${wo}: Reihe ${ri} unvollständig`); return; }
      r.werte.forEach(w => { if (typeof w.label !== 'string' || !w.label || typeof w.wert !== 'number' || !Number.isFinite(w.wert)) fehler.push(`${wo}: Wert in Reihe ${r.key} ungültig (${JSON.stringify(w)})`); });
      if (st.art === 'torte' && (r.werte.length < 3 || r.werte.length > 6)) fehler.push(`${wo}: Torte braucht 3–6 Stücke (Reihe ${r.key}: ${r.werte.length})`);
      if (st.art !== 'torte' && r.werte.length > 8) fehler.push(`${wo}: höchstens 8 Werte (Reihe ${r.key}: ${r.werte.length})`);
      if (st.art === 'torte' && st.einheit === '%') { const s = r.werte.reduce((n, w) => n + w.wert, 0); if (Math.abs(s - 100) > 0.5) fehler.push(`${wo}: Tortensumme ${s.toFixed(1)} statt 100 (Reihe ${r.key})`); }
      if (ri && r.werte.map(w => w.label).join('|') !== labels0) hinweise.push(`${wo}: Reihe ${r.key} hat andere Labels als ${st.reihen[0].key}`);
    });
    if (st.reihen.length > 1 && !(st.umschalter && st.umschalter.label)) hinweise.push(`${wo}: mehrere Reihen ohne umschalter.label`);
    if (st.regler) {
      const r = st.regler;
      if (!(r.label && Number.isFinite(r.min) && Number.isFinite(r.max) && r.min < r.max && r.schritt > 0 && r.start >= r.min && r.start <= r.max)) fehler.push(`${wo}: regler min/max/schritt/start ungültig`);
      const f = r.formel || {};
      if (f.typ === 'rechner') {
        if (!rechnerErlaubt.includes(f.rechner)) fehler.push(`${wo}: Rechner „${f.rechner}“ nicht in lib/statistik/formeln.ts (${rechnerErlaubt.join(', ')})`);
        else { const p = felderVon(f.rechner, 'Params'), o = felderVon(f.rechner, 'Result'); if (!p.includes(f.eingabe)) fehler.push(`${wo}: eingabe „${f.eingabe}“ nicht in ${f.rechner}Params (${p.join(', ')})`); if (!o.includes(f.ausgabe)) fehler.push(`${wo}: ausgabe „${f.ausgabe}“ nicht in ${f.rechner}Result (${o.join(', ')})`); }
      } else if (f.typ === 'faktor') {
        if (!(st.reihen[0].werte || []).some(w => w.label === f.bezug)) fehler.push(`${wo}: faktor.bezug „${f.bezug}“ ist kein Wert-Label`);
      } else fehler.push(`${wo}: formel.typ muss rechner oder faktor sein`);
    }
    if (!st.status) st.status = 'freigegeben';
    if (!st.erzeugt_am) st.erzeugt_am = new Date().toISOString().slice(0, 10);
  }
}
fs.writeFileSync(path.join(wurzel, datei), JSON.stringify(stapel, null, 2) + '\n');
if (hinweise.length) console.log('Hinweise:\n  ' + hinweise.join('\n  '));
if (fehler.length) { console.error('FEHLER:\n  ' + fehler.join('\n  ')); process.exit(1); }
console.log(`Stapel ${nr}: ${stapel.length} Beiträge, ${zahl} Statistiken – geprüft.`);
const fDatei = `docs/inhalte/statistik-batch-${nr}.felder.json`;
fs.writeFileSync(path.join(wurzel, fDatei), JSON.stringify(stapel.map(e => ({ slug: e.slug, felder: { statistiken: e.statistiken } })), null, 2) + '\n');
if (ohneImport) { console.log('Ohne Import (' + fDatei + ' geschrieben).'); process.exit(0); }
console.log('> node tools/faden-import.mjs felder ' + fDatei);
execSync('node tools/faden-import.mjs felder ' + fDatei, { cwd: wurzel, stdio: 'inherit' });
