#!/usr/bin/env node

/**
 * Generiert einzigartige H2-Überschriften für 135 Artikel,
 * bei denen aktuell H2 = Untertitel ist.
 * Die H2 wird aus dem ersten Absatz des Fließtexts abgeleitet.
 */

const fs = require("fs");
const path = require("path");

const articles = require("./articles-converted.json");
const OUTPUT = path.join(__dirname, "articles-converted.json");

// For each article where H2 = untertitel, generate a unique H2
// based on the first paragraph content
let updated = 0;

for (const article of articles) {
  if (article.firstH2 !== article.untertitel) continue;

  // Extract first <p> content after the H2
  const content = article.content;
  // Skip the first <h2> (which is our generated one), find next <p>
  const afterH2 = content.replace(/^<h2>[^<]*<\/h2>\s*/, "");
  const firstPMatch = afterH2.match(/<p>([\s\S]*?)<\/p>/);

  if (!firstPMatch) continue;

  const firstPara = firstPMatch[1].replace(/<[^>]+>/g, "").trim();

  // Generate H2: take first sentence, max ~80 chars
  let h2;
  const sentences = firstPara.split(/\.\s+/);
  const firstSentence = sentences[0]?.trim();

  if (firstSentence && firstSentence.length <= 90) {
    // Use first sentence as-is (without trailing period)
    h2 = firstSentence.replace(/\.$/, "");
  } else if (firstSentence) {
    // Shorten: cut at ~80 chars at word boundary
    const words = firstSentence.split(" ");
    let result = "";
    for (const word of words) {
      if ((result + " " + word).length > 80) break;
      result = result ? result + " " + word : word;
    }
    h2 = result;
  } else {
    h2 = `${article.title}: Alles Wichtige im Überblick`;
  }

  // Make sure H2 is different from untertitel
  if (h2 === article.untertitel) {
    // Try second sentence
    if (sentences[1]) {
      h2 = sentences[1].trim().replace(/\.$/, "");
      if (h2.length > 90) {
        const words = h2.split(" ");
        let result = "";
        for (const word of words) {
          if ((result + " " + word).length > 80) break;
          result = result ? result + " " + word : word;
        }
        h2 = result;
      }
    }
  }

  // Update the article
  article.firstH2 = h2;

  // Update content: replace first <h2>
  article.content = article.content.replace(
    /^<h2>[^<]*<\/h2>/,
    `<h2>${h2}</h2>`
  );

  console.log(`✅ ${article.slug}`);
  console.log(`   UT: ${article.untertitel}`);
  console.log(`   H2: ${h2}\n`);
  updated++;
}

fs.writeFileSync(OUTPUT, JSON.stringify(articles, null, 2));
console.log(`\n✨ ${updated} H2s generiert → ${OUTPUT}`);
