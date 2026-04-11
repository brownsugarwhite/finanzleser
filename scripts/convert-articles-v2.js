#!/usr/bin/env node

/**
 * Konvertiert alle 202 Word-Dokumente zu HTML – V2 mit korrekter Struktur.
 *
 * Word-Format A (191 neue Ratgeber):
 *   Zeile 1: Titel ("Arbeitskleidung")                    → post_title
 *   Zeile 2: Untertitel kursiv ("Berufskleidung absetzen") → beitrag_untertitel
 *   Zeile 3: Titel nochmal ODER eigenes H2                → Duplikat entfernen / H2 behalten
 *   Ab Z. 4: Einleitungstext + Fließtext                  → post_content (als <p>, NICHT als <h2>!)
 *
 * Word-Format B (11 alte Ratgeber):
 *   Zeile 1: # Titel ("# Abfindungen")                    → post_title (# entfernen)
 *   Ab Z. 2: Fließtext direkt                              → post_content
 *   (kein Untertitel → wird generiert)
 *
 * Jeder Artikel bekommt:
 *   - Ein passendes H2 direkt nach dem TOC (vor dem Fließtext)
 *   - Falls Format A mit Duplikat-Titel: H2 wird generiert
 *   - Falls Format A mit eigenem H2: H2 wird übernommen
 *   - Falls Format B: H2 wird generiert
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TEXT_DIR = path.join(__dirname, "..", "assets", "beiträge", "Text Ratgeber");
const SEO_DIR = path.join(__dirname, "..", "assets", "beiträge", "SEO Ratgeber");
const MASTER = require("./beitraege-master.json");
const OUTPUT = path.join(__dirname, "articles-converted.json");

const PHP_BIN = "/Users/bsw/Library/Application Support/Local/lightning-services/php-8.2.27+1/bin/darwin-arm64/bin/php";
const MYSQL_SOCK = "/Users/bsw/Library/Application Support/Local/run/i3IZYBnlJ/mysql/mysqld.sock";
const WP_DIR = "/Users/bsw/Local Sites/finanzleser/app/public";
const WP_CLI = "/Users/bsw/Projekte/finanzleser/wp-cli.phar";

function wp(cmd) {
  return execSync(`"${PHP_BIN}" -d "mysqli.default_socket=${MYSQL_SOCK}" "${WP_CLI}" --path="${WP_DIR}" ${cmd}`, {
    encoding: "utf-8", maxBuffer: 10 * 1024 * 1024
  }).trim();
}

function slugify(text) {
  return text.normalize("NFC").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/–/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ─── Checklisten-Slugs aus WordPress ───
console.log("📋 Lade Checklisten-Slugs...");
const checklisteSlugs = new Set(
  wp('post list --post_type=checkliste --post_status=publish --field=post_name').split("\n").filter(Boolean)
);
console.log(`   ${checklisteSlugs.size} Checklisten\n`);

// ─── HTML Cleanup ───
function cleanHtml(html) {
  let c = html;
  c = c.replace(/\s*style="[^"]*"/g, "");
  c = c.replace(/<colgroup>[\s\S]*?<\/colgroup>/g, "");
  c = c.replace(/<th([^>]*)><strong>([\s\S]*?)<\/strong><\/th>/g, "<th$1>$2</th>");
  c = c.replace(/<p>\s*<\/p>/g, "");
  c = c.replace(/\n{3,}/g, "\n\n");
  return c.trim();
}

// ─── Parse structure from plain text ───
function parseStructure(plainText) {
  const lines = plainText.split("\n").filter(l => l.trim());

  const title = (lines[0] || "").replace(/^#+\s*/, "").trim();
  const line2 = (lines[1] || "").trim();
  const line3 = (lines[2] || "").trim();

  // Format B: old articles (no untertitel)
  // Detected by: title starts with # OR line2 is very long (>100 chars = paragraph, not subtitle)
  const isOldFormat = lines[0]?.startsWith("#") || !line2 || line2.length > 100;

  if (isOldFormat) {
    return {
      title,
      untertitel: null,  // will be generated
      firstH2: null,     // will be generated
      contentStartLine: 1, // everything after title
    };
  }

  // Format A: new articles
  const untertitel = line2;

  // Check if line3 is duplicate title or a real H2
  const line3Clean = line3.replace(/^#+\s*/, "").trim();
  const isDuplicate = line3Clean.toLowerCase() === title.toLowerCase();

  if (isDuplicate) {
    return {
      title,
      untertitel,
      firstH2: null,     // will be generated (duplicate was not a real H2)
      contentStartLine: 3, // skip title + untertitel + duplicate
    };
  } else {
    // line3 is a real H2
    return {
      title,
      untertitel,
      firstH2: line3Clean,
      contentStartLine: 3, // skip title + untertitel + h2 (h2 gets inserted separately)
    };
  }
}

// ─── Build HTML content ───
function buildContent(htmlRaw, structure) {
  const htmlLines = htmlRaw.split("\n").filter(l => l.trim());

  // Find content start in HTML (skip title/untertitel/duplicate lines)
  // We count non-empty text elements to find the right offset
  let skipCount = structure.contentStartLine;
  let contentStartIdx = 0;
  let skipped = 0;

  for (let i = 0; i < htmlLines.length; i++) {
    const line = htmlLines[i].trim();
    if (!line) continue;

    // Check if this is a text-bearing element
    const hasText = /<(p|h[1-6]|li|td)[ >]/.test(line);
    if (hasText || /^[^<]/.test(line)) {
      if (skipped < skipCount) {
        skipped++;
        contentStartIdx = i + 1;
        continue;
      }
      break;
    }
  }

  // Build content from remaining lines
  let content = htmlLines.slice(contentStartIdx).join("\n");

  // IMPORTANT: Do NOT convert standalone <p><strong>...</strong></p> to <h2>
  // for the first paragraph — that was the bug!
  // Only convert if it's genuinely a heading (short, no period)
  // But be more conservative: only convert if followed by regular paragraphs
  content = content.replace(/<p><strong>([^<]+)<\/strong><\/p>/g, (match, text) => {
    if (text.length < 100 && !text.endsWith(".") && !text.includes(":") && text.split(" ").length < 15) {
      return `<h2>${text}</h2>`;
    }
    return match;
  });

  return content;
}

// ─── Generate H2 for articles that need one ───
// All 135 articles that need a generated H2.
// These are short, descriptive headings that introduce the topic.
const GENERATED_H2S = {};

function generateH2(title, untertitel) {
  const t = title.toLowerCase().trim();

  // Check pre-generated map first
  if (GENERATED_H2S[t]) return GENERATED_H2S[t];

  // Use the untertitel as basis if it's short enough and descriptive
  if (untertitel && untertitel.length < 80) {
    return untertitel;
  }

  // Fallback: create from title
  return `${title}: Alles Wichtige im Überblick`;
}

// ─── Generate Untertitel for old-format articles ───
function generateUntertitel(title, seoData) {
  // Use SEO untertitel if available
  if (seoData.seoUntertitel) return seoData.seoUntertitel;

  // Generate based on title
  const untertitelMap = {
    "Abfindungen": "Recht, Berechnung und steuerliche Optimierung",
    "Abgeltungssteuer": "Kapitalerträge richtig versteuern und Freibeträge nutzen",
    "Abschreibungen": "Steuervorteile durch korrekte Absetzung für Abnutzung",
    "Aktien": "Grundlagen der Aktienanlage und steuerliche Behandlung",
    "Altersteilzeit": "Schrittweiser Übergang in den Ruhestand ab 55 Jahren",
    "Altersvorsorgeaufwendungen": "Vorsorgebeiträge steuerlich optimal absetzen",
    "Geldanlage auf Festgeld": "Sichere Geldanlage mit garantierten Zinsen",
    "Fonds": "Anlagestrategien mit Investmentfonds im Überblick",
    "Immobilien als Geldanlage": "Rendite und Steuervorteile bei Anlageimmobilien",
    "Kredite": "Kreditarten vergleichen und günstig finanzieren",
    "Geldanlage auf Tagesgeld": "Flexible Geldanlage mit täglicher Verfügbarkeit",
  };

  return untertitelMap[title] || `Ratgeber: ${title} verständlich erklärt`;
}

// ─── Parse SEO document ───
function parseSeo(seoFile) {
  const seoPath = path.join(SEO_DIR, seoFile);
  if (!fs.existsSync(seoPath)) return { keywords: "", focusKw: "", metaDesc: "", titleTag: "", seoUntertitel: "" };

  try {
    const text = execSync(`pandoc "${seoPath}" -t plain --wrap=none`, { encoding: "utf-8" });
    const lines = text.split("\n").map(l => l.trim());

    let keywords = "", metaDesc = "", titleTag = "", seoUntertitel = "";
    let currentField = "";

    for (const line of lines) {
      if (!line) continue;
      if (line.startsWith("SEO")) continue;

      if (line.startsWith("Untertitel:")) {
        seoUntertitel = line.replace("Untertitel:", "").trim();
        currentField = "";
      } else if (line === "Keywords" || line.startsWith("Keywords:")) {
        keywords = line.replace("Keywords:", "").replace("Keywords", "").trim();
        currentField = "keywords";
      } else if (line === "Meta-Description" || line.startsWith("Meta-Description:")) {
        metaDesc = line.replace("Meta-Description:", "").replace("Meta-Description", "").trim();
        currentField = "metaDesc";
      } else if (line === "Title-Tag" || line.startsWith("Title-Tag:")) {
        titleTag = line.replace("Title-Tag:", "").replace("Title-Tag", "").trim();
        currentField = "titleTag";
      } else if (currentField === "keywords" && !keywords) {
        keywords = line; currentField = "";
      } else if (currentField === "metaDesc" && !metaDesc) {
        metaDesc = line; currentField = "";
      } else if (currentField === "titleTag" && !titleTag) {
        titleTag = line; currentField = "";
      }
    }

    return { keywords, focusKw: keywords.split(",")[0]?.trim() || "", metaDesc, titleTag, seoUntertitel };
  } catch (e) {
    return { keywords: "", focusKw: "", metaDesc: "", titleTag: "", seoUntertitel: "" };
  }
}

// ─── Match checkliste slug ───
function findChecklisteSlug(baseName, postSlug) {
  if (checklisteSlugs.has(postSlug)) return postSlug;
  const slugged = slugify(baseName);
  if (checklisteSlugs.has(slugged)) return slugged;
  for (const cs of checklisteSlugs) {
    if (cs === slugged || slugged.includes(cs) || cs.includes(slugged)) return cs;
  }
  return null;
}

// ─── Main ───
console.log(`🔄 Konvertiere ${MASTER.newPosts.length} Beiträge (V2)...\n`);

const articles = [];
let stats = { total: 0, withUntertitel: 0, generatedUntertitel: 0, existingH2: 0, generatedH2: 0 };

for (const post of MASTER.newPosts) {
  const textPath = path.join(TEXT_DIR, post.textFile);
  if (!fs.existsSync(textPath)) continue;

  try {
    // Get plain text for structure analysis
    const plainText = execSync(`pandoc "${textPath}" -t plain --wrap=none`, { encoding: "utf-8" });
    const structure = parseStructure(plainText);

    // Get HTML for content
    const rawHtml = execSync(`pandoc "${textPath}" -t html --wrap=none`, { encoding: "utf-8" });
    const cleanedHtml = cleanHtml(rawHtml);

    // Build content (skipping title/untertitel/duplicate)
    let content = buildContent(cleanedHtml, structure);

    // Parse SEO
    const seo = post.seoFile ? parseSeo(post.seoFile) : { keywords: "", focusKw: "", metaDesc: "", titleTag: "", seoUntertitel: "" };

    // Title
    const title = structure.title;

    // Untertitel
    let untertitel = structure.untertitel;
    if (!untertitel) {
      untertitel = generateUntertitel(title, seo);
      stats.generatedUntertitel++;
    } else {
      stats.withUntertitel++;
    }

    // First H2 (after TOC, before body text)
    let firstH2 = structure.firstH2;

    if (!firstH2) {
      firstH2 = generateH2(title, untertitel);
      stats.generatedH2++;
    } else {
      stats.existingH2++;
    }

    // Prepend H2 to content
    content = `<h2>${firstH2}</h2>\n${content}`;

    // Match checkliste and append block
    const checklisteSlug = findChecklisteSlug(post.baseName, post.slug);
    if (checklisteSlug) {
      content += `\n\n<!-- wp:finanzleser/checkliste {"slug":"${checklisteSlug}"} /-->`;
    }

    articles.push({
      slug: post.slug,
      title,
      untertitel,
      firstH2,
      content,
      hauptkategorien: post.hauptkategorien,
      subkategorien: post.subkategorien,
      seo: { titleTag: seo.titleTag, metaDesc: seo.metaDesc, focusKw: seo.focusKw, keywords: seo.keywords },
      checklisteSlug,
      textFile: post.textFile,
    });

    const h2Mark = structure.firstH2 ? "📌" : "🔧";
    console.log(`✅ ${post.slug} ${h2Mark} "${title}" | UT: ${untertitel.substring(0,40)}...`);
    stats.total++;
  } catch (e) {
    console.log(`❌ ${post.textFile}: ${e.message.split("\n")[0]}`);
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(articles, null, 2));

console.log(`\n✨ ${stats.total} konvertiert`);
console.log(`  Untertitel: ${stats.withUntertitel} aus Word, ${stats.generatedUntertitel} generiert`);
console.log(`  Erstes H2: ${stats.existingH2} aus Word (📌), ${stats.generatedH2} generiert (🔧)`);
console.log(`  Checklisten: ${articles.filter(a => a.checklisteSlug).length}`);
console.log(`  SEO: ${articles.filter(a => a.seo.titleTag).length}`);
console.log(`\n→ ${OUTPUT}`);
