#!/usr/bin/env node
/**
 * Legt auf cms-dev eine echte Kopie eines Beitrags als Vorlage zum Testen an.
 *
 *   node tools/vorlage-test.mjs                          → kopiert photovoltaik-foerderung
 *   node tools/vorlage-test.mjs <quell-slug> [ziel-slug]
 *
 * Warum eine echte Kopie und kein erfundener Beitrag: an einer Kopie lässt sich im CMS
 * alles umstellen und durchprobieren — Abschnitte, Statistiken, Leo-Fragen, Werkzeuge —,
 * ohne einen redaktionellen Beitrag anzufassen. Daraus wird später die Vorlage fürs
 * Content Studio.
 *
 * 🚨 Ziel ist IMMER cms-dev (CMS_DEV_URL aus .env.cms-dev.local, sonst
 * cms-dev.finanzleser.de). Das Produktions-CMS wird von hier aus nie beschrieben.
 * Ein zweiter Lauf aktualisiert die vorhandene Vorlage, er legt keine zweite an.
 */
import fs from 'node:fs';
import path from 'node:path';

const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(wurzel, '.env.cms-dev.local'), 'utf8')
    .split('\n').filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const BASIS = (env.CMS_DEV_URL || 'https://cms-dev.finanzleser.de').replace(/\/$/, '');
if (!/cms-dev/.test(BASIS)) { console.error('✗ Ziel ist nicht cms-dev:', BASIS); process.exit(1); }
const AUTH = 'Basic ' + Buffer.from(env.CMS_DEV_APP_USER + ':' + env.CMS_DEV_APP_PASS).toString('base64');

const QUELLE = process.argv[2] || 'photovoltaik-foerderung';
const ZIEL = process.argv[3] || 'vorlage-test';

/** GraphQL-Namen der Faden-Felder → Meta-Schlüssel des Schreib-Endpunkts. */
const FELDER = {
  kurzfassung: 'kurzfassung',
  leoFragen: 'leo_fragen',
  glossarBegriffe: 'glossar_begriffe',
  leoEinwuerfe: 'leo_einwuerfe',
  dazuPasst: 'dazu_passt',
  waechterRegeln: 'waechter_regeln',
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

const FELD_ABFRAGE = Object.keys(FELDER).join(' ');
const q = `query($s:ID!){ post(id:$s, idType:SLUG){
  databaseId title slug content excerpt untertitel
  categories{nodes{databaseId name}}
  featuredImage{node{databaseId}}
  ${FELD_ABFRAGE}
} }`;

const { post } = await gql(q, { s: QUELLE });
if (!post) { console.error('✗ Quellbeitrag nicht gefunden:', QUELLE); process.exit(1); }
console.log(`Quelle: „${post.title}" (#${post.databaseId}), ${post.content.length} Zeichen`);

// Schon vorhanden? Dann aktualisieren statt eine zweite Vorlage anzulegen.
const vorhanden = await gql(`query($s:ID!){ post(id:$s, idType:SLUG){ databaseId } }`, { s: ZIEL })
  .then((d) => d.post?.databaseId).catch(() => null);

const rumpf = {
  title: `Vorlage-Test · ${post.title}`,
  slug: ZIEL,
  status: 'publish',
  content: post.content,
  excerpt: post.excerpt || '',
  categories: post.categories.nodes.map((c) => c.databaseId),
  meta: { beitrag_untertitel: post.untertitel || '' },
};
if (post.featuredImage?.node?.databaseId) rumpf.featured_media = post.featuredImage.node.databaseId;

const ziel = vorhanden
  ? await rest(`/wp-json/wp/v2/posts/${vorhanden}`, rumpf)
  : await rest('/wp-json/wp/v2/posts', rumpf);
console.log(`${vorhanden ? 'Aktualisiert' : 'Angelegt'}: #${ziel.id} /${ziel.slug}`);

// Faden-Felder übertragen. GraphQL liefert sie als JSON-STRING (Post-Meta type string),
// der Endpunkt kodiert selbst — also erst zurückparsen, sonst steht der String im String.
const felder = {};
for (const [gqlName, metaName] of Object.entries(FELDER)) {
  const roh = post[gqlName];
  if (roh === null || roh === undefined || roh === '') continue;
  try { felder[metaName] = typeof roh === 'string' ? JSON.parse(roh) : roh; }
  catch { console.warn('  ⚠ unlesbar, übersprungen:', gqlName); }
}
if (Object.keys(felder).length) {
  const r = await rest('/wp-json/finanzleser/v1/faden-felder', { post_id: ziel.id, felder });
  console.log(`Faden-Felder: ${(r.geschrieben || []).join(', ') || '—'}${r.abgelehnt?.length ? ' · abgelehnt: ' + r.abgelehnt.join(', ') : ''}`);
}
console.log(`\nFertig. Im CMS: ${BASIS}/wp-admin/post.php?post=${ziel.id}&action=edit`);
