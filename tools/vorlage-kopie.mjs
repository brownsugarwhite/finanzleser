#!/usr/bin/env node
/**
 * Legt auf cms-dev die Vorlage-Ratgeber an und setzt die Statistik-Blöcke hinein.
 *
 *   node tools/vorlage-kopie.mjs                    → alle docs/inhalte/statistik-v2-*.json
 *   node tools/vorlage-kopie.mjs pflegeversicherung → nur diese
 *   node tools/vorlage-kopie.mjs --trocken          → nur zeigen, nichts schreiben
 *
 * Geschwister von tools/vorlage-test.mjs: dieselbe Mechanik (echte Kopie statt erfundenem
 * Beitrag), aber für mehrere Beiträge und mit den Gutenberg-Blöcken aus der Recherche.
 *
 * 🚨 Ziel ist IMMER cms-dev. Das Produktions-CMS wird von hier aus nie beschrieben.
 * Ein zweiter Lauf aktualisiert die Vorlagen, er legt keine zweiten an.
 *
 * Wo die Blöcke landen: `nach: "heading-N"` heißt ans ENDE des Abschnitts N, also direkt
 * vor der nächsten Zwischenüberschrift. Die Zählung ist dieselbe wie überall sonst —
 * fortlaufend über alle h2 in Dokumentreihenfolge (lib/articleHtml.addHeadingIds).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pruefeStatistik, packeStatistik } from '../lib/statistik/schema.ts';

const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(wurzel, '.env.cms-dev.local'), 'utf8')
    .split('\n').filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const BASIS = (env.CMS_DEV_URL || 'https://cms-dev.finanzleser.de').replace(/\/$/, '');
if (!/cms-dev/.test(BASIS)) { console.error('✗ Ziel ist nicht cms-dev:', BASIS); process.exit(1); }
const AUTH = 'Basic ' + Buffer.from(env.CMS_DEV_APP_USER + ':' + env.CMS_DEV_APP_PASS).toString('base64');

const args = process.argv.slice(2);
const TROCKEN = args.includes('--trocken');
const filter = args.find((a) => !a.startsWith('--'));

const FELDER = {
  kurzfassung: 'kurzfassung', leoFragen: 'leo_fragen', glossarBegriffe: 'glossar_begriffe',
  leoEinwuerfe: 'leo_einwuerfe', dazuPasst: 'dazu_passt', waechterRegeln: 'waechter_regeln',
  statistiken: 'statistiken',
};

async function gql(query, variables) {
  const r = await fetch(BASIS + '/graphql', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

async function rest(pfad, body, methode = 'POST') {
  const r = await fetch(BASIS + pfad, {
    method: methode, headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = { roh: t.slice(0, 300) }; }
  if (!r.ok) throw new Error(`${methode} ${pfad} → ${r.status}: ${j.message || j.roh}`);
  return j;
}

/** Ein Gutenberg-Block, wie ihn der Editor selbst schreiben würde. */
function blockKommentar(st) {
  return `\n<!-- wp:finanzleser/statistik {"art":"${st.art}","daten":"${packeStatistik(st)}"} /-->\n`;
}

/**
 * Ein <table> oder <ul> im Beitrag finden, das einen bestimmten Text enthält.
 * Gibt Anfang und Ende zurück — oder null, wenn es das Element nicht (mehr) gibt.
 */
function elementFinden(html, typ, enthaelt) {
  const muster = typ === 'tabelle' ? /<table[\s\S]*?<\/table>/gi : /<ul[\s\S]*?<\/ul>/gi;
  for (const m of html.matchAll(muster)) {
    if (m[0].includes(enthaelt)) return { von: m.index, bis: m.index + m[0].length, text: m[0] };
  }
  return null;
}

/**
 * Blöcke setzen und dabei aufräumen.
 *
 * Drei Vorgänge, alle auf denselben Positionen der URSPRÜNGLICHEN Zeichenkette gerechnet
 * und danach von hinten nach vorn angewandt — sonst verschöben die früheren Änderungen
 * die späteren Positionen:
 *
 *   `nach: "heading-N"`   Block ans Ende des Abschnitts, vor die nächste Zwischenüberschrift
 *   `statt: {typ,enthaelt}` Block ersetzt eine vorhandene Tabelle oder Liste an Ort und Stelle
 *   `entfernen: [...]`    Tabelle oder Liste ersatzlos herausnehmen (doppelter Inhalt)
 *
 * Wird ein zu ersetzendes Element nicht gefunden, bricht der Lauf ab: der Beitrag hat sich
 * geändert, und ein stilles Anhängen an anderer Stelle wäre schlimmer als ein Fehler.
 */
function bloeckeEinsetzen(html, bloecke, entfernen = []) {
  const h2 = [...html.matchAll(/<h2\b/gi)].map((m) => m.index);
  const abschnittsEnde = (nach) => {
    if (nach === 'ende') return html.length;
    const n = Number(/\d+/.exec(nach)[0]);
    return n + 1 < h2.length ? h2[n + 1] : html.length;
  };

  const vorgaenge = [];
  const fehlend = [];

  bloecke.forEach((b, i) => {
    if (b.statt) {
      const treffer = elementFinden(html, b.statt.typ, b.statt.enthaelt);
      if (!treffer) { fehlend.push(`${b.statt.typ} mit „${b.statt.enthaelt}" (für „${b.statistik.titel}")`); return; }
      vorgaenge.push({ i, von: treffer.von, bis: treffer.bis, text: blockKommentar(b.statistik) });
    } else {
      const pos = abschnittsEnde(b.nach);
      vorgaenge.push({ i, von: pos, bis: pos, text: blockKommentar(b.statistik) });
    }
  });

  entfernen.forEach((e, i) => {
    const treffer = elementFinden(html, e.typ, e.enthaelt);
    if (!treffer) { fehlend.push(`${e.typ} mit „${e.enthaelt}" (zu entfernen)`); return; }
    vorgaenge.push({ i: 1000 + i, von: treffer.von, bis: treffer.bis, text: '' });
  });

  if (fehlend.length) { const e = new Error('nicht gefunden'); e.fehlend = fehlend; throw e; }

  vorgaenge.sort((a, b) => b.von - a.von || b.i - a.i);
  let out = html;
  for (const v of vorgaenge) out = out.slice(0, v.von) + v.text + out.slice(v.bis);
  return out;
}

const dateien = fs.readdirSync('docs/inhalte')
  .filter((f) => /^statistik-v2-.*\.json$/.test(f))
  .filter((f) => !filter || f.includes(filter));
if (!dateien.length) { console.error('Keine Datei gefunden.'); process.exit(1); }

const FELD_ABFRAGE = Object.keys(FELDER).join(' ');
let fehler = 0;

for (const datei of dateien) {
  const d = JSON.parse(fs.readFileSync(path.join('docs/inhalte', datei), 'utf8'));
  console.log(`\n━━ ${d.slug}  →  ${d.kopie}`);

  const schlecht = d.bloecke.flatMap((b) => pruefeStatistik(b.statistik).map((f) => `${b.statistik.titel}: ${f}`));
  if (schlecht.length) { schlecht.forEach((f) => console.error('  ✗ ' + f)); fehler += schlecht.length; continue; }

  const { post } = await gql(`query($s:ID!){ post(id:$s, idType:SLUG){
    databaseId title slug content excerpt untertitel
    categories{nodes{databaseId name}} featuredImage{node{databaseId}} ${FELD_ABFRAGE}
  } }`, { s: d.slug });
  if (!post) { console.error('  ✗ Quellbeitrag nicht gefunden'); fehler++; continue; }

  let inhalt;
  try {
    inhalt = bloeckeEinsetzen(post.content, d.bloecke, d.entfernen || []);
  } catch (e) {
    (e.fehlend || [e.message]).forEach((f) => console.error('  ✗ ' + f));
    fehler += (e.fehlend || [1]).length;
    continue;
  }
  const h2Zahl = (post.content.match(/<h2\b/gi) || []).length;
  console.log(`  Quelle #${post.databaseId}, ${h2Zahl} Zwischentitel, ${post.content.length} → ${inhalt.length} Zeichen`);
  for (const b of d.bloecke) console.log(`    ${(b.statt ? 'ersetzt' : b.nach).padEnd(10)} ${b.statistik.art.padEnd(18)} ${b.statistik.titel}`);
  for (const e of (d.entfernen || [])) console.log(`    entfernt   ${e.typ.padEnd(18)} „${e.enthaelt}"`);
  if (TROCKEN) continue;

  const vorhanden = await gql(`query($s:ID!){ post(id:$s, idType:SLUG){ databaseId } }`, { s: d.kopie })
    .then((x) => x.post?.databaseId).catch(() => null);

  const rumpf = {
    title: `Vorlage · ${post.title}`,
    slug: d.kopie,
    status: 'publish',
    content: inhalt,
    excerpt: post.excerpt || '',
    categories: post.categories.nodes.map((c) => c.databaseId),
    meta: { beitrag_untertitel: post.untertitel || '' },
  };
  if (post.featuredImage?.node?.databaseId) rumpf.featured_media = post.featuredImage.node.databaseId;

  const ziel = vorhanden
    ? await rest(`/wp-json/wp/v2/posts/${vorhanden}`, rumpf)
    : await rest('/wp-json/wp/v2/posts', rumpf);
  console.log(`  ${vorhanden ? 'Aktualisiert' : 'Angelegt'}: #${ziel.id} /${ziel.slug}`);

  // Faden-Felder mitkopieren, damit die Kopie ein vollständiger Ratgeber ist.
  const felder = {};
  for (const [gqlName, metaName] of Object.entries(FELDER)) {
    const roh = post[gqlName];
    if (roh === null || roh === undefined || roh === '') continue;
    // Die Vorlagen zeigen den Blockweg. Wo eine Bestandsstatistik dasselbe sagt wie ein
    // Block, würde sie doppelt stehen — dann bleibt sie hier weg.
    // Nicht nur überspringen, sondern aktiv leeren: ein zweiter Lauf muss die
    // Bestandsstatistiken eines früheren Laufs auch wieder loswerden.
    if (metaName === 'statistiken' && d.ohneBestandsstatistiken) { felder.statistiken = []; console.log('  ⤫ Bestandsstatistiken geleert'); continue; }
    try { felder[metaName] = typeof roh === 'string' ? JSON.parse(roh) : roh; }
    catch { console.warn('  ⚠ unlesbar, übersprungen:', gqlName); }
  }
  // Leo-Fragen: die des Quellbeitrags bleiben, die recherchierten kommen dazu. Doppelte
  // Fragen (gleicher Wortlaut) fallen weg — eine Frage zweimal im selben Abschnitt wäre
  // genau die Deko, die niemand braucht.
  if ((d.leoFragen || []).length) {
    const vorhanden = felder.leo_fragen || [];
    const kennen = new Set(vorhanden.map((f) => (f.frage || '').trim().toLowerCase()));
    const neue = d.leoFragen.filter((f) => !kennen.has((f.frage || '').trim().toLowerCase()));
    felder.leo_fragen = vorhanden.concat(neue);
    const je = {};
    for (const f of felder.leo_fragen) je[f.abschnitt] = (je[f.abschnitt] || 0) + 1;
    console.log(`  Leo-Fragen: ${felder.leo_fragen.length} (${vorhanden.length} übernommen, ${neue.length} neu) · ${JSON.stringify(je)}`);
  }

  if (Object.keys(felder).length) {
    const r = await rest('/wp-json/finanzleser/v1/faden-felder', { post_id: ziel.id, felder });
    console.log(`  Faden-Felder: ${(r.geschrieben || []).join(', ') || '—'}${r.abgelehnt?.length ? ' · abgelehnt: ' + r.abgelehnt.join(', ') : ''}`);
  }
  console.log(`  ${BASIS}/wp-admin/post.php?post=${ziel.id}&action=edit`);
}

console.log(fehler ? `\n✗ ${fehler} Beanstandungen.` : '\n✓ fertig');
process.exit(fehler ? 1 : 0);
