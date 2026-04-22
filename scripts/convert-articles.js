#!/usr/bin/env node

/**
 * Konvertiert alle 202 Word-Dokumente zu HTML und extrahiert SEO-Daten.
 * Nutzt pandoc für die Konvertierung.
 * Output: scripts/articles-converted.json
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TEXT_DIR = path.join(__dirname, "..", "assets", "beiträge", "Text Ratgeber");
const SEO_DIR = path.join(__dirname, "..", "assets", "beiträge", "SEO Ratgeber");
const MASTER = require("./beitraege-master.json");
const OUTPUT = path.join(__dirname, "articles-converted.json");

// ─── Checklisten-Slugs aus WordPress holen ───
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

// Get all checkliste slugs from WP
console.log("📋 Lade Checklisten-Slugs aus WordPress...");
const checklisteSlugs = new Set(
  wp('post list --post_type=checkliste --post_status=publish --field=post_name').split("\n").filter(Boolean)
);
console.log(`   ${checklisteSlugs.size} Checklisten gefunden\n`);

// ─── HTML Cleanup ───
function cleanHtml(html) {
  let cleaned = html;

  // Remove inline styles
  cleaned = cleaned.replace(/\s*style="[^"]*"/g, "");

  // Remove colgroup
  cleaned = cleaned.replace(/<colgroup>[\s\S]*?<\/colgroup>/g, "");

  // Remove <strong> from <th> (keep text)
  cleaned = cleaned.replace(/<th([^>]*)><strong>([\s\S]*?)<\/strong><\/th>/g, "<th$1>$2</th>");

  // Convert <p><strong>Text</strong></p> to <h2>Text</h2> (standalone bold paragraphs = headings)
  cleaned = cleaned.replace(/<p><strong>([^<]+)<\/strong><\/p>/g, (match, text) => {
    // Only convert if it looks like a heading (short, no period at end)
    if (text.length < 150 && !text.endsWith(".") && !text.endsWith(":")) {
      return `<h2>${text}</h2>`;
    }
    return match;
  });

  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");

  // Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

// ─── Parse title and untertitel from HTML ───
function extractTitleAndContent(html) {
  const lines = html.split("\n").filter(l => l.trim());

  let title = "";
  let untertitel = "";
  let contentStartIdx = 0;

  // Line 1: Title (usually <h1> or <p> with title text)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip empty lines
    if (!line) continue;

    // Extract text from first meaningful element (HTML or markdown heading)
    const textMatch = line.match(/<(?:h[12]|p)>(.*?)<\/(?:h[12]|p)>/) ||
                      line.match(/^#+\s+(.+)$/);
    if (textMatch) {
      if (!title) {
        title = textMatch[1].replace(/<[^>]+>/g, "").trim();
        contentStartIdx = i + 1;
        continue;
      }
      if (!untertitel) {
        // Line 2: Untertitel (first H2)
        const text = textMatch[1].replace(/<[^>]+>/g, "").trim();
        if (text && text !== title) {
          untertitel = text;
          contentStartIdx = i + 1;
          // Check if next line is duplicate title
          if (contentStartIdx < lines.length) {
            const nextText = lines[contentStartIdx].replace(/<[^>]+>/g, "").trim();
            if (nextText === title) {
              contentStartIdx++; // Skip duplicate
            }
          }
          break;
        }
      }
    }
  }

  // Build content from remaining lines
  let content = lines.slice(contentStartIdx).join("\n");

  // Ensure untertitel is an <h2> in the content
  if (untertitel) {
    content = `<h2>${untertitel}</h2>\n${content}`;
  }

  return { title, untertitel, content };
}

// ─── Parse SEO document ───
function parseSeo(seoFile) {
  const seoPath = path.join(SEO_DIR, seoFile);
  if (!fs.existsSync(seoPath)) return { keywords: "", metaDesc: "", titleTag: "", seoUntertitel: "" };

  try {
    const text = execSync(`pandoc "${seoPath}" -t plain --wrap=none`, { encoding: "utf-8" });
    const lines = text.split("\n").map(l => l.trim());

    let keywords = "";
    let metaDesc = "";
    let titleTag = "";
    let seoUntertitel = "";
    let currentField = "";

    for (const line of lines) {
      if (!line) continue; // Don't reset currentField on blank lines

      if (line.startsWith("Untertitel:")) {
        seoUntertitel = line.replace("Untertitel:", "").trim();
        currentField = "";
      } else if (line.startsWith("SEO")) {
        // Skip "SEO – Title" header
        continue;
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
        keywords = line;
        currentField = "";
      } else if (currentField === "metaDesc" && !metaDesc) {
        metaDesc = line;
        currentField = "";
      } else if (currentField === "titleTag" && !titleTag) {
        titleTag = line;
        currentField = "";
      }
    }

    // Focus keyword = first keyword
    const focusKw = keywords.split(",")[0]?.trim() || "";

    return { keywords, focusKw, metaDesc, titleTag, seoUntertitel };
  } catch (e) {
    console.log(`   ⚠️  SEO parse error: ${seoFile}: ${e.message}`);
    return { keywords: "", focusKw: "", metaDesc: "", titleTag: "", seoUntertitel: "" };
  }
}

// ─── Match checkliste slug ───
function findChecklisteSlug(baseName, postSlug) {
  // Try exact slug match
  if (checklisteSlugs.has(postSlug)) return postSlug;

  // Try slugified baseName
  const slugged = slugify(baseName);
  if (checklisteSlugs.has(slugged)) return slugged;

  // Try partial matches
  for (const cs of checklisteSlugs) {
    if (cs === slugged || slugged.includes(cs) || cs.includes(slugged)) return cs;
  }

  return null;
}

// ─── Main ───
console.log(`🔄 Konvertiere ${MASTER.newPosts.length} Beiträge...\n`);

const articles = [];
let converted = 0;
let errors = 0;

for (const post of MASTER.newPosts) {
  const textPath = path.join(TEXT_DIR, post.textFile);

  if (!fs.existsSync(textPath)) {
    console.log(`❌ ${post.textFile}: nicht gefunden`);
    errors++;
    continue;
  }

  try {
    // Convert with pandoc
    const rawHtml = execSync(`pandoc "${textPath}" -t html --wrap=none`, { encoding: "utf-8" });
    const cleanedHtml = cleanHtml(rawHtml);
    const { title, untertitel, content } = extractTitleAndContent(cleanedHtml);

    // Parse SEO
    const seo = post.seoFile ? parseSeo(post.seoFile) : { keywords: "", focusKw: "", metaDesc: "", titleTag: "", seoUntertitel: "" };

    // Use SEO untertitel if content extraction failed
    const finalUntertitel = untertitel || seo.seoUntertitel || "";

    // Match checkliste
    const checklisteSlug = findChecklisteSlug(post.baseName, post.slug);

    // Append Gutenberg block
    let finalContent = content;
    if (checklisteSlug) {
      finalContent += `\n\n<!-- wp:finanzleser/checkliste {"slug":"${checklisteSlug}"} /-->`;
    }

    articles.push({
      slug: post.slug,
      title: title || post.baseName,
      untertitel: finalUntertitel,
      content: finalContent,
      hauptkategorien: post.hauptkategorien,
      subkategorien: post.subkategorien,
      seo: {
        titleTag: seo.titleTag,
        metaDesc: seo.metaDesc,
        focusKw: seo.focusKw,
        keywords: seo.keywords,
      },
      checklisteSlug,
      textFile: post.textFile,
    });

    const checkMark = checklisteSlug ? "📋" : "⚠️";
    console.log(`✅ ${post.slug} ${checkMark} "${title || post.baseName}"`);
    converted++;
  } catch (e) {
    console.log(`❌ ${post.textFile}: ${e.message}`);
    errors++;
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(articles, null, 2));

const withCheckliste = articles.filter(a => a.checklisteSlug).length;
const withSeo = articles.filter(a => a.seo.titleTag).length;

console.log(`\n✨ ${converted} konvertiert, ${errors} Fehler`);
console.log(`📋 ${withCheckliste} mit Checkliste, ${articles.length - withCheckliste} ohne`);
console.log(`🔍 ${withSeo} mit SEO-Daten`);
console.log(`\n→ ${OUTPUT}`);
