#!/usr/bin/env node
// Holt die echten Faden-Inhalte aus cms-dev und legt sie dem Prototyp bei.
//   node tools/faden-export.mjs            → docs/prototype/daten/faden-daten.json + docs/prototype/src/02b-daten.html
//   node tools/faden-export.mjs --nur-json → nur die JSON-Datei
// Exportiert: alle Beiträge mit Kurzfassung (Kette aus h2-Abschnitten, FAQ, Fazit, Tool-Blöcke, Spielboxen, Faden-Felder),
// das Glossar, die Spiele und die Options. Zugang: .env.cms-dev.local (Anwendungspasswort nur des Klons; Rohinhalt braucht es).
import fs from 'node:fs'; import path from 'node:path';
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(wurzel, '.env.cms-dev.local'), 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const BASIS = (env.CMS_DEV_URL || 'https://cms-dev.finanzleser.de').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.CMS_DEV_APP_USER + ':' + env.CMS_DEV_APP_PASS).toString('base64');
const BILDER_VON = BASIS + '/wp-content/', BILDER_NACH = 'https://cms.finanzleser.de/wp-content/'; // Klon steht hinter Basic-Auth, Bilder liegen identisch auf Produktion
const nurJson = process.argv.includes('--nur-json');

async function gql(q, v) { const r = await fetch(BASIS + '/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: v }) }); const j = await r.json(); if (j.errors) throw new Error('GraphQL: ' + JSON.stringify(j.errors).slice(0, 300)); return j.data; }
async function alle(feld, felder) { let out = [], after = null; for (let i = 0; i < 20; i++) { const d = await gql(`query($a:String){ ${feld}(first:100, after:$a){ pageInfo{ hasNextPage endCursor } nodes{ ${felder} } } }`, { a: after }); out.push(...d[feld].nodes); if (!d[feld].pageInfo.hasNextPage) break; after = d[feld].pageInfo.endCursor; } return out; }
async function roh(slug) { const r = await fetch(`${BASIS}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&context=edit&_fields=content`, { headers: { Authorization: AUTH } }); const j = await r.json(); if (!Array.isArray(j) || !j[0]) throw new Error('Rohinhalt fehlt für ' + slug + ': ' + JSON.stringify(j).slice(0, 120)); return j[0].content.raw; }
async function schlange(items, fn, parallel = 3) { let i = 0; const out = []; await Promise.all(Array.from({ length: parallel }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
const J = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const text = h => (h || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&#8220;|&#8222;/g, '„').replace(/&#8221;/g, '“').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const bilder = h => (h || '').split(BILDER_VON).join(BILDER_NACH);

// ---------- Beitrag → Kette ----------
function zerlegeInhalt(raw) {
  let h = raw;
  // FAQ (Yoast-Block) herauslösen
  const faq = []; h = h.replace(/<!-- wp:yoast\/faq-block (\{[\s\S]*?\}) -->[\s\S]*?<!-- \/wp:yoast\/faq-block -->/g, (m, json) => { const d = J(json); (d && d.questions || []).forEach(q => faq.push([text(q.jsonQuestion), text(q.jsonAnswer)])); return ''; });
  // fremde Blöcke (latest-posts u. ä.) entfernen
  h = h.replace(/<!-- wp:(?!finanzleser\/)[a-z-]+\/?[a-z-]* [^\n]*?\/-->/g, '').replace(/<!-- wp:(?!finanzleser\/)[a-z-]+\/?[a-z-]*[^\n]*?-->[\s\S]*?<!-- \/wp:[a-z-]+\/?[a-z-]* -->/g, '');
  // Tool-Blöcke → Marker
  const embeds = []; h = h.replace(/<!-- wp:finanzleser\/([a-z-]+)(?: (\{[^\n]*?\}))? (\/)?-->([\s\S]*?<!-- \/wp:finanzleser\/\1 -->)?/g, (m, typ, json) => { const a = J(json) || {}; embeds.push({ art: 'embed', typ, slug: a.slug || (a.slugs && a.slugs[0]) || '', slugs: a.slugs }); return `\n<!--MARK:embed:${embeds.length - 1}-->\n`; });
  // Spielboxen → Marker
  const spiele = []; h = h.replace(/<div class="fl-gam[^"]*" data-finanzleser-gamification="([a-z]+)"[^>]*>([\s\S]*?)<\/div>/g, (m, typ, innen) => { const felder = {}; innen.replace(/<p data-gam-field="([a-z_]+)"[^>]*>([\s\S]*?)<\/p>/g, (x, k, v) => { felder[k] = text(v); return ''; }); spiele.push({ art: 'spiel', typ, felder }); return `\n<!--MARK:spiel:${spiele.length - 1}-->\n`; });
  // übrig gebliebene Block-Kommentare und Tool-Divs entfernen
  h = h.replace(/<!-- \/?wp:[^\n]*?-->/g, '').replace(/<div data-finanzleser-[a-z]+="[^"]*"><\/div>/g, '');
  // nach h2 zerlegen
  const teile = h.split(/<h2[^>]*>([\s\S]*?)<\/h2>/); // [vor, titel1, html1, titel2, html2, …]
  const abschnitte = []; for (let i = 1; i < teile.length; i += 2) abschnitte.push({ nr: (i - 1) / 2, titel: text(teile[i]), html: teile[i + 1] || '' });
  // Abschnitts-HTML in geordnete Teile (html | embed | spiel)
  const teileVon = html => { const out = []; html.split(/<!--MARK:(embed|spiel):(\d+)-->/).forEach((s, i, arr) => { if (i % 3 === 0) { const t = s.replace(/ class="wp-block-heading"/g, '').trim(); if (t) out.push({ art: 'html', html: bilder(t) }); } else if (i % 3 === 1) { const idx = +arr[i + 1]; out.push(s === 'embed' ? embeds[idx] : spiele[idx]); } }); return out; };
  return { abschnitte: abschnitte.map(a => ({ ...a, teile: teileVon(a.html), html: undefined })), faq, vorspann: text((teile[0] || '')) };
}
function absaetze(teile) { return teile.filter(t => t.art === 'html').map(t => t.html).join('\n'); }
function lesezeit(html) { return Math.max(1, Math.round(text(html).split(' ').length / 200)) + ' Min.'; }
function datumDe(iso) { const d = new Date(iso); return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }); }
const RUBRIK_IKON = { finanzen: 'finanzen', versicherungen: 'versicherungen', steuern: 'steuern', recht: 'recht' };

function baueArtikel(p, raw, titelVon) {
  const z = zerlegeInhalt(raw);
  const kf = J(p.kurzfassung) || {}, fragen = J(p.leoFragen) || [], einw = J(p.leoEinwuerfe) || [], dazu = J(p.dazuPasst) || [];
  // Kategorie-Kette: tiefste Kategorie unter „ratgeber“
  let kette = null; for (const c of p.categories.nodes) { const k = [c]; let e = c.parent && c.parent.node; while (e) { k.unshift(e); e = e.parent && e.parent.node; } if (!kette || k.length > kette.length) kette = k; }
  kette = (kette || []).filter(c => c.slug !== 'ratgeber'); const rubrik = kette[0] ? kette[0].slug : 'finanzen', thema = kette[1] ? kette[1].slug : null;
  const krumen = [['Ratgeber', 'ratgeber']]; if (kette[0]) krumen.push([text(kette[0].name), 'ratgeber', kette[0].slug]); if (kette[1]) krumen.push([text(kette[1].name), 'ratgeber', kette[0].slug, kette[1].slug]);
  const url = '/' + [rubrik, thema, p.slug].filter(Boolean).join('/') + '/';
  const istEnde = t => /^fazit\b/i.test(t) || /häufig gestellte fragen|häufige fragen/i.test(t);
  const fach = z.abschnitte.filter(a => a.nr >= 2 && !istEnde(a.titel));
  const fazitA = z.abschnitte.find(a => /^fazit\b/i.test(a.titel));
  const einl = z.abschnitte[1];
  const kicker = z.abschnitte[0];
  // Tool-Blöcke stehen im CMS gesammelt am Ende (hinter den FAQ). Leos Einwürfe ziehen sie in den passenden Abschnitt;
  // was kein Einwurf platziert, hängt am letzten Fachabschnitt.
  const werkzeuge = []; z.abschnitte.forEach(a => { a.teile = a.teile.filter(t => { if (t.art === 'embed') { werkzeuge.push(t); return false; } return true; }); });
  const abschnitte = fach.map(a => ({ id: 'heading-' + a.nr, titel: a.titel, teile: a.teile.slice(), text: [text(absaetze(a.teile))], fragen: fragen.filter(f => f.abschnitt === 'heading-' + a.nr).map(f => ({ f: f.frage, a: [f.antwort], q: f.quellen || [] })) }));
  const platziert = new Set();
  einw.forEach(e => { const ab = abschnitte.find(x => x.id === e.nach) || abschnitte[abschnitte.length - 1]; if (!ab) return; const w = werkzeuge.find(x => x.typ === e.typ && (x.slug === e.slug || (x.slugs || []).includes(e.slug))); ab.teile.push({ art: 'embed', typ: e.typ, slug: e.slug, slugs: w && w.slugs, grund: e.grund, vonLeo: true }); if (w) platziert.add(w); });
  const rest = werkzeuge.filter(w => !platziert.has(w)); if (rest.length && abschnitte.length) abschnitte[abschnitte.length - 1].teile.push(...rest.map(w => ({ ...w, nachtrag: true })));
  return {
    slug: p.slug, url, titel: text(p.title), untertitel: text(p.untertitel || ''), kurz: kicker ? text(absaetze(kicker.teile)) : text(p.excerpt), kicker: kicker ? kicker.titel : '',
    meta: 'Ratgeber · ' + krumen.slice(1).map(k => k[0]).join(' › '), lesezeit: lesezeit(raw), rubrik: RUBRIK_IKON[rubrik] || 'finanzen', krumen,
    stand: 'aktualisiert ' + datumDe(p.modified || p.date), autor: p.author && p.author.node ? p.author.node.name : 'Redaktion',
    bild: p.featuredImage && p.featuredImage.node ? bilder(p.featuredImage.node.sourceUrl) : null, bildAlt: p.featuredImage && p.featuredImage.node ? p.featuredImage.node.altText : '', bildtext: 'Bild: Redaktion',
    einleitung: einl ? { titel: einl.titel, html: bilder(absaetze(einl.teile)) } : null,
    glossar: J(p.glossarBegriffe) || [], abschnitte, faq: z.faq, fazit: fazitA ? text(absaetze(fazitA.teile)) : '',
    dazu: dazu.map(d => [titelVon[d.slug] || d.slug, d.slug, d.typ]),
    kurzSaetze: kf.saetze || [], leoKurz: kf.saetze ? ['<p>Die Kurzfassung von Leo:</p><ul>' + kf.saetze.map(s => '<li>' + s + '</li>').join('') + '</ul>'] : null, quellen: kf.quellen || [],
    einwuerfe: einw, waechter: J(p.waechterRegeln) || [], woerter: text(raw).split(' ').length
  };
}

// ---------- Lauf ----------
const t0 = Date.now();
const postsKurz = await alle('posts', 'slug title kurzfassung');
const titelVon = Object.fromEntries(postsKurz.map(p => [p.slug, text(p.title)]));
const mitFeldern = postsKurz.filter(p => p.kurzfassung).map(p => p.slug);
console.log(`Beiträge gesamt ${postsKurz.length}, mit Kurzfassung ${mitFeldern.length}`);
const artikel = await schlange(mitFeldern, async slug => {
  const d = await gql(`query($s:ID!){ post(id:$s, idType:SLUG){ slug title date modified untertitel excerpt author{ node{ name } } featuredImage{ node{ sourceUrl altText } } categories{ nodes{ name slug parent{ node{ name slug parent{ node{ name slug } } } } } } kurzfassung leoFragen glossarBegriffe leoEinwuerfe dazuPasst waechterRegeln } }`, { s: slug });
  const raw = await roh(slug); return baueArtikel(d.post, raw, titelVon);
});
const tools = {}; for (const [feld, typ] of [['allRechner', 'rechner'], ['checklisten', 'checkliste'], ['vergleiche', 'vergleich']]) (await alle(feld, 'slug title')).forEach(n => { tools[typ + '/' + n.slug] = text(n.title); });
try { (await alle('dokumente', 'slug title')).forEach(n => { tools['dokumente/' + n.slug] = text(n.title); }); } catch { /* Dokumente-Typ ohne GraphQL-Liste: Titel bleiben Slugs */ }
const glossar = (await alle('glossarEintraege', 'slug title content varianten quelle ratgeber tool frage antwort wappen glossarRubriken{ nodes{ name } }')).map(g => ({ slug: g.slug, name: text(g.title), varianten: (J(g.varianten) || []).filter(v => v !== text(g.title)), erkl: text(g.content), quelle: g.quelle || '', ratgeber: g.ratgeber || '', tool: g.tool || '', frage: g.frage || '', antwort: g.antwort || '', wappen: g.wappen || '', rubrik: g.glossarRubriken.nodes[0] ? g.glossarRubriken.nodes[0].name : '' }));
const spiele = (await alle('spiele', 'slug title spielTyp spielFelder punkte datum wappen')).map(s => ({ slug: s.slug, titel: text(s.title), typ: s.spielTyp, felder: J(s.spielFelder) || {}, punkte: +s.punkte || 0, datum: s.datum || '', wappen: s.wappen || '' }));
const options = J((await gql('{ fadenOptions }')).fadenOptions) || {};

const daten = { stand: new Date().toISOString(), quelle: BASIS, artikel, glossar, spiele, options, tools, titel: titelVon };
const zielDir = path.join(wurzel, 'docs/prototype/daten'); fs.mkdirSync(zielDir, { recursive: true });
fs.writeFileSync(path.join(zielDir, 'faden-daten.json'), JSON.stringify(daten, null, 1) + '\n');
if (!nurJson) { const json = JSON.stringify(daten).replace(/</g, '\\u003c'); fs.writeFileSync(path.join(wurzel, 'docs/prototype/src/02b-daten.html'), `<script>/* erzeugt von tools/faden-export.mjs, ${daten.stand}, Quelle ${BASIS} */\nwindow.FADEN_DATEN = ${json};</script>\n`); }
console.log(`Artikel ${artikel.length} (${artikel.reduce((s, a) => s + a.abschnitte.length, 0)} Abschnitte, ${artikel.reduce((s, a) => s + a.abschnitte.reduce((x, b) => x + b.fragen.length, 0), 0)} Fragen, ${artikel.reduce((s, a) => s + a.faq.length, 0)} FAQ) · Glossar ${glossar.length} · Spiele ${spiele.length} · Options ${Object.keys(options).length} · Tools ${Object.keys(tools).length} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
artikel.forEach(a => console.log(`  ${a.slug}: ${a.abschnitte.length} Abschnitte, ${a.abschnitte.reduce((x, b) => x + b.teile.filter(t => t.art === 'embed').length, 0)} Tools, ${a.abschnitte.reduce((x, b) => x + b.teile.filter(t => t.art === 'spiel').length, 0)} Spiele, FAQ ${a.faq.length}, Fazit ${a.fazit ? 'ja' : 'NEIN'}, Bild ${a.bild ? 'ja' : 'nein'}, ${a.krumen.map(k => k[0]).join(' › ')}`));
