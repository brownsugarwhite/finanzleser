#!/usr/bin/env node
// Leitet die strukturellen Faden-Felder für alle Beiträge ohne Kurzfassung aus dem Bestand ab:
// Einwürfe aus den Tool-Blöcken, „Dazu passt“ aus den Kategorien, Wächter-Werte aus config/rates.json, Glossar-Vorbelegung aus Titel und h2.
//   node tools/faden-vorschlag.mjs → docs/inhalte/felder-auto.json  (danach: node tools/faden-import.mjs felder docs/inhalte/felder-auto.json)
// Kurzfassung, Fragen je Abschnitt und neue Glossarbegriffe werden je Stapel von Hand geschrieben (docs/inhalte/felder-batch-*.json).
import fs from 'node:fs'; import path from 'node:path';
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const J = p => JSON.parse(fs.readFileSync(path.join(wurzel, p), 'utf8'));
const liste = J('docs/inhalte/beitraege-liste.json'), rates = J('config/rates.json');
const fertig = new Set([...J('docs/inhalte/felder-pilot.json').map(e => e.slug)]);
for (const f of fs.readdirSync(path.join(wurzel, 'docs/inhalte')).filter(f => /^felder-batch-\d+\.json$/.test(f))) J('docs/inhalte/' + f).forEach(e => fertig.add(e.slug));
const glossar = [...J('docs/inhalte/glossar-prototyp.json'), ...J('docs/inhalte/glossar-pilot.json')];
for (const f of fs.readdirSync(path.join(wurzel, 'docs/inhalte')).filter(f => /^glossar-batch-\d+\.json$/.test(f))) glossar.push(...J('docs/inhalte/' + f));
const dec = s => s.replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&amp;/g, '&');
const istEnde = t => /^fazit\b/i.test(t) || /häufig gestellte fragen|häufige fragen/i.test(t);
const GRUND = { rechner: 'Ihre Zahlen statt der Beispiele', vergleich: 'Tarife und Anbieter nebeneinander', checkliste: 'Schritt für Schritt, zum Abhaken', dokumente: 'Formulare und Merkblätter zum Ausdrucken' };
const PRIO = { rechner: 0, vergleich: 1, checkliste: 2, dokumente: 3 };
// Wächter: Rechner-Slug → Gruppen in rates.json, die ihn nennen → Zahlenwerte der Gruppe
const rechnerGruppen = {}; for (const [g, v] of Object.entries(rates)) if (v && typeof v === 'object' && Array.isArray(v._rechner)) v._rechner.forEach(r => { (rechnerGruppen[r] = rechnerGruppen[r] || []).push(g); });
function waechterFuer(rechnerSlugs) { const out = []; rechnerSlugs.forEach(r => (rechnerGruppen[r] || []).forEach(g => { Object.entries(rates[g]).forEach(([k, v]) => { if (k.startsWith('_')) return; if (typeof v === 'number' || (v && typeof v === 'object')) out.push(g + '.' + k); }); })); return [...new Set(out)].slice(0, 4); }
const out = [];
for (const b of liste) {
  if (fertig.has(b.slug)) continue;
  const h2 = (b.h2 || []).map(dec); const fach = h2.map((t, i) => ({ t, i })).filter(x => x.i >= 2 && !istEnde(x.t)).map(x => x.i);
  const bl = (b.bloecke || []).map(x => Array.isArray(x) ? x : String(x).split(/[: ]/)).filter(x => x[0] && x[1]).map(x => ({ typ: x[0], slug: x[1].split(',')[0] }));
  const seen = new Set(); const einw = bl.filter(x => PRIO[x.typ] !== undefined && !seen.has(x.typ) && seen.add(x.typ)).sort((a, c) => PRIO[a.typ] - PRIO[c.typ]).slice(0, 3).map(x => {
    const idx = x.typ === 'rechner' ? fach[0] : x.typ === 'vergleich' ? (fach[1] ?? fach[0]) : fach[fach.length - 1]; if (idx === undefined) return null;
    return { nach: 'heading-' + idx, nach_titel: h2[idx], typ: x.typ, slug: x.slug, grund: GRUND[x.typ] };
  }).filter(Boolean);
  const kats = new Set((b.kategorien || []).filter(k => k !== 'ratgeber'));
  const dazu = liste.filter(o => o.slug !== b.slug).map(o => ({ slug: o.slug, s: (o.kategorien || []).filter(k => kats.has(k)).length + ((o.kategorien || []).length === (b.kategorien || []).length ? .5 : 0) })).filter(o => o.s >= 1).sort((a, c) => c.s - a.s).slice(0, 3).map(o => ({ typ: 'post', slug: o.slug }));
  const such = (b.titel + ' ' + h2.join(' ')).toLowerCase();
  const begriffe = glossar.filter(g => [g.titel, ...(g.varianten || [])].some(v => v && v.length >= 5 && such.includes(v.toLowerCase()))).sort((a, c) => c.titel.length - a.titel.length).slice(0, 3).map(g => g.slug);
  out.push({ slug: b.slug, felder: { leo_einwuerfe: einw, dazu_passt: dazu, waechter_regeln: waechterFuer(bl.filter(x => x.typ === 'rechner').map(x => x.slug)), glossar_begriffe: begriffe } });
}
fs.writeFileSync(path.join(wurzel, 'docs/inhalte/felder-auto.json'), JSON.stringify(out, null, 1) + '\n');
const z = k => out.reduce((s, e) => s + (e.felder[k] || []).length, 0);
console.log(`${out.length} Beiträge: Einwürfe ${z('leo_einwuerfe')}, Dazu passt ${z('dazu_passt')}, Wächter ${z('waechter_regeln')}, Glossar-Vorbelegung ${z('glossar_begriffe')} (ohne: ${out.filter(e => !e.felder.glossar_begriffe.length).length})`);
