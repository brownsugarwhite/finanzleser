#!/usr/bin/env node
// Holt Beiträge als lesbaren Text (Rohinhalt aus cms-dev) zum Schreiben der Faden-Felder.
//   node tools/faden-text.mjs <slug> [<slug> …]   → docs/inhalte/text/<slug>.txt je Beitrag + docs/inhalte/text/_stapel.txt (alle zusammen)
// Format: Titel · URL, dann „## <n> <h2>“ (n = heading-Index wie im Frontend), Absätze als Text, Listen mit „- “, Tabellenzeilen mit „|“,
// [SPIEL typ: frage] und [BLOCK typ slug] an ihrer Stelle, FAQ als „F:“/„A:“.
import fs from 'node:fs'; import path from 'node:path';
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(wurzel, '.env.cms-dev.local'), 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const BASIS = (env.CMS_DEV_URL || 'https://cms-dev.finanzleser.de').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(env.CMS_DEV_APP_USER + ':' + env.CMS_DEV_APP_PASS).toString('base64');
const slugs = process.argv.slice(2); if (!slugs.length) { console.error('Aufruf: faden-text.mjs <slug> …'); process.exit(1); }
const text = h => (h || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’').replace(/&#8220;|&#8222;/g, '„').replace(/&#8221;/g, '“').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
function lesbar(raw) {
  let h = raw; const faq = [];
  h = h.replace(/<!-- wp:yoast\/faq-block (\{[\s\S]*?\}) -->[\s\S]*?<!-- \/wp:yoast\/faq-block -->/g, (m, j) => { try { JSON.parse(j).questions.forEach(q => faq.push('F: ' + text(q.jsonQuestion) + '\nA: ' + text(q.jsonAnswer))); } catch {} return ''; });
  h = h.replace(/<!-- wp:finanzleser\/([a-z-]+)(?: (\{[^\n]*?\}))? \/?-->/g, (m, typ, j) => { let a = {}; try { a = JSON.parse(j || '{}'); } catch {} return `\n[BLOCK ${typ} ${a.slug || (a.slugs || []).join(',')}]\n`; });
  h = h.replace(/<div class="fl-gam[^"]*" data-finanzleser-gamification="([a-z]+)"[^>]*>([\s\S]*?)<\/div>/g, (m, typ, innen) => { const f = {}; innen.replace(/<p data-gam-field="([a-z_]+)"[^>]*>([\s\S]*?)<\/p>/g, (x, k, v) => { f[k] = text(v); return ''; }); return `\n[SPIEL ${typ}: ${f.frage || f.aussage || f.begriff || f.text || ''}${f.antwort ? ' → ' + f.antwort : ''}${f.stimmt ? ' → ' + f.stimmt : ''}]\n`; });
  h = h.replace(/<!-- \/?wp:[^\n]*?-->/g, '').replace(/<div data-finanzleser-[a-z]+="[^"]*"><\/div>/g, '');
  let n = -1;
  h = h.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (m, t) => `\n\n## ${++n} ${text(t)}\n`).replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (m, t) => `\n### ${text(t)}\n`).replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, (m, t) => `\n#### ${text(t)}\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (m, t) => `\n- ${text(t)}`).replace(/<tr[^>]*>([\s\S]*?)<\/tr>/g, (m, r) => '\n| ' + [...r.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(x => text(x[1])).join(' | '))
    .replace(/<\/p>|<\/table>|<\/ul>|<\/ol>/g, '\n').replace(/<[^>]+>/g, '');
  h = h.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter((l, i, a) => l || (a[i - 1] && a[i - 1] !== '')).join('\n');
  return text(h.replace(/\n/g, '')).replace(//g, '\n') + (faq.length ? '\n\n## FAQ\n' + faq.join('\n') : '');
}
const dir = path.join(wurzel, 'docs/inhalte/text'); fs.mkdirSync(dir, { recursive: true }); const alle = [];
for (const slug of slugs) {
  const r = await fetch(`${BASIS}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&context=edit&_fields=title,content,link`, { headers: { Authorization: AUTH } }); const j = await r.json();
  if (!Array.isArray(j) || !j[0]) { console.error('✗ fehlt', slug); continue; }
  const t = `# ${text(j[0].title.rendered || j[0].title.raw)} (${slug})\n${lesbar(j[0].content.raw)}\n`; fs.writeFileSync(path.join(dir, slug + '.txt'), t); alle.push(t); console.log('✓', slug, t.split(' ').length, 'Wörter');
}
fs.writeFileSync(path.join(dir, '_stapel.txt'), alle.join('\n\n==========\n\n'));
