#!/usr/bin/env node
// Importiert Faden-Inhalte in ein WordPress mit dem Plugin finanzleser-faden (zuerst nur cms-dev).
//   node tools/faden-import.mjs glossar docs/inhalte/glossar-prototyp.json      → upsert-glossar je Eintrag (Entwurf)
//   node tools/faden-import.mjs felder  docs/inhalte/felder-pilot.json          → faden-felder je Beitrag ({ slug, felder })
//   node tools/faden-import.mjs spiele  docs/inhalte/spiele.json                → upsert-spiel je Eintrag
//   node tools/faden-import.mjs options docs/inhalte/faden-options.json         → faden-options
// Zugang: .env.cms-dev.local (CMS_DEV_APP_USER/PASS, Anwendungspasswort NUR des Klons). Ziel: CMS_DEV_URL oder cms-dev.
import fs from 'node:fs'; import path from 'node:path';
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(wurzel, '.env.cms-dev.local'), 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const BASIS = (env.CMS_DEV_URL || 'https://cms-dev.finanzleser.de').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.CMS_DEV_APP_USER + ':' + env.CMS_DEV_APP_PASS).toString('base64');
const [modus, datei] = process.argv.slice(2); if (!modus || !datei) { console.error('Aufruf: faden-import.mjs <glossar|felder|spiele|options> <datei.json>'); process.exit(1); }
const daten = JSON.parse(fs.readFileSync(datei, 'utf8'));
async function post(pfad, body) { const r = await fetch(BASIS + '/wp-json/finanzleser/v1/' + pfad, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: AUTH }, body: JSON.stringify(body) }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { roh: t.slice(0, 200) }; } return { status: r.status, ...j }; }
async function gql(q, v) { const r = await fetch(BASIS + '/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: v }) }); return (await r.json()).data; }
const lauf = { ok: 0, fehler: 0, neu: 0 }; const start = Date.now();
async function schlange(items, fn, parallel = 3) { let i = 0; await Promise.all(Array.from({ length: parallel }, async () => { while (i < items.length) { const it = items[i++]; await fn(it); } })); }
if (modus === 'glossar') {
  await schlange(daten, async (g) => { const r = await post('upsert-glossar', g); if (r.ok) { lauf.ok++; if (r.neu) lauf.neu++; } else { lauf.fehler++; console.error('✗', g.slug, r.status, r.message || r.roh); } });
} else if (modus === 'felder') {
  // { slug, typ?: 'post', felder: {...} } → post_id über GraphQL auflösen
  await schlange(daten, async (e) => {
    const typ = e.typ || 'post'; const q = typ === 'post' ? `query($s:ID!){ post(id:$s, idType:SLUG){ databaseId } }` : `query($s:ID!){ ${typ}(id:$s, idType:SLUG){ databaseId } }`;
    const d = await gql(q, { s: e.slug }); const id = d && d[typ] && d[typ].databaseId; if (!id) { lauf.fehler++; console.error('✗ kein Beitrag', e.slug); return; }
    const r = await post('faden-felder', { post_id: id, felder: e.felder }); if (r.ok) { lauf.ok++; if (r.abgelehnt && r.abgelehnt.length) console.warn('  abgelehnt', e.slug, r.abgelehnt.join(',')); } else { lauf.fehler++; console.error('✗', e.slug, r.status, r.message || r.roh); }
  });
} else if (modus === 'spiele') {
  await schlange(daten, async (s) => { const r = await post('upsert-spiel', s); if (r.ok) { lauf.ok++; if (r.neu) lauf.neu++; } else { lauf.fehler++; console.error('✗', s.slug, r.status, r.message || r.roh); } });
} else if (modus === 'options') {
  const r = await post('faden-options', daten); if (r.ok) { lauf.ok = (r.geschrieben || []).length; } else { lauf.fehler++; console.error('✗', r.status, r.message || r.roh); }
} else { console.error('Unbekannter Modus', modus); process.exit(1); }
console.log(`${modus}: ${lauf.ok} ok (${lauf.neu} neu), ${lauf.fehler} Fehler, ${((Date.now() - start) / 1000).toFixed(1)} s`);
